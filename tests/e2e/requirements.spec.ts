import { test, expect } from "@playwright/test";

test("requirements connect projects and evidence, persist, validate and remove cleanly on mobile", async ({
  page,
  request,
}) => {
  const title = `Requisitos QA ${Date.now()}`;
  const post = async (command: unknown) => {
    const response = await request.post("/api/workspace", { data: command });
    expect(response.ok()).toBe(true);
    return response.json();
  };
  let state = await post({
    type: "saveJob",
    data: {
      title,
      company: "QA",
      area: "Software",
      status: "Guardada",
      url: "",
      description: "",
      skills: ["React", "Postgres"],
    },
  });
  const job = state.jobs.find(
    (item: { title: string }) => item.title === title,
  );
  state = await post({
    type: "saveProject",
    data: {
      title,
      area: "Software",
      status: "Completado",
      objective: "Probar evidencia",
      jobId: null,
      url: "",
      skills: [],
    },
  });
  const project = state.projects.find(
    (item: { title: string }) => item.title === title,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(title) }).click();
  const panel = page.getByRole("region", { name: "Requisitos y evidencias" });
  await panel
    .getByRole("button", { name: "Usar habilidades del anuncio" })
    .click();
  await expect(panel.locator("details")).toHaveCount(2);
  await expect(
    panel.getByRole("button", { name: "Usar habilidades del anuncio" }),
  ).toHaveCount(0);
  const card = panel
    .locator("details")
    .filter({ has: page.locator("summary strong", { hasText: /^React$/ }) });
  await card.locator("summary").click();
  await card.getByLabel("Proyecto para practicarlo").selectOption(project.id);
  await card
    .getByRole("button", { name: "Guardar requisito", exact: true })
    .click();
  await expect(card.locator("summary")).toContainText("Proyecto vinculado");
  await card.getByLabel("Qué demuestra esta evidencia").fill("fuck");
  await card
    .getByLabel("Enlace a la evidencia")
    .fill("https://example.com/proof");
  await card.getByRole("button", { name: "Guardar evidencia" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await expect(card.getByLabel("Qué demuestra esta evidencia")).toHaveValue(
    "fuck",
  );
  await card
    .getByLabel("Qué demuestra esta evidencia")
    .fill("Probé el formulario y su validación");
  await card.getByRole("button", { name: "Guardar evidencia" }).click();
  await expect(card.locator("summary")).toContainText("Con evidencia");
  await page.reload();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await card.locator("summary").click();
  await expect(
    card.getByRole("link", { name: "Abrir evidencia" }),
  ).toHaveAttribute("href", "https://example.com/proof");
  expect(
    await page
      .getByRole("dialog")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: ".data/requirements-mobile.png" });
  await page.setViewportSize({ width: 1365, height: 960 });
  await page.screenshot({ path: ".data/requirements-desktop.png" });
  await card.getByRole("button", { name: "Retirar evidencia" }).click();
  await card.getByRole("button", { name: "Confirmar retiro" }).click();
  await expect(card.locator("summary")).toContainText("Proyecto vinculado");
  await card.getByRole("button", { name: "Eliminar requisito" }).click();
  await card.getByRole("button", { name: "Confirmar eliminación" }).click();
  await expect(panel.locator("details")).toHaveCount(1);
  await panel.getByRole("button", { name: "Añadir requisito" }).click();
  await panel.getByLabel("Nuevo requisito").fill("Pruebas de accesibilidad");
  await panel.getByRole("button", { name: "Guardar nuevo requisito" }).click();
  await expect(
    panel.locator("summary").filter({ hasText: "Pruebas de accesibilidad" }),
  ).toBeVisible();
  const invalid = await request.post("/api/workspace", {
    data: {
      type: "addEvidence",
      requirementId: state.jobs[0].id,
      body: "Prueba",
      url: "javascript:alert(1)",
    },
  });
  expect(invalid.status()).toBe(400);
  await post({ type: "deleteJob", id: job.id });
  await post({ type: "deleteProject", id: project.id });
});
