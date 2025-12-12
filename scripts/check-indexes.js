#!/usr/bin/env node
const { Client } = require('pg');

const connectionString = process.env.STAGING_DATABASE_URL;

if (!connectionString) {
  console.error('❌ STAGING_DATABASE_URL environment variable not set');
  process.exit(1);
}

async function checkIndexes() {
  const client = new Client({ connectionString });

  try {
    await client.connect();

    console.log('📋 Checking all indexes in the database...\n');

    const result = await client.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          indexname LIKE '%shooter%'
          OR indexname LIKE '%athlete%'
          OR indexname LIKE '%Shooter%'
          OR indexname LIKE '%Athlete%'
        )
      ORDER BY tablename, indexname;
    `);

    if (result.rows.length === 0) {
      console.log('No indexes found matching shooter/athlete patterns');
    } else {
      console.log(`Found ${result.rows.length} indexes:\n`);
      result.rows.forEach(row => {
        console.log(`Table: ${row.tablename}`);
        console.log(`Index: ${row.indexname}`);
        console.log(`Definition: ${row.indexdef}`);
        console.log('---');
      });
    }

    // Also check all indexes on key tables
    console.log('\n📋 All indexes on key tables:\n');
    const allIndexes = await client.query(`
      SELECT
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('Registration', 'SquadMember', 'Shoot', 'TeamJoinRequest', 'Shooter', 'ShooterAverage')
      ORDER BY tablename, indexname;
    `);

    const grouped = {};
    allIndexes.rows.forEach(row => {
      if (!grouped[row.tablename]) grouped[row.tablename] = [];
      grouped[row.tablename].push(row.indexname);
    });

    Object.entries(grouped).forEach(([table, indexes]) => {
      console.log(`${table}:`);
      indexes.forEach(idx => console.log(`  - ${idx}`));
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkIndexes();
