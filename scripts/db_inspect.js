// Inspect SQLite database without sqlite3 CLI
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    const [users, niches, channels, messages, plans, settings] = await Promise.all([
      db.user.count(),
      db.savedNiche.count(),
      db.savedChannel.count(),
      db.chatMessage.count(),
      db.contentPlan.count(),
      db.setting.count(),
    ]);
    console.log(JSON.stringify({
      users, niches, channels, messages, plans, settings
    }, null, 2));

    const sampleUsers = await db.user.findMany({ take: 3, select: { id: true, email: true, name: true } });
    console.log('Sample users:', JSON.stringify(sampleUsers, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await db.$disconnect();
  }
})();
