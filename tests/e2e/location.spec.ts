import { test, expect, type Page, type Locator } from "@playwright/test";

const nativeForms = process.env.PLAYWRIGHT_ENQUIRY_PROVIDER === "netlify";
const endpoint = nativeForms ? "/__forms.html" : "/api/enquiries";
const point = { latitude: 22.572645123456, longitude: 88.363892123456, accuracy: 18.25 };
type Harness = { calls: number; options?: PositionOptions; callbacks: (() => void)[] };
type TestWindow = Window & { locationTest: Harness };

async function mockLocation(page: Page, scenario: "success" | "deferred" | "unsupported" | 1 | 2 | 3 = "success") {
  await page.addInitScript(({ scenario, point }) => {
    const state: Harness = { calls: 0, callbacks: [] };
    (window as unknown as TestWindow).locationTest = state;
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: scenario === "unsupported" ? undefined : {
      getCurrentPosition(success: PositionCallback, failure: PositionErrorCallback, options: PositionOptions) {
        state.calls++; state.options = options;
        const callback = () => typeof scenario === "number"
          ? failure({ code: scenario } as GeolocationPositionError)
          : success({ coords: point, timestamp: Date.now() } as GeolocationPosition);
        state.callbacks.push(callback);
        if (scenario !== "deferred") setTimeout(callback, 0);
      },
      watchPosition() { throw new Error("Continuous location tracking is forbidden"); },
    } });
  }, { scenario, point });
}
async function openForm(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Book Routine service & cleaning" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name *", { exact: true }).fill("QA Location TEST ONLY");
  await dialog.getByLabel("Mobile number *", { exact: true }).fill("9000000000");
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700001");
  await dialog.getByRole("checkbox").check();
  return dialog;
}
async function captureSubmission(page: Page) {
  const bodies: Record<string, unknown>[] = [];
  await page.route(`**${endpoint}`, async route => {
    if (route.request().method() !== "POST") return route.continue();
    const body = route.request().postData() || "";
    bodies.push(nativeForms ? Object.fromEntries(new URLSearchParams(body)) : JSON.parse(body));
    await route.fulfill(nativeForms
      ? { status: 200, contentType: "text/html", body: "<html>Thank you</html>" }
      : { status: 202, contentType: "application/json", body: JSON.stringify({ reference: "AC-2026-ABCDEF123456" }) });
  });
  return bodies;
}
async function reverseAddress(page: Page, address: string | null = "QA resolved address, Kolkata") {
  await page.route("**/api/location/reverse", route => route.fulfill({ status: 200, json: { address, provider: address ? "geoapify" : null } }));
}
async function confirmLocation(dialog: Locator) {
  await dialog.getByRole("button", { name: "Use current location" }).click();
  await expect(dialog.getByRole("button", { name: "Confirm this location" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Confirm this location" }).click();
}
async function send(dialog: Locator, bodies: Record<string, unknown>[]) {
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect.poll(() => bodies.length).toBe(1);
  await expect(dialog.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  return bodies[0];
}
function expectNoCoordinates(body: Record<string, unknown>) {
  if (nativeForms) { expect(body.latitude).toBe(""); expect(body.longitude).toBe(""); }
  else expect((body.location as { source?: string } | null)?.source).not.toBe("browser");
}

test("location is never requested automatically and the form works without it", async ({ page }) => {
  await mockLocation(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  expect(await page.evaluate(() => (window as unknown as TestWindow).locationTest.calls)).toBe(0);
  const body = await send(dialog, bodies);
  expectNoCoordinates(body);
  if (nativeForms) expect(body.googleMaps).toBe("");
});

test("permission-granted native geolocation is confirmed and submitted with full precision", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation(point);
  await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(dialog);
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("QA resolved address, Kolkata");
  await expect(dialog.locator(".location-status")).toContainText("18 metres");
  await expect(dialog.locator(".location-attribution")).toContainText("Geoapify");
  const href = await dialog.getByRole("link", { name: "Check in Google Maps" }).getAttribute("href");
  expect(new URL(href!).searchParams.get("destination")).toBe(`${point.latitude},${point.longitude}`);
  const body = await send(dialog, bodies);
  if (nativeForms) {
    expect(body.latitude).toBe(String(point.latitude));
    expect(body.longitude).toBe(String(point.longitude));
    expect(body.locationAccuracy).toBe("18.25 metres");
    expect(body.googleMaps).toBe(href);
  } else expect(body.location).toMatchObject({ ...point, source: "browser", confirmed: true, pin: "700001" });
});

for (const [scenario, text] of [[1, "Location access was not granted"], [2, "could not be detected"], [3, "timed out"], ["unsupported", "not supported"]] as const) {
  test(`location failure ${scenario} permits a normal request`, async ({ page }) => {
    await mockLocation(page, scenario);
    const bodies = await captureSubmission(page);
    const dialog = await openForm(page);
    await dialog.getByRole("button", { name: "Use current location" }).click();
    await expect(dialog.locator(".location-status")).toContainText(text);
    await expect(dialog.getByRole("button", { name: "Use current location" })).toBeEnabled();
    expectNoCoordinates(await send(dialog, bodies));
  });
}

test("manual correction removes old GPS and creates an encoded address search", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(dialog);
  const address = "QA Block A & B, floor #2";
  await dialog.getByLabel("Service Location (Optional)").fill(address);
  const href = await dialog.getByRole("link", { name: "Check in Google Maps" }).getAttribute("href");
  expect(new URL(href!).pathname).toBe("/maps/search/");
  expect(new URL(href!).searchParams.get("query")).toBe(address);
  const body = await send(dialog, bodies);
  expectNoCoordinates(body);
  if (nativeForms) expect(body.googleMaps).toBe(href);
  else expect(body.location).toMatchObject({ source: "manual", address });
});

test("changing the PIN removes a confirmed GPS position and its displayed address", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(dialog);
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700002");
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("");
  await expect(dialog.locator(".location-status")).toContainText("PIN code changed");
  expectNoCoordinates(await send(dialog, bodies));
});

test("late address lookup cannot overwrite a manual edit", async ({ page }) => {
  await mockLocation(page);
  await page.addInitScript(() => {
    const original = window.fetch;
    const state = window as unknown as { finishLookup?: () => void };
    window.fetch = (input, init) => String(input) === "/api/location/reverse"
      ? new Promise(resolve => { state.finishLookup = () => resolve(Response.json({ address: "STALE lookup", provider: "geoapify" })); })
      : original(input, init);
  });
  const dialog = await openForm(page);
  await dialog.getByRole("button", { name: "Use current location" }).click();
  await expect(dialog.locator(".location-status")).toContainText("Looking up");
  await dialog.getByLabel("Service Location (Optional)").fill("QA latest manual address");
  await page.evaluate(() => (window as unknown as { finishLookup: () => void }).finishLookup());
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("QA latest manual address");
  await expect(dialog.getByRole("button", { name: "Confirm this location" })).toBeHidden();
});

test("clear and repeated attempts ignore old GPS callbacks and block duplicate requests", async ({ page }) => {
  await mockLocation(page, "deferred"); await reverseAddress(page);
  const dialog = await openForm(page);
  const locate = dialog.getByRole("button", { name: "Use current location" });
  await locate.click();
  await expect(locate).toBeDisabled();
  await locate.dispatchEvent("click");
  expect(await page.evaluate(() => (window as unknown as TestWindow).locationTest.calls)).toBe(1);
  expect(await page.evaluate(() => (window as unknown as TestWindow).locationTest.options)).toEqual({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  await dialog.getByRole("button", { name: "Clear location" }).click();
  await locate.click();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[0]());
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("");
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[1]());
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("QA resolved address, Kolkata");
  await dialog.getByRole("button", { name: "Clear location" }).click();
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("");
});

test("closing the modal discards a pending location callback", async ({ page }) => {
  await mockLocation(page, "deferred");
  const dialog = await openForm(page);
  await dialog.getByRole("button", { name: "Use current location" }).click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[0]());
  await page.getByRole("button", { name: "Book Routine service & cleaning" }).click();
  await expect(page.getByRole("dialog").getByLabel("Service Location (Optional)")).toHaveValue("");
});

test("address lookup failure retains GPS and mobile controls stay inside the modal", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await mockLocation(page); await reverseAddress(page, null);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(dialog);
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("GPS 22.572645, 88.363892");
  const bounds = await dialog.boundingBox();
  const field = await dialog.locator(".location-input").boundingBox();
  expect(field!.x + field!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  const body = await send(dialog, bodies);
  if (nativeForms) expect(body.latitude).toBe(String(point.latitude));
  else expect(body.location).toMatchObject(point);
});

test("unconfirmed coordinates are omitted without blocking submission", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await dialog.getByRole("button", { name: "Use current location" }).click();
  await expect(dialog.getByRole("button", { name: "Confirm this location" })).toBeEnabled();
  expectNoCoordinates(await send(dialog, bodies));
});
