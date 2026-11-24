import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const nativeForms = process.env.PLAYWRIGHT_ENQUIRY_PROVIDER === "netlify";
const endpoint = nativeForms ? "/__forms.html" : "/api/enquiries";
const successText = "Your service request has been received successfully. Our AquaCircle team will contact you shortly.";

test("all request details survive submission; loading blocks duplicate clicks", async ({ page }) => {
  const requests: { body: string; key?: string }[] = [];
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**${endpoint}`, async route => {
    if (route.request().method() !== "POST") return route.continue();
    requests.push({ body: route.request().postData() || "", key: route.request().headers()["idempotency-key"] });
    await pending;
    await route.fulfill(nativeForms
      ? { status: 200, contentType: "text/html", body: "<html>Thank you</html>" }
      : { status: 202, contentType: "application/json", body: JSON.stringify({ reference: "AC-2026-ABCDEF123456" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Book Routine service & cleaning" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name *", { exact: true }).fill("QA Complete Details");
  await dialog.getByLabel("Mobile number *", { exact: true }).fill("9000000000");
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700001");
  await dialog.locator("summary").click();
  await dialog.getByLabel("Email", { exact: true }).fill("qa@example.test");
  await dialog.getByLabel("Purifier brand").fill("QA Brand");
  await dialog.getByLabel("Purifier model").fill("QA Model");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await dialog.getByLabel("Preferred date").fill(tomorrow);
  await dialog.getByLabel("Preferred time").selectOption("morning");
  await dialog.getByLabel("Address", { exact: true }).fill("QA address, floor 2");
  await dialog.getByLabel("What can we help with?").fill("QA only: filter + connection & low flow");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(dialog.getByRole("button", { name: "Sending request" })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Close booking form" })).toBeDisabled();
  await dialog.locator("form").evaluate(form => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(dialog.getByRole("button", { name: "Sending request" })).toBeDisabled();
  expect(requests).toHaveLength(1);
  await expect(dialog.getByText(successText)).toBeHidden();
  const body = nativeForms ? Object.fromEntries(new URLSearchParams(requests[0].body)) : JSON.parse(requests[0].body);
  expect(body).toMatchObject({ name: "QA Complete Details", mobile: "9000000000", pin: "700001", service: "routine", email: "qa@example.test", brand: "QA Brand", model: "QA Model", address: "QA address, floor 2", preferredDate: tomorrow, preferredTime: "morning", problem: "QA only: filter + connection & low flow" });
  if (nativeForms) {
    expect(body["form-name"]).toBe("aquacircle-service-request");
    expect(body.consent).toContain("Agreed");
    expect(body.subject).toBe("New AquaCircle Service Request — QA Complete Details — Routine service & cleaning");
    expect(body.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.source).toBe("AquaCircle.in Website");
  } else {
    expect(body.consent).toBe(true);
  }
  release();
  await expect(dialog.getByText(successText)).toBeVisible();
  await expect(dialog.getByRole("status")).toBeFocused();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
});

test("a network failure preserves optional details and allows an edited retry", async ({ page }) => {
  const ids: (string | undefined)[] = [];
  await page.route(`**${endpoint}`, async route => {
    if (route.request().method() !== "POST") return route.continue();
    ids.push(nativeForms ? new URLSearchParams(route.request().postData() || "").get("requestId") || undefined : route.request().headers()["idempotency-key"]);
    if (ids.length === 1) return route.abort("failed");
    return route.fulfill(nativeForms
      ? { status: 200, contentType: "text/html", body: "<html>Thank you</html>" }
      : { status: 202, contentType: "application/json", body: JSON.stringify({ reference: "AC-2026-ABCDEF123456" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Book Routine service & cleaning" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name *", { exact: true }).fill("QA Retry");
  await dialog.getByLabel("Mobile number *", { exact: true }).fill("9000000000");
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700001");
  await dialog.locator("summary").click();
  await dialog.getByLabel("Purifier model").fill("Keep this model");
  await dialog.getByLabel("What can we help with?").fill("Keep these service details");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Unable to submit your request right now. Please try again.");
  await expect(dialog.getByText(successText)).toBeHidden();
  await expect(dialog.getByLabel("Purifier model")).toHaveValue("Keep this model");
  await expect(dialog.getByLabel("What can we help with?")).toHaveValue("Keep these service details");
  await dialog.getByLabel("Name *", { exact: true }).fill("QA Edited Retry");
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect(dialog.getByText(successText)).toBeVisible();
  expect(ids).toHaveLength(2);
  expect(ids[0]).not.toBe(ids[1]);
});

test("Netlify Dev parses a real URL-encoded form into its local submission event", async ({ page }) => {
  test.skip(!nativeForms || process.env.PLAYWRIGHT_NETLIFY_DEV !== "1", "Requires the explicitly selected offline Netlify fixture.");
  const base = new URL(process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8888");
  expect(["localhost", "127.0.0.1"]).toContain(base.hostname);
  await page.goto("/");
  await page.getByRole("button", { name: "Book Routine service & cleaning" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name *", { exact: true }).fill("AquaCircle Local Netlify QA");
  await dialog.getByLabel("Mobile number *", { exact: true }).fill("9000000000");
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700001");
  await dialog.getByLabel("Service Location (Optional)").fill("QA ONLY public test address, Kolkata");
  await dialog.getByLabel("What can we help with?").fill("LOCAL TEST ONLY: preserve filter + connection & details. No visit needed.");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect(dialog.getByText(successText)).toBeVisible();
  const reference = await dialog.locator(".reference strong").innerText();
  await expect.poll(async () => {
    try {
      return JSON.parse(await readFile(".data/netlify-forms-qa/latest.json", "utf8")).data.reference;
    } catch { return null; }
  }).toBe(reference);
  const event = JSON.parse(await readFile(".data/netlify-forms-qa/latest.json", "utf8"));
  expect(event.data).toMatchObject({
    "form-name": "aquacircle-service-request",
    name: "AquaCircle Local Netlify QA",
    mobile: "9000000000",
    pin: "700001",
    problem: "LOCAL TEST ONLY: preserve filter + connection & details. No visit needed.",
    consent: "Agreed to be contacted about this request",
    source: "AquaCircle.in Website",
    serviceLocation: "QA ONLY public test address, Kolkata",
    latitude: "",
    longitude: "",
    locationSource: "Manually Entered",
    googleMaps: "https://www.google.com/maps/search/?api=1&query=QA+ONLY+public+test+address%2C+Kolkata",
  });
});
