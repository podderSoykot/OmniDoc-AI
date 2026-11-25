import { setGlobalDispatcher, Agent } from 'undici';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configure undici dispatcher to avoid IPv6 connectivity blackholes on local networks
setGlobalDispatcher(
  new Agent({
    connect: {
      timeout: 30000,
      autoSelectFamily: false
    }
  })
);

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!rawUrl) {
  console.error('ERROR: DATABASE_URL not found in .env.local');
  process.exit(1);
}

const dbUrl = rawUrl
  .replace('&channel_binding=require', '')
  .replace('channel_binding=require&', '')
  .replace('channel_binding=require', '')
  .replace('-pooler', '');

console.log('Testing Neon PostgreSQL connection with @neondatabase/serverless...');
console.log('Target host:', dbUrl.split('@')[1]?.split('/')[0]);

try {
  const sql = neon(dbUrl);
  const versionResult = await sql`SELECT version();`;
  console.log('✅ Connection SUCCESSFUL!');
  console.log('Version:', versionResult[0].version);

  const tablesResult = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('Tables found in Neon database:', tablesResult.map(r => r.table_name));
  console.log('✅ Neon Postgres service verified end-to-end!');
} catch (error) {
  console.error('❌ Connection failed:', error);
  process.exit(1);
}
