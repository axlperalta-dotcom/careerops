import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import * as schema from "./schema";
import { Repository } from "./repository";

const globalDb = globalThis as unknown as { careerops?: Promise<Repository> };
export function getRepository() {
  if (!globalDb.careerops)
    globalDb.careerops = initialize().catch((error) => {
      globalDb.careerops = undefined;
      throw error;
    });
  return globalDb.careerops;
}
async function initialize() {
  const dataDir =
    process.env.CAREEROPS_DATA_DIR ||
    path.join(process.cwd(), ".data", "careerops");
  await mkdir(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  try {
    await client.exec(
      await readFile(
        path.join(process.cwd(), "migrations", "0000_initial.sql"),
        "utf8",
      ),
    );
    const repository = new Repository(drizzle(client, { schema }));
    await repository.seed();
    return repository;
  } catch (error) {
    await client.close();
    throw error;
  }
}
