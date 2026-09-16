import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import * as schema from "../src/lib/schema";
import { Repository, RecordNotFound } from "../src/lib/repository";
import { commandSchema } from "../src/lib/model";

describe("durable local workspace", () => {
  let client: PGlite;
  let repo: Repository;
  let folder: string;
  beforeAll(async () => {
    folder = await mkdtemp(path.join(tmpdir(), "careerops-test-"));
    client = new PGlite(folder);
    await client.exec(await readFile("migrations/0000_initial.sql", "utf8"));
    repo = new Repository(drizzle(client, { schema }));
    await repo.seed();
  });
  afterAll(async () => {
    await client?.close();
    if (
      folder &&
      path.dirname(path.resolve(folder)) === path.resolve(tmpdir()) &&
      path.basename(folder).startsWith("careerops-test-")
    ) {
      await rm(folder, { recursive: true, force: true });
    }
  });

  it("seeds once without inventing completed work", async () => {
    await repo.seed();
    const state = await repo.snapshot();
    expect(state.jobs).toHaveLength(1);
    expect(state.projects[0].status).toBe("Por empezar");
    expect(state.tasks.every((t) => !t.done)).toBe(true);
    expect(state.tasks[0].title).toBe(
      "Guardar una vacante y revisar sus requisitos",
    );
  });
  it("does not duplicate progress events when the same completion is retried", async () => {
    const task = (await repo.snapshot()).tasks[0];
    const command = { type: "toggleTask" as const, id: task.id, done: true };
    await repo.execute(command);
    const before = await repo.snapshot();
    await repo.execute(command);
    const after = await repo.snapshot();
    expect(after.activities).toHaveLength(before.activities.length);
    expect(after.tasks.find((t) => t.id === task.id)?.done).toBe(true);
  });
  it("rolls back an invalid link without recording a misleading success", async () => {
    const state = await repo.snapshot();
    await expect(
      repo.execute({
        type: "saveProject",
        data: {
          ...state.projects[0],
          jobId: crypto.randomUUID(),
          title: "Invalid link",
        },
      }),
    ).rejects.toBeInstanceOf(RecordNotFound);
    const after = await repo.snapshot();
    expect(after.projects).toHaveLength(state.projects.length);
    expect(after.activities).toHaveLength(state.activities.length);
  });
  it("persists notes and tasks across a database restart", async () => {
    const project = (await repo.snapshot()).projects[0];
    await repo.execute({
      type: "addNote",
      projectId: project.id,
      body: "Probé el formulario de vacantes.",
      url: "https://example.com/evidence",
    });
    await client.close();
    client = new PGlite(folder);
    repo = new Repository(drizzle(client, { schema }));
    const state = await repo.snapshot();
    expect(
      state.activities.some(
        (a) => a.body === "Probé el formulario de vacantes.",
      ),
    ).toBe(true);
    expect(state.tasks[0].done).toBe(true);
  });
  it("preserves projects when their vacancy is deleted", async () => {
    const job = (await repo.snapshot()).jobs[0];
    await repo.execute({ type: "deleteJob", id: job.id });
    const state = await repo.snapshot();
    expect(state.jobs).toHaveLength(0);
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].jobId).toBeNull();
    expect(state.tasks).toHaveLength(4);
  });
  it("removes project tasks but retains notes, and never re-seeds deleted records", async () => {
    const project = (await repo.snapshot()).projects[0];
    await repo.execute({ type: "deleteProject", id: project.id });
    await repo.seed();
    const state = await repo.snapshot();
    expect(state.jobs).toHaveLength(0);
    expect(state.projects).toHaveLength(0);
    expect(state.tasks).toHaveLength(0);
    expect(
      state.activities.find((a) => a.kind === "note")?.projectId,
    ).toBeNull();
  });
});

describe("input boundaries", () => {
  it("rejects script links, blank titles and unknown states", () => {
    const valid = {
      type: "saveJob",
      data: {
        title: "Engineer",
        company: "Example",
        area: "Software",
        status: "Guardada",
        url: "",
        description: "",
        skills: ["React"],
      },
    };
    expect(commandSchema.safeParse(valid).success).toBe(true);
    for (const patch of [
      { url: "javascript:alert(1)" },
      { title: "  " },
      { status: "Invalid" },
      { skills: Array(41).fill("React") },
    ]) {
      expect(
        commandSchema.safeParse({ ...valid, data: { ...valid.data, ...patch } })
          .success,
      ).toBe(false);
    }
  });
});
