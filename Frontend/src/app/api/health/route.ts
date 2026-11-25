import { NextResponse } from 'next/server';
import { setGlobalDispatcher, Agent } from 'undici';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

// Set global dispatcher for network reliability
setGlobalDispatcher(
  new Agent({
    connect: {
      timeout: 30000,
      autoSelectFamily: false
    }
  })
);

export async function GET() {
  try {
    const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!rawUrl) {
      return NextResponse.json(
        { status: 'error', message: 'DATABASE_URL is not set' },
        { status: 500 }
      );
    }

    const cleanUrl = rawUrl
      .replace('&channel_binding=require', '')
      .replace('channel_binding=require&', '')
      .replace('channel_binding=require', '')
      .replace('-pooler', '');

    const sql = neon(cleanUrl);
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      service: 'Neon PostgreSQL (Lakebase)',
      timestamp: result[0]?.current_time,
      version: result[0]?.pg_version,
      tables: tablesResult.map(r => r.table_name)
    });
  } catch (error: any) {
    console.error('Health route error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Database connection error',
        cause: error?.cause ? String(error.cause) : undefined
      },
      { status: 500 }
    );
  }
}
