import { expect, test } from "@playwright/test";

test("manager persona receives manager access", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByRole("button", { name: /authenticate as manager/i }).click();

  await expect(page).toHaveURL(/\/manager\/internships$/);
  await expect(page.getByRole("heading", { name: "Internships" })).toBeVisible();

  await page.goto("/manager");
  await expect(page).toHaveURL(/\/manager\/internships$/);
});

test("guest persona cannot receive manager access", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByRole("button", { name: /authenticate as guest/i }).click();

  await expect(page).toHaveURL(/\/guest$/);

  await page.goto("/manager");
  await expect(page).toHaveURL(/\/forbidden$/);
  await expect(
    page.getByRole("heading", { name: "Access not granted" }),
  ).toBeVisible();
});
