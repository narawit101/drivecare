// lib/db.ts
import { Pool, types } from "pg";

// Avoid environment-dependent timezone conversion.
// We keep DATE/TIMESTAMP values as strings and parse them explicitly.
types.setTypeParser(types.builtins.DATE, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMP, (value) => value);

function normalizeDatabaseUrl(url: string): string {
    let normalized = url.trim();

    // Some platforms provide URLs starting with "//" (scheme-relative). pg expects a proper scheme.
    if (normalized.startsWith("//")) {
        normalized = `postgresql:${normalized}`;
    }

    // Defensive: remove accidental unix-socket suffix copied into the URL.
    normalized = normalized.replace(/\/\.s\.PGSQL\.\d+$/, "");

    return normalized;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
    connectionString: normalizeDatabaseUrl(databaseUrl),
    ...(process.env.NODE_ENV === "production"
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
});

export default pool;
