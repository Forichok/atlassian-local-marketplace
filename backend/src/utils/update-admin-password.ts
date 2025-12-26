import { prisma } from '../lib/prisma';
import * as bcrypt from 'bcryptjs';

async function updateAdminPassword() {
  const username = 'admin';
  const newPassword = 'jirarip2028';

  const passwordHash = await bcrypt.hash(newPassword, 10);

  try {
    await prisma.user.update({
      where: { username },
      data: { passwordHash },
    });

    console.log(`Admin password updated successfully`);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
