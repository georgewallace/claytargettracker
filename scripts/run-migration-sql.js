#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.STAGING_DATABASE_URL;

if (!connectionString) {
  console.error('❌ STAGING_DATABASE_URL environment variable not set');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '../prisma/migrations/20251212084500_rename_shooter_to_athlete/migration-corrected.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    console.log('\n🔍 Checking current table state...');
    const checkTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('Shooter', 'Athlete', 'ShooterAverage', 'AthleteAverage')
      ORDER BY table_name;
    `);
    console.log('Current tables:', checkTables.rows.map(r => r.table_name).join(', '));

    if (checkTables.rows.some(r => r.table_name === 'Athlete')) {
      console.log('\n⚠️  Athlete table already exists - migration may have already been applied');
      console.log('Exiting without making changes');
      process.exit(0);
    }

    if (!checkTables.rows.some(r => r.table_name === 'Shooter')) {
      console.log('\n❌ Shooter table not found - database is in unexpected state');
      process.exit(1);
    }

    console.log('\n🔄 Running migration SQL...');
    await client.query(migrationSql);
    console.log('✅ Migration SQL executed successfully');

    console.log('\n🔍 Verifying migration...');
    const verifyTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('Shooter', 'Athlete', 'ShooterAverage', 'AthleteAverage')
      ORDER BY table_name;
    `);
    console.log('Tables after migration:', verifyTables.rows.map(r => r.table_name).join(', '));

    if (verifyTables.rows.some(r => r.table_name === 'Athlete') &&
        !verifyTables.rows.some(r => r.table_name === 'Shooter')) {
      console.log('\n✅ Migration successful!');
      console.log('  ✅ Athlete table exists');
      console.log('  ✅ Shooter table removed');
    } else {
      console.log('\n❌ Migration verification failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
