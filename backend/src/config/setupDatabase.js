import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    console.log('Database setup completed successfully!');
    console.log('Tables created:');
    console.log('   - users');
    console.log('   - events');
    console.log('   - groups');
    console.log('   - group_members');
    console.log('   - group_events');
    console.log('   - event_rsvps');
    console.log('   - saved_events');
    console.log('   - group_posts');
    console.log('   - group_messages');

    // Close pool
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
