import type { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Explicit ordering keeps migrations reproducible in development, tests and builds.
export async function migrate(client: PGlite) {
  for (const name of ["0000_initial.sql", "0001_requirements.sql"]) {
    const sql = await readFile(
      path.join(process.cwd(), "migrations", name),
      "utf8",
    );
    await client.transaction(async (tx) => {
      await tx.exec(
        "CREATE TABLE IF NOT EXISTS app_meta (key text PRIMARY KEY)",
      );
      const key = `migration:${name}`;
      const applied = await tx.query(
        "SELECT key FROM app_meta WHERE key = $1",
        [key],
      );
      if (applied.rows.length) return;
      await tx.exec(sql);
      await tx.query("INSERT INTO app_meta (key) VALUES ($1)", [key]);
    });
  }
}
