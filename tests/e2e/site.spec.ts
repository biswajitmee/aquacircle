import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const nativeForms = process.env.PLAYWRIGHT_ENQUIRY_PROVIDER === "netlify";
const submissionEndpoint = nativeForms ? "/__forms.html" : "/api/enquiries";
test("mobile swipes change slides while vertical gestures preserve scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForTimeout(1200);
  await page.locator(".hero-visual").evaluate((el) => {
    const t = (x: number, y: number) =>
      new Touch({ identifier: 0, target: el, clientX: x, clientY: y });
    el.dispatchEvent(
      new TouchEvent("touchstart", { touches: [t(300, 500)], bubbles: true }),
    );
    el.dispatchEvent(
      new TouchEvent("touchend", {
        changedTouches: [t(80, 510)],
        bubbles: true,
      }),
    );
  });
  await expect(page.locator(".slide-counter strong")).toHaveText("02");
  await page.locator(".hero-visual").evaluate((el) => {
    const t = (x: number, y: number) =>
      new Touch({ identifier: 0, target: el, clientX: x, clientY: y });
    el.dispatchEvent(
      new TouchEvent("touchstart", { touches: [t(200, 400)], bubbles: true }),
    );
    el.dispatchEvent(
      new TouchEvent("touchend", {
        changedTouches: [t(190, 600)],
        bubbles: true,
      }),
    );
  });
  await expect(page.locator(".slide-counter strong")).toHaveText("02");
});
test("mobile booking fits the viewport with scrollable optional fields", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  await page
    .locator(".hero-buttons")
    .getByRole("button", { name: "Request a visit" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("summary").click();
  const bounds = await dialog.boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(350);
  expect(bounds?.height).toBeLessThanOrEqual(716);
  await dialog.getByLabel("Purifier model").fill("Not sure");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});
const mobile = () =>
  `9${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;
test("homepage renders real headings and healthy images", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Water care.Made simple.",
  );
  await expect(
    page.getByRole("button", { name: "Book Installation & setup" }),
  ).toBeVisible();
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const broken = await page
    .locator("img")
    .evaluateAll((images) =>
      images
        .filter(
          (image) =>
            !(image as HTMLImageElement).complete ||
            (image as HTMLImageElement).naturalWidth === 0,
        )
        .map((image) => image.getAttribute("src")),
    );
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});
test("desktop services dropdown supports keyboard and Escape", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Services", exact: true });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#services-menu")).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: "Water purifier installation", exact: true })
      .first(),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#services-menu")).toBeHidden();
  await expect(trigger).toBeFocused();
});
test("all five hero masks settle without stale clipping and rapid clicks are safe", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForTimeout(1300);
  for (let index = 1; index < 5; index++) {
    await page.getByRole("button", { name: "Next slide", exact: true }).click();
    await expect(page.locator(".slide-counter strong")).toHaveText(
      `0${index + 1}`,
    );
    const layer = page.locator(`[data-slide="${index}"]`);
    await expect(layer).toHaveCSS("opacity", "1");
    await expect(layer).toHaveCSS("clip-path", "none");
  }
  await page.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(page.locator(".slide-counter strong")).toHaveText("01");
  await page
    .getByRole("button", { name: "Previous slide", exact: true })
    .click();
  await expect(page.locator(".slide-counter strong")).toHaveText("05");
  await page.getByRole("button", { name: "Installation", exact: true }).click();
  await page
    .getByRole("button", { name: "Next slide", exact: true })
    .dispatchEvent("click");
  await expect(page.locator(".slide-counter strong")).toHaveText("01");
  await expect(
    page.getByRole("button", { name: "Next slide", exact: true }),
  ).toBeEnabled();
});
test("reduced motion carousel remains immediately usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(page.locator(".slide-counter strong")).toHaveText("03");
  await expect(page.locator('[data-slide="2"]')).toHaveCSS("clip-path", "none");
});
test("every service card preselects its service and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.locator(".service-card");
  const ids = [
    "installation",
    "routine",
    "repair",
    "filters",
    "relocation",
    "guidance",
  ];
  for (let i = 0; i < 6; i++) {
    await cards.nth(i).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Service *", { exact: true })).toHaveValue(
      ids[i],
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(cards.nth(i)).toBeFocused();
  }
});
test("booking validation and focus stay in the modal", async ({ page }) => {
  await page.goto("/");
  await page
    .locator(".hero-buttons")
    .getByRole("button", { name: "Request a visit" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect(dialog.getByText("Please enter your name.")).toBeVisible();
  await expect(
    dialog.getByText("Enter a valid 10-digit Indian mobile number."),
  ).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
});
test("failed submission keeps customer details for retry", async ({ page }) => {
  await page.route(`**${submissionEndpoint}`, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Please try again shortly." }),
    }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Book Routine service & cleaning" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name *", { exact: true }).fill("QA Retry");
  await dialog.getByLabel("Mobile number *", { exact: true }).fill(mobile());
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700001");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Unable to submit your request right now. Please try again.",
  );
  await expect(dialog.getByLabel("Name *", { exact: true })).toHaveValue(
    "QA Retry",
  );
});
test("successful real enquiry reaches local SMTP capture", async ({
  page,
  request,
}) => {
  test.skip(nativeForms, "Netlify Forms uses its own notification service.");
  // Synthetic public test point; no real customer/device location is collected.
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 22.572645, longitude: 88.363892, accuracy: 20 });
  await page.route("**/api/location/reverse", route => route.fulfill({
    json: { address: "QA public test location, Kolkata", provider: "geoapify" },
  }));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Book Routine service & cleaning" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Name *", { exact: true })
    .fill("AquaCircle QA Customer");
  await dialog.getByLabel("Mobile number *", { exact: true }).fill(mobile());
  await dialog.getByLabel("PIN code *", { exact: true }).fill("700001");
  await dialog.getByRole("button", { name: "Use current location" }).click();
  await expect(dialog.getByRole("button", { name: "Confirm this location" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Confirm this location" }).click();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Send service request" }).click();
  await expect(dialog.getByText("Your service request has been received successfully. Our AquaCircle team will contact you shortly.")).toBeVisible(
    { timeout: 30000 },
  );
  const reference = await dialog.locator(".reference strong").innerText();
  expect(reference).toMatch(/^AC-\d{4}-[A-F0-9]{12}$/);
  await expect
    .poll(
      async () => {
        const inbox = await request.get("http://localhost:8025/api/messages");
        return JSON.stringify(await inbox.json());
      },
      { timeout: 20000 },
    )
    .toContain(reference);
  const inbox = await request.get("http://localhost:8025/api/messages");
  const messages = await inbox.json() as { text: string; html: string }[];
  const notification = messages.find(message => message.text.includes(reference));
  expect(notification?.text).toContain("SERVICE LOCATION DETAILS");
  expect(notification?.text).toContain("GPS Latitude: 22.572645");
  expect(notification?.text).toContain("GPS Longitude: 88.363892");
  expect(notification?.text).toContain("Location Accuracy: 20 metres");
  expect(notification?.text).toContain("https://www.google.com/maps/dir/?api=1&destination=22.572645%2C88.363892");
  expect(notification?.html).toContain("OPEN CUSTOMER LOCATION IN GOOGLE MAPS");
});
test("PIN checker validates and never invents coverage", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Your PIN code").fill("123");
  await page.getByRole("button", { name: "Check availability" }).click();
  await expect(
    page
      .getByText("Enter a valid six-digit Indian PIN code.", { exact: true })
      .first(),
  ).toBeVisible();
  await page.getByLabel("Your PIN code").fill("700001");
  await page.getByRole("button", { name: "Check availability" }).click();
  await expect(page.locator("#pin-result")).toContainText(
    "requires confirmation",
  );
  await page.getByRole("button", { name: "Ask about this PIN" }).click();
  await expect(
    page.getByRole("dialog").getByLabel("PIN code *", { exact: true }),
  ).toHaveValue("700001");
  await expect(
    page.getByRole("dialog").getByLabel("Service *", { exact: true }),
  ).toHaveValue("availability");
});
test("FAQ expands and collapses with accessible state", async ({ page }) => {
  await page.goto("/");
  const question = page.getByRole("button", {
    name: "Can you uninstall and reinstall my purifier?",
  });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq-answer-4")).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#faq-answer-4")).toHaveCSS("height", "0px");
});
test("mobile menu traps focus, navigates and restores body scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Navigation" });
  await expect(dialog).toBeVisible();
  await dialog.locator("summary").click();
  await expect(
    dialog.getByRole("link", { name: "All services" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await dialog.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
});
for (const width of [360, 390, 430, 768, 1024, 1440, 1920])
  test(`responsive layout has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await expect(page.locator("footer")).toBeVisible();
  });
test("footer links, all service pages and policies resolve with unique metadata", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const links = await page
    .locator("footer a")
    .evaluateAll((els) => [
      ...new Set(
        els
          .map((a) => a.getAttribute("href"))
          .filter((href): href is string => !!href && href.startsWith("/")),
      ),
    ]);
  const titles = new Set();
  for (const href of links) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
    const html = await response.text();
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    expect(title, href).toBeTruthy();
    if (!href.includes("#")) {
      expect(titles.has(title), `unique ${href}`).toBe(false);
      titles.add(title);
    }
    expect(html, href).toContain('rel="canonical"');
  }
  await page.goto("/does-not-exist");
  await expect(
    page.getByRole("heading", { name: /Let’s get you/ }),
  ).toBeVisible();
});
test("homepage and booking pass automated accessibility scan", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("footer").scrollIntoViewIfNeeded();
  const home = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(home.violations).toEqual([]);
  await page
    .locator(".hero-buttons")
    .getByRole("button", { name: "Request a visit" })
    .click();
  const modal = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations).toEqual([]);
});
test("API rejects invalid, hostile, oversized and rate-limited submissions", async ({
  request,
}) => {
  const payload = {
    name: "QA API",
    mobile: mobile(),
    pin: "700001",
    service: "guidance",
    consent: true,
    source: "contact-form",
  };
  expect(
    (
      await request.post("/api/enquiries", {
        data: { ...payload, mobile: "123" },
      })
    ).status(),
  ).toBe(422);
  expect(
    (
      await request.post("/api/enquiries", {
        data: { ...payload, website: "spam" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/enquiries", {
        headers: { Origin: "https://unrelated.example" },
        data: payload,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/enquiries", {
        data: { ...payload, problem: "x".repeat(17000) },
      })
    ).status(),
  ).toBe(413);
  const key = crypto.randomUUID();
  const first = await request.post("/api/enquiries", {
    headers: { "Idempotency-Key": key },
    data: payload,
  });
  expect(first.status()).toBe(202);
  const second = await request.post("/api/enquiries", {
    headers: { "Idempotency-Key": key },
    data: payload,
  });
  expect((await first.json()).reference).toBe((await second.json()).reference);
  for (let i = 0; i < 4; i++)
    await request.post("/api/enquiries", {
      headers: { "Idempotency-Key": key },
      data: payload,
    });
  expect(
    (await request.post("/api/enquiries", { data: payload })).status(),
  ).toBe(429);
});
