import { migrateSongs } from './migrateSongs';

async function main() {
  console.log('Running song migration...');
  const result = await migrateSongs();
  
  if (result.success) {
    console.log(`Successfully migrated ${result.migratedCount} songs`);
    process.exit(0);
  } else {
    console.error('Migration failed:', result.error);
    process.exit(1);
  }
}

main(); 