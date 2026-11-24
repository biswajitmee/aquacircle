import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const nativeForms = process.env.PLAYWRIGHT_ENQUIRY_PROVIDER === "netlify";
const endpoint = nativeForms ? "/__forms.html" : "/api/enquiries";
const point = { latitude: 22.572645123456, longitude: 88.363892123456, accuracy: 65 };
const address = "QA resolved address, Kolkata";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
type Harness = { calls: number; options?: PositionOptions; callbacks: (() => void)[]; point: typeof point };
type TestWindow = Window & { locationTest: Harness; lookups: { body: string; finish: (address: string) => void }[] };

async function mockLocation(page: Page, scenario: "success" | "deferred" | "unsupported" | 1 | 2 | 3 = "success") {
  await page.addInitScript(({ scenario, point }) => {
    const state: Harness = { calls: 0, callbacks: [], point };
    (window as unknown as TestWindow).locationTest = state;
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: scenario === "unsupported" ? undefined : {
      getCurrentPosition(success: PositionCallback, failure: PositionErrorCallback, options: PositionOptions) {
        state.calls++; state.options = options;
        const callback = () => typeof scenario === "number"
          ? failure({ code: scenario } as GeolocationPositionError)
          : success({ coords: { ...state.point }, timestamp: Date.now() } as GeolocationPosition);
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
  const dialog = page.locator("dialog.booking-dialog");
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
      : { status: 202, json: { reference: "AC-2026-ABCDEF123456" } });
  });
  return bodies;
}
async function reverseAddress(page: Page, text: string | null = address) {
  await page.route("**/api/location/reverse", route => route.fulfill({ json: { address: text, provider: text ? "geoapify" : null } }));
}
async function openPicker(page: Page, dialog: Locator) {
  await dialog.getByRole("button", { name: "Use current location", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Confirm Your Service Location" });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("button", { name: "Confirm Pin Location" })).toBeEnabled();
  return picker;
}
async function confirmLocation(page: Page, dialog: Locator) {
  const picker = await openPicker(page, dialog);
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue(address);
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  return picker;
}
async function send(dialog: Locator, bodies: Record<string, unknown>[]) {
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect.poll(() => bodies.length).toBe(1);
  await expect(dialog.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  return bodies[0];
}
function expectNoCoordinates(body: Record<string, unknown>) {
  if (nativeForms) { expect(body.latitude).toBe(""); expect(body.longitude).toBe(""); }
  else expect((body.location as { source?: string } | null)?.source || "manual").toBe("manual");
}
function destination(body: Record<string, unknown>) {
  if (nativeForms) return new URL(body.googleMaps as string).searchParams.get("destination");
  const location = body.location as typeof point;
  return `${location.latitude},${location.longitude}`;
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/location/tiles/**", route => route.fulfill({ contentType: "image/png", body: png }));
});

test("location is never requested automatically and the form works without it", async ({ page }) => {
  await mockLocation(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  expect(await page.evaluate(() => (window as unknown as TestWindow).locationTest.calls)).toBe(0);
  expectNoCoordinates(await send(dialog, bodies));
});

test("accurate native GPS is explicitly confirmed with its full precision", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ ...point, accuracy: 3.75 });
  await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(page, dialog);
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue(address);
  await expect(dialog.locator(".location-status")).toContainText("3.75 metres");
  await expect(dialog.locator(".location-status")).toContainText("Location Confirmed");
  const href = await dialog.getByRole("link", { name: "Check in Google Maps" }).getAttribute("href");
  expect(new URL(href!).searchParams.get("destination")).toBe(`${point.latitude},${point.longitude}`);
  const body = await send(dialog, bodies);
  expect(destination(body)).toBe(`${point.latitude},${point.longitude}`);
  if (nativeForms) expect(body.locationSource).toBe("GPS + Customer-Confirmed Map Pin");
  else expect(body.location).toMatchObject({ source: "map", confirmed: true, accuracy: 3.75 });
});

test("approximate GPS, keyboard movement, zoom and access details use the selected pin", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  const picker = await openPicker(page, dialog);
  await expect(picker.locator(".location-accuracy")).toContainText("65 metres");
  await expect(picker.locator(".leaflet-overlay-pane path")).toBeVisible();
  const map = picker.getByRole("region", { name: "Service location map" });
  await map.focus(); await page.keyboard.press("ArrowRight");
  await picker.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue(address);
  await picker.getByText("Add flat, building & entrance details", { exact: false }).click();
  await picker.getByLabel("Flat / House Number").fill("QA 2B");
  await picker.getByLabel("Building / Apartment Name").fill("QA Tower");
  await picker.getByLabel("Floor", { exact: true }).fill("2");
  await picker.getByLabel("Nearby Landmark").fill("QA park");
  await picker.getByLabel("Entrance / Access Instructions").fill("Use the side gate");
  await page.keyboard.press("Enter");
  expect(bodies).toHaveLength(0);
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  const href = await dialog.getByRole("link", { name: "Check in Google Maps" }).getAttribute("href");
  const selected = new URL(href!).searchParams.get("destination");
  expect(selected).not.toBe(`${point.latitude},${point.longitude}`);
  // Structured details can be updated without losing the confirmed destination.
  await dialog.locator(".location-details summary").click();
  await dialog.getByLabel("Flat / House Number").fill("QA 3B");
  const body = await send(dialog, bodies);
  expect(destination(body)).toBe(selected);
  if (nativeForms) { expect(body.flat).toBe("QA 3B"); expect(body.entrance).toBe("Use the side gate"); }
  else expect(body.location).toMatchObject({ accuracy: 65, details: { flat: "QA 3B", building: "QA Tower", entrance: "Use the side gate" } });
});

for (const [scenario, text] of [[1, "Location access was not granted"], [2, "could not be detected"], [3, "timed out"], ["unsupported", "not supported"]] as const) {
  test(`location failure ${scenario} permits a manual address request`, async ({ page }) => {
    await mockLocation(page, scenario);
    const bodies = await captureSubmission(page);
    const dialog = await openForm(page);
    await dialog.getByRole("button", { name: "Use current location" }).click();
    await expect(dialog.locator(".location-status")).toContainText(text);
    await dialog.getByLabel("Service Location (Optional)").fill("QA manual address");
    expectNoCoordinates(await send(dialog, bodies));
  });
}

test("editing the main address removes coordinates until the pin is reconfirmed", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(page, dialog);
  const before = await dialog.getByRole("link", { name: "Check in Google Maps" }).getAttribute("href");
  await dialog.getByLabel("Service Location (Optional)").fill("QA different entrance address");
  await expect(dialog.locator(".location-status")).toContainText("Reconfirm your pin");
  const manualLink = await dialog.getByRole("link", { name: "Check in Google Maps" }).getAttribute("href");
  expect(new URL(manualLink!).pathname).toBe("/maps/search/");
  await dialog.getByRole("button", { name: "Reconfirm pin" }).click();
  const picker = page.getByRole("dialog", { name: "Confirm Your Service Location" });
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue("QA different entrance address");
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  expect(destination(await send(dialog, bodies))).toBe(new URL(before!).searchParams.get("destination"));
});

test("an edited address can be submitted without reconfirming coordinates", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(page, dialog);
  await dialog.getByLabel("Service Location (Optional)").fill("QA new manual address");
  expectNoCoordinates(await send(dialog, bodies));
});

test("changing PIN or clearing a location removes its coordinates", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(page, dialog);
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700002");
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("");
  await expect(dialog.locator(".location-status")).toContainText("PIN code changed");
  await confirmLocation(page, dialog);
  await dialog.getByRole("button", { name: "Clear location" }).click();
  expectNoCoordinates(await send(dialog, bodies));
});

test("out-of-order geocoding and late responses cannot overwrite the latest pin or manual edit", async ({ page }) => {
  await mockLocation(page);
  await page.addInitScript(() => {
    const original = window.fetch;
    const state = window as unknown as TestWindow; state.lookups = [];
    window.fetch = (input, init) => String(input) === "/api/location/reverse"
      ? new Promise(resolve => state.lookups.push({ body: String(init?.body), finish: text => resolve(Response.json({ address: text, provider: "geoapify" })) }))
      : original(input, init);
  });
  const dialog = await openForm(page);
  const picker = await openPicker(page, dialog);
  await expect.poll(() => page.evaluate(() => (window as unknown as TestWindow).lookups.length)).toBe(1);
  const map = picker.getByRole("region", { name: "Service location map" });
  await map.focus(); await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => (window as unknown as TestWindow).lookups.length)).toBe(2);
  await page.evaluate(() => (window as unknown as TestWindow).lookups[1].finish("QA latest pin"));
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue("QA latest pin");
  await page.evaluate(() => (window as unknown as TestWindow).lookups[0].finish("STALE old pin"));
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue("QA latest pin");
  await map.focus(); await page.keyboard.press("ArrowDown");
  await expect.poll(() => page.evaluate(() => (window as unknown as TestWindow).lookups.length)).toBe(3);
  await picker.getByLabel("Selected address (editable)").fill("QA manual correction");
  await page.evaluate(() => (window as unknown as TestWindow).lookups[2].finish("STALE address"));
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue("QA manual correction");
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("QA manual correction");
});

test("clear and repeated attempts ignore old GPS callbacks and use fresh high accuracy", async ({ page }) => {
  await mockLocation(page, "deferred"); await reverseAddress(page);
  const dialog = await openForm(page);
  const locate = dialog.getByRole("button", { name: "Use current location", exact: true });
  await locate.click(); await expect(locate).toBeDisabled();
  await locate.dispatchEvent("click");
  expect(await page.evaluate(() => (window as unknown as TestWindow).locationTest.calls)).toBe(1);
  expect(await page.evaluate(() => (window as unknown as TestWindow).locationTest.options)).toEqual({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  await dialog.getByRole("button", { name: "Clear location" }).click();
  await locate.click();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[0]());
  await expect(page.getByRole("dialog", { name: "Confirm Your Service Location" })).toBeHidden();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[1]());
  const picker = page.getByRole("dialog", { name: "Confirm Your Service Location" });
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue(address);
  await picker.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("");
});

test("recenter uses a fresh reading and late callbacks after cancellation are ignored", async ({ page }) => {
  await mockLocation(page, "deferred"); await reverseAddress(page);
  const dialog = await openForm(page);
  await dialog.getByRole("button", { name: "Use current location", exact: true }).click();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[0]());
  const picker = page.getByRole("dialog", { name: "Confirm Your Service Location" });
  await picker.getByRole("button", { name: "Use Current Location", exact: true }).click();
  await page.evaluate(() => { const state = (window as unknown as TestWindow).locationTest; state.point = { latitude: 22.574, longitude: 88.365, accuracy: 9 }; state.callbacks[1](); });
  // Leaflet pans in screen pixels; the selected center can differ by a fraction
  // of a pixel from the new GPS reading. It must still recenter at that reading.
  await expect(picker.locator(".location-coordinates")).toContainText("88.365000");
  const centered = (await picker.locator(".location-coordinates").innerText()).match(/-?\d+\.\d+/g)!.map(Number);
  expect(centered[0]).toBeCloseTo(22.574, 5);
  expect(centered[1]).toBeCloseTo(88.365, 5);
  await expect(picker.locator(".location-accuracy")).toContainText("9 metres");
  await picker.getByRole("button", { name: "Use Current Location", exact: true }).click();
  await picker.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[2]());
  await expect(picker).toBeHidden();
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("");
});

test("cancel, Escape and keyboard focus stay in the correct dialog", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  const picker = await openPicker(page, dialog);
  await picker.getByRole("button", { name: "Close location picker" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(picker.getByRole("button", { name: "Confirm Pin Location" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(picker.getByRole("button", { name: "Close location picker" })).toBeFocused();
  const audit = await new AxeBuilder({ page }).include(".location-picker").analyze();
  expect(audit.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(picker).toBeHidden(); await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Use current location" })).toBeFocused();
  expectNoCoordinates(await send(dialog, bodies));
});

test("address lookup failure still permits a confirmed coordinate destination", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page, null);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  const picker = await openPicker(page, dialog);
  await expect(picker.getByRole("status").filter({ hasText: "An address could not be found" })).toBeVisible();
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("Map pin 22.572645, 88.363892");
  expect(destination(await send(dialog, bodies))).toBe(`${point.latitude},${point.longitude}`);
});

test("tile failure prevents confirmation of a blank map and leaves manual fallback available", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  await page.route("**/api/location/tiles/**", route => route.fulfill({ status: 503, body: "" }));
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await dialog.getByRole("button", { name: "Use current location" }).click();
  const picker = page.getByRole("dialog", { name: "Confirm Your Service Location" });
  await expect(picker.getByRole("button", { name: "Confirm Pin Location" })).toBeDisabled();
  await picker.getByRole("button", { name: "Cancel", exact: true }).click();
  await dialog.getByLabel("Service Location (Optional)").fill("QA fallback address");
  expectNoCoordinates(await send(dialog, bodies));
});

test("mobile touch panning changes the pin without scrolling the booking dialog", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000" });
  const page = await context.newPage();
  await page.route("**/api/location/tiles/**", route => route.fulfill({ contentType: "image/png", body: png }));
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  const picker = await openPicker(page, dialog);
  const scroll = await dialog.evaluate(element => element.scrollTop);
  const map = picker.getByRole("region", { name: "Service location map" });
  const bounds = (await map.boundingBox())!;
  const before = await picker.locator(".location-coordinates").innerText();
  const cdp = await context.newCDPSession(page);
  const x = bounds.x + bounds.width / 2; const y = bounds.y + bounds.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 55, y: y + 20 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(picker.locator(".location-coordinates")).not.toHaveText(before);
  expect(await dialog.evaluate(element => element.scrollTop)).toBe(scroll);
  const footer = (await picker.locator(".location-picker-footer").boundingBox())!;
  expect(footer.y + footer.height).toBeLessThanOrEqual(740);
  expect(await picker.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue(address);
  await page.screenshot({ path: "artifacts/location-picker-mobile.png" });
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  expect(destination(await send(dialog, bodies))).not.toBe(`${point.latitude},${point.longitude}`);
  await context.close();
});

test("the legacy Address field stays synchronized and requires pin reconfirmation after edits", async ({ page }) => {
  await mockLocation(page); await reverseAddress(page);
  const bodies = await captureSubmission(page);
  const dialog = await openForm(page);
  await confirmLocation(page, dialog);
  await dialog.locator(".optional-details summary").click();
  await expect(dialog.getByLabel("Address", { exact: true })).toHaveValue(address);
  await dialog.getByLabel("Address", { exact: true }).fill("QA changed legacy address");
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("QA changed legacy address");
  await expect(dialog.getByRole("button", { name: "Reconfirm pin" })).toBeVisible();
  expectNoCoordinates(await send(dialog, bodies));
});

test("closing the booking form discards pending GPS and cancelling adjustment preserves the saved pin", async ({ page }) => {
  await mockLocation(page, "deferred"); await reverseAddress(page);
  let dialog = await openForm(page);
  await dialog.getByRole("button", { name: "Use current location", exact: true }).click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[0]());
  await page.getByRole("button", { name: "Book Routine service & cleaning" }).click();
  dialog = page.locator("dialog.booking-dialog");
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("");
  await dialog.getByRole("button", { name: "Use current location", exact: true }).click();
  await page.evaluate(() => (window as unknown as TestWindow).locationTest.callbacks[1]());
  const picker = page.getByRole("dialog", { name: "Confirm Your Service Location" });
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue(address);
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  const href = await dialog.getByRole("link", { name: "Check in Google Maps" }).getAttribute("href");
  await dialog.getByRole("button", { name: "Adjust map pin" }).click();
  await picker.getByRole("region", { name: "Service location map" }).focus();
  await page.keyboard.press("ArrowDown");
  await picker.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog.getByRole("link", { name: "Check in Google Maps" })).toHaveAttribute("href", href!);
});

test("resizing then confirming cleans up delayed map callbacks", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await mockLocation(page); await reverseAddress(page);
  const dialog = await openForm(page);
  const picker = await openPicker(page, dialog);
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue(address);
  await picker.getByLabel("Selected address (editable)").fill("QA manually corrected entrance");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(picker.getByLabel("Selected address (editable)")).toHaveValue("QA manually corrected entrance");
  await picker.getByRole("button", { name: "Confirm Pin Location" }).click();
  // Leaflet 1.9 schedules resize moveend callbacks 200 ms later; exercise teardown.
  await page.waitForTimeout(350);
  expect(errors).toEqual([]);
  await expect(dialog.locator(".location-status")).toContainText("Location Confirmed");
  await expect(dialog.getByLabel("Service Location (Optional)")).toHaveValue("QA manually corrected entrance");
});
