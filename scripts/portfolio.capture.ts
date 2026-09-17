import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import type { Command, Workspace } from "../src/lib/model";

test("capture the real application with isolated demonstration records", async ({
  page,
  request,
}) => {
  const output = "docs/portafolio/images";
  await mkdir(output, { recursive: true });
  const send = async (command: Command): Promise<Workspace> => {
    const response = await request.post("/api/workspace", { data: command });
    expect(response.ok()).toBe(true);
    return response.json();
  };
  let state: Workspace = await (await request.get("/api/workspace")).json();
  expect(state.jobs).toHaveLength(1);
  const job = state.jobs[0];
  const project = state.projects[0];
  state = await send({
    type: "saveJob",
    id: job.id,
    data: { ...job, company: "Vacante de referencia · Demo" },
  });
  state = await send({
    type: "saveProject",
    id: project.id,
    data: {
      ...project,
      status: "En progreso",
      url: "https://github.com/axlperalta-dotcom/careerops",
    },
  });
  for (const sample of [
    {
      title: "Software Engineer",
      company: "Empresa de ejemplo",
      area: "Software" as const,
      skills: ["TypeScript", "Pruebas"],
      description: "Vacante ficticia para mostrar filtros y estados.",
    },
    {
      title: "Systems Engineer",
      company: "Empresa de ejemplo",
      area: "Sistemas" as const,
      skills: ["Docker", "Observabilidad"],
      description: "Vacante ficticia para mostrar la organización por áreas.",
    },
  ])
    state = await send({
      type: "saveJob",
      data: { ...sample, status: "Guardada", url: "" },
    });
  for (const title of [
    "Construir interfaces con React",
    "Modelar datos y conservar su integridad",
    "Automatizar pruebas con integración continua",
  ]) {
    state = await send({
      type: "saveRequirement",
      jobId: job.id,
      projectId: project.id,
      title,
    });
  }
  const requirement = state.requirements.find(
    (item) => item.title === "Automatizar pruebas con integración continua",
  )!;
  state = await send({
    type: "addEvidence",
    requirementId: requirement.id,
    body: "CareerOps valida tipos, ejecuta pruebas de datos y navegador, y compila la aplicación en GitHub Actions. La ejecución enlazada finalizó correctamente.",
    url: "https://github.com/axlperalta-dotcom/careerops/actions/runs/35172189976",
  });
  await send({
    type: "saveRequirement",
    jobId: job.id,
    projectId: null,
    title: "Operar un despliegue en AWS",
  });
  for (const task of state.tasks.slice(0, 3))
    await send({ type: "toggleTask", id: task.id, done: true });
  await send({
    type: "addNote",
    projectId: project.id,
    body: "Ejemplo de bitácora: revisar si cada requisito se conecta claramente con un proyecto y una evidencia.",
    url: "",
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Product Engineer/ }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${output}/01-vacantes.png` });
  await page.getByRole("button", { name: /Product Engineer/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("region", { name: "Requisitos y evidencias" }),
  ).toBeVisible();
  await dialog.screenshot({ path: `${output}/02-requisitos.png` });
  await dialog
    .locator("summary")
    .filter({ hasText: "Automatizar pruebas" })
    .click();
  await dialog
    .getByRole("link", { name: "Abrir evidencia" })
    .scrollIntoViewIfNeeded();
  await dialog
    .locator("details")
    .filter({
      has: page.locator("summary", { hasText: "Automatizar pruebas" }),
    })
    .screenshot({ path: `${output}/03-evidencia.png` });
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Proyectos", exact: true })
    .click();
  await page.getByRole("button", { name: /CareerOps/ }).click();
  await expect(dialog.getByText("3 de 4 · 75%")).toBeVisible();
  await dialog.screenshot({ path: `${output}/04-proyecto.png` });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Vacantes", exact: true })
    .click();
  await page.getByRole("button", { name: /Product Engineer/ }).click();
  await expect(
    dialog.getByRole("region", { name: "Requisitos y evidencias" }),
  ).toBeVisible();
  await page.screenshot({ path: `${output}/05-movil.png` });
});
