import { test, expect } from "@playwright/test";

test("vacancy → project → task → evidence survives reload and can be removed", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Mis vacantes", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("button")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Vista general", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Nueva vacante", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const title = `QA Product Engineer ${Date.now()}`;
  const projectTitle = `Proyecto QA ${Date.now()}`;
  await dialog.getByLabel("Puesto", { exact: true }).fill(title);
  await dialog
    .getByLabel("Empresa", { exact: true })
    .fill("Prueba automatizada");
  await dialog.getByLabel("Habilidades").fill("React, SQL");
  await dialog
    .getByRole("button", { name: "Guardar vacante", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Vacantes/ })
    .click();
  await page.getByLabel("Buscar", { exact: true }).fill(title);
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(dialog.locator(".badge")).toHaveClass("badge amber");
  await dialog.getByRole("button", { name: "Editar", exact: true }).click();
  await dialog
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("Archivada");
  await dialog
    .getByRole("button", { name: "Guardar vacante", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(dialog.locator(".badge")).toHaveClass("badge orange");
  await dialog
    .getByRole("button", { name: "Crear proyecto", exact: true })
    .click();
  await dialog.getByLabel("Nombre del proyecto").fill(projectTitle);
  await dialog
    .getByLabel("Objetivo", { exact: true })
    .fill("Verificar el recorrido de extremo a extremo.");
  await dialog.getByRole("button", { name: "Guardar proyecto" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Proyectos/ })
    .click();
  await page.getByRole("button", { name: new RegExp(projectTitle) }).click();
  await dialog.getByLabel("Nueva tarea").fill("Probar que guarda los cambios");
  await dialog.getByRole("button", { name: "Añadir", exact: true }).click();
  await dialog
    .getByRole("checkbox", { name: "Probar que guarda los cambios" })
    .click();
  await expect(
    dialog.getByRole("checkbox", { name: "Probar que guarda los cambios" }),
  ).toBeChecked();
  await expect(dialog.getByText("1 de 1 · 100%")).toBeVisible();
  await dialog
    .getByLabel("Descripción del avance")
    .fill("El recorrido funciona con teclado y ratón.");
  await dialog.getByLabel("Enlace de evidencia").fill("https://example.com/qa");
  await dialog.getByRole("button", { name: "Registrar avance" }).click();
  await expect(
    dialog.getByText("El recorrido funciona con teclado y ratón."),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Proyectos/ })
    .click();
  await page.getByRole("button", { name: new RegExp(projectTitle) }).click();
  await expect(
    dialog.getByRole("checkbox", { name: "Probar que guarda los cambios" }),
  ).toBeChecked();
  await expect(
    dialog.getByRole("link", { name: "Abrir evidencia" }),
  ).toHaveAttribute("href", "https://example.com/qa");
  await dialog
    .getByRole("button", { name: "Eliminar proyecto", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Eliminar proyecto", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Vacantes/ })
    .click();
  await page.getByLabel("Buscar", { exact: true }).fill(title);
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await dialog
    .getByRole("button", { name: "Eliminar vacante", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Eliminar vacante", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
});

test("language warning preserves input and the API also rejects offensive text", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nueva vacante", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Puesto", { exact: true }).fill("Pendejo");
  await dialog.getByLabel("Empresa", { exact: true }).fill("Ejemplo");
  await dialog
    .getByRole("button", { name: "Guardar vacante", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("Revisa el lenguaje");
  await expect(dialog.getByLabel("Puesto", { exact: true })).toHaveValue(
    "Pendejo",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Bitácora", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Nueva vacante", exact: true }),
  ).toHaveCount(0);
  const before = await (await request.get("/api/workspace")).json();
  const response = await request.post("/api/workspace", {
    data: {
      type: "saveJob",
      data: {
        title: "Pendejo",
        company: "Ejemplo",
        area: "Software",
        status: "Guardada",
        url: "",
        description: "",
        skills: [],
      },
    },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toContain("Revisa el lenguaje");
  const after = await (await request.get("/api/workspace")).json();
  expect(after.jobs).toEqual(before.jobs);
  expect(after.activities).toEqual(before.activities);
});

test("mobile navigation, filtering and dialog keyboard dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Proyectos/ })
    .click();
  await page.getByLabel("Filtrar por área").selectOption("Aeroespacial");
  await expect(
    page.getByRole("heading", { name: "No hay coincidencias" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Nuevo proyecto", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("API rejects cross-origin changes and invalid payloads", async ({
  request,
}) => {
  const foreign = await request.post("/api/workspace", {
    headers: { origin: "https://untrusted.example" },
    data: { type: "deleteJob", id: crypto.randomUUID() },
  });
  expect(foreign.status()).toBe(403);
  const invalid = await request.post("/api/workspace", {
    data: { type: "unknown" },
  });
  expect(invalid.status()).toBe(400);
  const local = await request.post("/api/workspace", {
    headers: { origin: "http://127.0.0.1:3011" },
    data: { type: "unknown" },
  });
  expect(local.status()).toBe(400);
});
