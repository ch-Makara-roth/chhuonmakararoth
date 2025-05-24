
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'Admin@123'; // The password you want to set
  const saltRounds = 10; // Standard salt rounds for bcrypt

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`User ${adminEmail} already exists. Updating password.`);
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        hashedPassword: hashedPassword,
        name: existingUser.name || 'Administrator', // Keep existing name or default
      },
    });
    console.log('Admin user password updated:', { id: updatedUser.id, email: updatedUser.email });
  } else {
    console.log(`User ${adminEmail} does not exist. Creating user.`);
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    const newUser = await prisma.user.create({
      data: {
        email: adminEmail,
        hashedPassword: hashedPassword,
        name: 'Administrator', // Default name
      },
    });
    console.log('Admin user created:', { id: newUser.id, email: newUser.email });
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
