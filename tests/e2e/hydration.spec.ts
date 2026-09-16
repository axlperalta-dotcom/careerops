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

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Mis vacantes", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nueva vacante", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("[bis_skin_checked]")).toHaveCount(0);
  expect(errors).toEqual([]);

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Nueva vacante", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("[bis_skin_checked]")).toHaveCount(0);
  expect(errors).toEqual([]);
});
