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

  test("places a bid and shows updated state", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /\d{4}/ }).first().click();

    // Scope all BidPanel assertions to the labelled region
    const bidPanel = page.getByRole("region", { name: /place a bid/i });
    await expect(bidPanel).toBeVisible();

    // The BidPanel <dl> has two <dd> (definition) elements: current bid and bids count.
    // The second definition is the bid count.
    const bidCountLocator = bidPanel.getByRole("definition").nth(1);
    const initialCountText = await bidCountLocator.textContent();
    const initialCount = parseInt(initialCountText ?? "0", 10);

    // The bid input is pre-filled with the minimum valid bid — submit it as-is
    await page.getByRole("button", { name: /submit bid/i }).click();

    // Success message appears
    await expect(page.getByRole("status")).toHaveText("Your bid was recorded.");

    // Bid count incremented by 1
    await expect(bidCountLocator).toHaveText(String(initialCount + 1));
  });
});
