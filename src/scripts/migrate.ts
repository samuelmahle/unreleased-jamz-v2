import { migrateArtists } from './migrateArtists';

console.log('Starting migration...');

migrateArtists()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 