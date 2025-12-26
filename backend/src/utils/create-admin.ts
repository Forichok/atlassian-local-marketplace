import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'jirarip2028';

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    console.log(`Admin user created: ${user.username}`);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
