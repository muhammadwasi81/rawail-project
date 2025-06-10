const { Pool } = require("pg");

const pool = new Pool({
  host: "ep-dry-term-a5kqndiy-pooler.us-east-2.aws.neon.tech",
  port: 5432,
  database: "neondb",
  user: "neondb_owner",
  password: "npg_rlEoDPKe46Cc",
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
});

// Test the connection
pool.on("connect", () => {
  console.log("Connected to Neon PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});

module.exports = pool;
