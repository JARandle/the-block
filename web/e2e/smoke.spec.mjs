import { test, expect } from "@playwright/test";

test.describe("buyer flow", () => {
  test("inventory loads and vehicle opens", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /vehicle auctions/i })).toBeVisible();
    await expect(page.getByText(/showing \d+ of \d+ vehicles/i)).toBeVisible();

    await page.getByRole("link", { name: /\d{4}/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /place a bid/i })).toBeVisible();
  });

  test("search filters results", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("searchbox").fill("zzzznotfound");
    await expect(page.getByText(/no vehicles match/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole("searchbox").clear();
    await expect(page.getByText(/showing \d+ of \d+ vehicles/i)).toBeVisible();
  });
});
