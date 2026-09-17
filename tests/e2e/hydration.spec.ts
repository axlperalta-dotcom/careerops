import { test, expect } from "@playwright/test";

test("initial load and reload hydrate without console errors in a clean browser", async ({
  page,
  request,
}) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  expect(await response.text()).not.toContain("bis_skin_checked");

  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  // A fresh CI worker compiles the API and initializes PGlite on first use.
  // Wait for that response separately from the UI/hydration assertions.
  const waitForWorkspace = () =>
    page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname === "/api/workspace" &&
        result.request().method() === "GET",
      { timeout: 20000 },
    );
  const initialWorkspace = waitForWorkspace();
  await page.goto("/");
  expect((await initialWorkspace).ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Mis vacantes", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nueva vacante", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("[bis_skin_checked]")).toHaveCount(0);
  expect(errors).toEqual([]);

  const reloadedWorkspace = waitForWorkspace();
  await page.reload();
  expect((await reloadedWorkspace).ok()).toBe(true);
  await expect(
    page.getByRole("button", { name: "Nueva vacante", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("[bis_skin_checked]")).toHaveCount(0);
  expect(errors).toEqual([]);
});
