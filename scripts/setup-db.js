const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

const sql = neon(connectionString);

async function executeSqlFile(filePath) {
  console.log(`\nExecuting ${path.basename(filePath)}...`);
  
  // Read the raw SQL content
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // A simplistic way to process multiple statements with Neon HTTP driver:
  // Split strings by semicolon, but do not split if inside single quotes (in a perfect parser)
  // For basic schema and seeds, splitting by ';' usually works fine.
  const statements = content.split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    // Only execute if there's actual SQL left (not just comments)
    const activeCode = statement.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
    
    if (activeCode.length > 0) {
      try {
        await sql(activeCode);
        console.log(`✓ Executed line snippet: ${activeCode.split('\n')[0].substring(0, 60)}...`);
      } catch (e) {
          console.error(`\n✗ Failed executing: ${activeCode.substring(0, 60)}...`);
          console.error(e.message);
          throw e; // Stop execution on failure
      }
    }
  }
}

async function run() {
  try {
    await executeSqlFile(path.join(__dirname, '001-schema.sql'));
    await executeSqlFile(path.join(__dirname, '002-seed.sql'));
    console.log('\n✅ Database reset and seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Setup failed. Please check the error above.');
    process.exit(1);
  }
}

run();
