import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/screenshots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
await page.goto(process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000", {
  waitUntil: "networkidle",
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
for (
  let y = 0;
  y < (await page.locator("body").evaluate((el) => el.scrollHeight));
  y += 650
) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(180);
}
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({
  path: "artifacts/screenshots/desktop-homepage.png",
  fullPage: true,
});
for (let i = 0; i < 5; i++) {
  await page
    .locator(".hero")
    .screenshot({ path: `artifacts/screenshots/hero-${i + 1}.png` });
  if (i < 4) {
    await page.getByRole("button", { name: "Next slide", exact: true }).click();
    await page.waitForTimeout(1800);
  }
}
await page
  .locator("#services")
  .screenshot({ path: "artifacts/screenshots/services.png" });
await page
  .locator("footer")
  .screenshot({ path: "artifacts/screenshots/footer.png" });
await page
  .getByRole("button", { name: "Book Routine service & cleaning" })
  .click();
await page.waitForTimeout(450);
await page.screenshot({ path: "artifacts/screenshots/booking-modal.png" });
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1800);
for (
  let y = 0;
  y < (await page.locator("body").evaluate((el) => el.scrollHeight));
  y += 600
) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(160);
}
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({
  path: "artifacts/screenshots/mobile-homepage.png",
  fullPage: true,
});
await page.screenshot({ path: "artifacts/screenshots/mobile-hero.png" });
await page.getByRole("button", { name: "Open navigation" }).click();
await page.screenshot({ path: "artifacts/screenshots/mobile-navigation.png" });
await browser.close();
console.log("Screenshots saved to artifacts/screenshots.");
