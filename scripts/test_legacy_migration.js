const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a legacy user with base64-encoded password
  const legacyPassword = 'legacypass123';
  const base64Hash = Buffer.from(legacyPassword).toString('base64');
  
  console.log(`Creating legacy user with base64 password: ${base64Hash}`);
  
  // Delete if exists first
  await prisma.user.deleteMany({ where: { email: 'legacy@example.com' } });
  
  const legacyUser = await prisma.user.create({
    data: {
      email: 'legacy@example.com',
      name: 'Legacy User',
      password: base64Hash, // base64-encoded (insecure legacy)
    }
  });
  
  console.log(`Legacy user created: ${legacyUser.id}`);
  console.log(`Stored password: ${legacyUser.password}`);
  console.log('Now testing login (should auto-migrate to bcrypt)...');
  
  // Test login - should detect base64, validate, then auto-migrate to bcrypt
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'legacy@example.com', password: legacyPassword })
  });
  const data = await res.json();
  console.log('Login response:', data);
  
  // Now check if password was migrated to bcrypt
  const updatedUser = await prisma.user.findUnique({
    where: { id: legacyUser.id }
  });
  
  const isBcrypt = updatedUser.password.startsWith('$2a$') || updatedUser.password.startsWith('$2b$') || updatedUser.password.startsWith('$2y$');
  console.log(`\nPassword after login: ${updatedUser.password.substring(0, 30)}...`);
  console.log(`Migration to bcrypt: ${isBcrypt ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  
  if (isBcrypt) {
    console.log('\n✅ Auto-migration from base64 to bcrypt works correctly!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
