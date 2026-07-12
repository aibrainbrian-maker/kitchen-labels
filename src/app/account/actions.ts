"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/auth";

const MIN_PASSWORD = 8;

function fail(message: string): never {
  redirect(`/account?error=${encodeURIComponent(message)}`);
}

/** Lets the signed-in user change their own password (confirming the old one). */
export async function changeMyPassword(formData: FormData) {
  const session = await auth();
  const id = session?.user?.id ? Number(session.user.id) : null;
  if (!id) redirect("/login");

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < MIN_PASSWORD)
    fail(`New password must be at least ${MIN_PASSWORD} characters.`);
  if (next !== confirm) fail("The new passwords don't match.");

  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) redirect("/login");
  if (!(await bcrypt.compare(current, user.passwordHash))) {
    fail("Your current password is incorrect.");
  }
  if (await bcrypt.compare(next, user.passwordHash)) {
    fail("Your new password must be different from your current one.");
  }

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(next, 10) })
    .where(eq(users.id, id));

  redirect("/account?changed=1");
}
