import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = "07puni@gmail.com";
  const password = "NicePuni#123";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: {
      email,
    },
    update: {
      passwordHash,
    },
    create: {
      email,
      passwordHash,
    },
  });

  console.log("Admin created successfully!");
  console.log("Email:", admin.email);
  console.log("Password:", password);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });