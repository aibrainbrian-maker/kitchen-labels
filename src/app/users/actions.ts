"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/auth";

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function fail(message: string): never {
  redirect(`/users?error=${encodeURIComponent(message)}`);
}

/** Adds a new staff login. */
export async function addUser(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) fail("Enter a name.");
  if (!EMAIL_RE.test(email)) fail("Enter a valid email address.");
  if (password.length < MIN_PASSWORD)
    fail(`Password must be at least ${MIN_PASSWORD} characters.`);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) fail(`A login for ${email} already exists.`);

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ name, email, passwordHash });

  revalidatePath("/users");
  redirect("/users?added=1");
}

/** Sets a new password for an existing login. */
export async function resetPassword(id: number, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD)
    fail(`Password must be at least ${MIN_PASSWORD} characters.`);

  const passwordHash = await bcrypt.hash(password, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));

  revalidatePath("/users");
  redirect("/users?reset=1");
}

/** Removes a login. Can't remove yourself or the last remaining login. */
export async function deleteUser(id: number) {
  const session = await auth();
  if (session?.user?.id && Number(session.user.id) === id) {
    fail("You can't delete the login you're signed in with.");
  }
  const count = await db.$count(users);
  if (count <= 1) fail("You can't delete the only login.");

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/users");
  redirect("/users");
}
