const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, password: true, createdAt: true }
  });
  
  console.log('=== Users in database ===');
  users.forEach(u => {
    const isBcrypt = u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$');
    const isBase64 = !isBcrypt && /^[A-Za-z0-9+/=]+$/.test(u.password) && u.password.length < 100;
    const status = isBcrypt ? 'BCRYPT (secure)' : isBase64 ? 'BASE64 (legacy - needs migration)' : 'UNKNOWN';
    console.log(`  ${u.email}: ${status} (length: ${u.password.length})`);
  });
}

main().then(() => prisma.$disconnect());
