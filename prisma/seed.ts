
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { projectsData, journeyData, skillsData } from '../src/lib/data'; // Adjusted path

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Seed Admin User
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'Admin@123';
  const saltRounds = 10;

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log(`User ${adminEmail} already exists. Updating password.`);
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        hashedPassword: hashedPassword,
        name: existingUser.name || 'Administrator',
      },
    });
    console.log('Admin user password updated.');
  } else {
    console.log(`User ${adminEmail} does not exist. Creating user.`);
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    await prisma.user.create({
      data: {
        email: adminEmail,
        hashedPassword: hashedPassword,
        name: 'Administrator',
      },
    });
    console.log('Admin user created.');
  }

  // 2. Seed Projects
  console.log('Seeding projects...');
  for (const project of projectsData) {
    const { id: staticId, ...projectData } = project; // Exclude the static 'id'
    try {
      await prisma.project.upsert({
        where: { slug: projectData.slug },
        update: projectData,
        create: projectData,
      });
      console.log(`Upserted project: ${projectData.title}`);
    } catch (error) {
      console.error(`Failed to upsert project ${projectData.title}:`, error);
    }
  }
  console.log('Project seeding complete.');

  // 3. Seed Experience (Journey Items)
  console.log('Seeding experience entries...');
  for (const item of journeyData) {
    const { id: staticId, ...experienceData } = item; // Exclude the static 'id'
    try {
      await prisma.experience.upsert({
        where: { title_date: { title: experienceData.title, date: experienceData.date } },
        update: experienceData,
        create: experienceData,
      });
      console.log(`Upserted experience: ${experienceData.title} - ${experienceData.company || 'N/A'}`);
    } catch (error) {
      console.error(`Failed to upsert experience ${experienceData.title}:`, error);
    }
  }
  console.log('Experience seeding complete.');

  // 4. Seed Skills
  console.log('Seeding skills...');
  for (const skill of skillsData) {
    const { id: staticId, icon, ...skillData } = skill; // Exclude static 'id' and 'icon'
    try {
      await prisma.skill.upsert({
        where: { name: skillData.name },
        update: skillData,
        create: skillData,
      });
      console.log(`Upserted skill: ${skillData.name}`);
    } catch (error) {
      console.error(`Failed to upsert skill ${skillData.name}:`, error);
    }
  }
  console.log('Skill seeding complete.');

  console.log('Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
