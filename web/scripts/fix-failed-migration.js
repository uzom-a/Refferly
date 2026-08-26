const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFailedMigration() {
  try {
    console.log('Checking for failed migrations...');
    
    // Delete the failed migration record
    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20251202125815_fix_enum_types' AND finished_at IS NULL;`
    );
    
    console.log('Failed migration record cleaned up (if it existed).');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing migration:', error);
    await prisma.$disconnect();
    // Don't fail the build if this errors - migrations might not exist yet
    process.exit(0);
  }
}

fixFailedMigration();

