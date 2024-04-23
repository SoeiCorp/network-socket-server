import { Client, Pool, QueryResultRow } from 'pg'

const globalPg = new Pool({
    connectionString: process.env.NEON_PG_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})
// Creates a global connection pool
export const pg = globalPg