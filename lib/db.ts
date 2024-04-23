import { Client, Pool, QueryResultRow } from 'pg'

const globalForPg = globalThis as unknown as { pg: any }

// Creates a global connection pool
export const pg = globalForPg.pg || new Client({
    connectionString: process.env.NEON_PG_URL,
})

if (process.env.NODE_ENV !== 'production') globalForPg.pg = pg