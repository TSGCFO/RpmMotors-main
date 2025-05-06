import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Validate that DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set (pointing at your Supabase Postgres)');
}

// Instantiate a Postgres pool with SSL enabled for Supabase
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Initialize Drizzle ORM with your schema
export const db = drizzle(pool, { schema });
