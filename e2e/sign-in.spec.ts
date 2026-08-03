import { expect, test } from "@playwright/test";

test("manager persona receives manager access", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByRole("button", { name: /authenticate as manager/i }).click();

  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByRole("link", { name: "Manager" })).toBeVisible();

  await page.goto("/manager");
  await expect(page.getByRole("heading", { name: "Manager workspace" })).toBeVisible();
});

test("guest persona cannot receive manager access", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByRole("button", { name: /authenticate as guest/i }).click();

  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByRole("link", { name: "Manager" })).toHaveCount(0);

  await page.goto("/manager");
  await expect(page).toHaveURL(/\/forbidden$/);
  await expect(
    page.getByRole("heading", { name: "Access not available" }),
  ).toBeVisible();
});
