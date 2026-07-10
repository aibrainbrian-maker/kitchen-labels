import bcrypt from "bcryptjs";
import { db } from "./index";
import { users } from "./schema";

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error(
      "Usage: npm run db:create-user -- \"Full Name\" email@example.com password123"
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .insert(users)
    .values({ name, email: email.toLowerCase().trim(), passwordHash })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, name },
    });

  console.log(`User ready: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
