import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import * as schema from "../src/lib/schema";
import { migrate } from "../src/lib/migrate";
import { Repository, RecordNotFound } from "../src/lib/repository";
import { commandSchema, requirementStatus } from "../src/lib/model";

let client: PGlite;
let repo: Repository;
beforeAll(async () => {
  client = new PGlite();
  // Simulate a real pre-feature database, including its existing seed marker.
  await client.exec(await readFile("migrations/0000_initial.sql", "utf8"));
  repo = new Repository(drizzle(client, { schema }));
  await repo.seed();
});
afterAll(async () => {
  await client?.close();
});

it("upgrades the old schema without changing existing records and can be replayed", async () => {
  const tables = ["jobs", "projects", "tasks", "activities"];
  const before = await Promise.all(
    tables.map((table) => client.query(`SELECT * FROM ${table} ORDER BY id`)),
  );
  await migrate(client);
  await migrate(client);
  await repo.seed();
  const after = await Promise.all(
    tables.map((table) => client.query(`SELECT * FROM ${table} ORDER BY id`)),
  );
  expect(after.map((result) => result.rows)).toEqual(
    before.map((result) => result.rows),
  );
  expect((await repo.snapshot()).requirements).toEqual([]);
});

it("imports skills once, creates no evidence and does not infer mastery from a completed project", async () => {
  let state = await repo.snapshot();
  await repo.execute({ type: "importRequirements", jobId: state.jobs[0].id });
  state = await repo.snapshot();
  await repo.execute({ type: "importRequirements", jobId: state.jobs[0].id });
  expect(await repo.snapshot()).toEqual(state);
  expect(state.requirements).toHaveLength(state.jobs[0].skills.length);
  const requirement = state.requirements[0];
  expect(requirementStatus(requirement, state.evidence)).toBe("Sin proyecto");
  await repo.execute({
    type: "saveProject",
    id: state.projects[0].id,
    data: { ...state.projects[0], status: "Completado" },
  });
  await repo.execute({
    type: "saveRequirement",
    ...requirement,
    projectId: state.projects[0].id,
  });
  state = await repo.snapshot();
  expect(requirementStatus(state.requirements[0], state.evidence)).toBe(
    "Proyecto vinculado",
  );
});

it("rejects missing references and moving a requirement to another vacancy without side effects", async () => {
  const state = await repo.snapshot();
  await expect(
    repo.execute({
      type: "saveRequirement",
      ...state.requirements[0],
      projectId: crypto.randomUUID(),
    }),
  ).rejects.toBeInstanceOf(RecordNotFound);
  await expect(
    repo.execute({
      type: "addEvidence",
      requirementId: crypto.randomUUID(),
      body: "Prueba",
      url: "https://example.com",
    }),
  ).rejects.toBeInstanceOf(RecordNotFound);
  expect(await repo.snapshot()).toEqual(state);
  await repo.execute({
    type: "saveJob",
    data: { ...state.jobs[0], title: "Otra vacante" },
  });
  const withJob = await repo.snapshot();
  const otherJob = withJob.jobs.find((item) => item.title === "Otra vacante")!;
  await expect(
    repo.execute({
      type: "saveRequirement",
      ...state.requirements[0],
      jobId: otherJob.id,
    }),
  ).rejects.toBeInstanceOf(RecordNotFound);
  expect(await repo.snapshot()).toEqual(withJob);
});

it("allows cross-vacancy project reuse, keeps evidence on project deletion and updates status when evidence is removed", async () => {
  let state = await repo.snapshot();
  const project = state.projects[0];
  const otherJob = state.jobs.find((item) => item.id !== project.jobId)!;
  await repo.execute({
    type: "saveRequirement",
    jobId: otherJob.id,
    title: "Interfaces accesibles",
    projectId: project.id,
  });
  const requirement = state.requirements[0];
  await repo.execute({
    type: "addEvidence",
    requirementId: requirement.id,
    body: "Pruebas de validación del formulario",
    url: "https://example.com/proof",
  });
  state = await repo.snapshot();
  expect(requirementStatus(state.requirements[0], state.evidence)).toBe(
    "Con evidencia",
  );
  await repo.execute({ type: "deleteProject", id: project.id });
  state = await repo.snapshot();
  expect(state.requirements.every((item) => item.projectId === null)).toBe(
    true,
  );
  expect(requirementStatus(state.requirements[0], state.evidence)).toBe(
    "Con evidencia",
  );
  await repo.execute({ type: "deleteEvidence", id: state.evidence[0].id });
  state = await repo.snapshot();
  expect(requirementStatus(state.requirements[0], state.evidence)).toBe(
    "Sin proyecto",
  );
  expect(
    state.activities.some((item) => item.url === "https://example.com/proof"),
  ).toBe(true);
});

it("cascades requirement and vacancy evidence deletion while retaining history", async () => {
  let state = await repo.snapshot();
  for (const requirement of state.requirements.slice(0, 2))
    await repo.execute({
      type: "addEvidence",
      requirementId: requirement.id,
      body: "Evidencia de prueba",
      url: "https://example.com/check",
    });
  await repo.execute({
    type: "deleteRequirement",
    id: state.requirements[0].id,
  });
  state = await repo.snapshot();
  expect(state.evidence).toHaveLength(1);
  await repo.execute({ type: "deleteJob", id: state.requirements[0].jobId });
  state = await repo.snapshot();
  expect(state.evidence).toHaveLength(0);
  expect(
    state.activities.filter((item) => item.url === "https://example.com/check"),
  ).toHaveLength(2);
});

it("requires a safe evidence link and moderates new text fields", () => {
  const valid = {
    type: "addEvidence",
    requirementId: crypto.randomUUID(),
    body: "Prueba de interfaz",
    url: "https://example.com",
  };
  expect(commandSchema.safeParse(valid).success).toBe(true);
  for (const patch of [
    { url: "" },
    { url: "javascript:alert(1)" },
    { body: "" },
    { body: "fuck" },
  ])
    expect(commandSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  expect(
    commandSchema.safeParse({
      type: "saveRequirement",
      jobId: crypto.randomUUID(),
      title: "fuck",
      projectId: null,
    }).success,
  ).toBe(false);
});
