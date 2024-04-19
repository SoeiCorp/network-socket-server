import type { Config } from "drizzle-kit"

export default {
  schema: "./drizzle/schemas/*",
  out: "./drizzle/migrations",
  driver: "pg",
  dbCredentials: {
    host: process.env.DB_HOST || "",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "",
    ssl: true,
  },
  strict: true,
} satisfies Config
