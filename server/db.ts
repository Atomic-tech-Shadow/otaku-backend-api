import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use specified Neon PostgreSQL database - configured permanently
const NEON_DATABASE_URL = "postgresql://neondb_owner:npg_mtSpzriYuV56@ep-round-lake-a8zn7f2c-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require";

// Override environment variable with specified database
process.env.DATABASE_URL = NEON_DATABASE_URL;

console.log("Using specified Neon PostgreSQL database (permanently configured)");

export const pool = new Pool({ 
  connectionString: NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
export const db = drizzle({ client: pool, schema });