// Optional browser regression suite. Use PLAYWRIGHT_MODULE for an existing installation.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.TEST_URL || "http://127.0.0.1:4318";
(async () => {
  fs.mkdirSync("test-results", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-proxy-server"],
  });
  try {
    const contexts = await Promise.all(
      [1, 2, 3].map(() =>
        browser.newContext({ viewport: { width: 1440, height: 1000 } }),
      ),
    );
    const [student, driver, office] = await Promise.all(
      contexts.map((c) => c.newPage()),
    );
    const errors = [];
    for (const page of [student, driver, office])
      page.on("pageerror", (e) => errors.push(e.message));
    async function visit(page, url) {
      await page.goto(base + url, { waitUntil: "domcontentloaded" });
      await page
        .waitForLoadState("networkidle", { timeout: 4000 })
        .catch(() => {});
      await page.getByText("Demo connected", { exact: true }).waitFor();
    }
    const snapshot = async () =>
      fetch(base + "/api/state").then((r) => r.json());
    const act = async (body) => {
      const res = await fetch(base + "/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json() };
    };
    await Promise.all([
      visit(student, "/?stop=cp&user=amira"),
      visit(driver, "/driver"),
      visit(office, "/office"),
    ]);
    assert.equal(
      (
        await act({
          type: "book",
          userId: "amira",
          busId: "BK01",
          from: "cp",
          to: "fke",
          count: 0,
        })
      ).status,
      400,
    );
    await student.getByRole("tab", { name: "Plan a trip" }).click();
    await student.locator("#pickup").selectOption("cp");
    await student.locator("#destination").selectOption("fke");
    await student
      .getByRole("button", { name: "Request bus BK01", exact: true })
      .click();
    await student
      .getByRole("heading", { name: "Your bus is on its way." })
      .waitFor();
    await driver
      .locator(".driver-requests")
      .getByText("Amira", { exact: false })
      .waitFor();
    await office
      .locator(".activity-list")
      .getByText("Amira", { exact: false })
      .waitFor();
    assert.equal(
      (
        await act({
          type: "book",
          userId: "amira",
          busId: "BK02",
          from: "cp",
          to: "fke",
          count: 1,
        })
      ).status,
      400,
    );
    await driver.locator("#arrival-stop").selectOption("cp");
    await driver
      .getByRole("button", { name: "Demo: arrive & update passengers" })
      .click();
    await student
      .getByRole("heading", { name: "Enjoy your journey." })
      .waitFor();
    await driver
      .getByRole("button", { name: "Demo: arrive & update passengers" })
      .click();
    let s = await snapshot();
    assert.equal(
      s.requests
        .filter((r) => r.status === "onboard")
        .reduce((n, r) => n + r.count, 0),
      1,
    );
    await driver.locator("#arrival-stop").selectOption("fke");
    await driver
      .getByRole("button", { name: "Demo: arrive & update passengers" })
      .click();
    await student.getByRole("tab", { name: "Bus info", exact: true }).click();
    await student
      .getByText("Your last trip is complete. Thank you!")
      .waitFor();
    for (const [id, count] of [
      ["danial", 2],
      ["mei", 3],
    ]) {
      await student.getByLabel("Demo passenger profile").selectOption(id);
      await student.getByRole("tab", { name: "Plan a trip" }).click();
      await student.locator("#pickup").selectOption("cp");
      await student.locator("#destination").selectOption("fke");
      await student
        .getByRole("button", { name: `${count} passengers`, exact: true })
        .click();
      await student
        .getByRole("button", { name: "Request bus BK01", exact: true })
        .click();
      await student
        .getByRole("heading", { name: "Your bus is on its way." })
        .waitFor();
    }
    s = await snapshot();
    assert.equal(
      s.requests
        .filter((r) => r.status === "waiting")
        .reduce((n, r) => n + r.count, 0),
      5,
    );
    await student.getByRole("button", { name: "Cancel request" }).click();
    await student
      .getByRole("button", { name: "Request bus BK01", exact: true })
      .waitFor();
    await driver.locator("summary").click();
    await driver
      .getByLabel("Driver report")
      .fill("Test: traffic is clear at FKE.");
    await driver
      .getByRole("button", { name: "Send report", exact: true })
      .click();
    await office
      .getByText("Test: traffic is clear at FKE.", { exact: true })
      .waitFor();
    await office
      .getByLabel("Office notice")
      .fill("Test: please wait at the marked stop.");
    await office.getByRole("button", { name: "Publish notice" }).click();
    await student
      .getByText("Test: please wait at the marked stop.", { exact: true })
      .waitFor();
    const downloadPromise = office.waitForEvent("download");
    await office.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    assert.ok(download.suggestedFilename().endsWith(".csv"));
    await student
      .getByRole("button", { name: "Stop QR", exact: false })
      .click();
    await student.locator("dialog").waitFor({ state: "visible" });
    await student.locator("#qr-stop").selectOption("fke");
    assert.ok(
      (
        await student.locator(".demo-links a").first().getAttribute("href")
      ).includes("stop=fke"),
    );
    await student.keyboard.press("Escape");
    await student.locator("dialog").waitFor({ state: "detached" });
    await student
      .getByRole("button", { name: "Or pin your destination on the map" })
      .click();
    await student
      .locator(".map-canvas")
      .click({ position: { x: 530, y: 210 } });
    await student
      .locator("#destination option:checked")
      .getByText("Your pinned destination")
      .waitFor({ state: "attached" });
    await student.screenshot({
      path: "test-results/passenger-plan.png",
      fullPage: true,
    });
    await driver.screenshot({
      path: "test-results/driver.png",
      fullPage: true,
    });
    await office.screenshot({
      path: "test-results/office.png",
      fullPage: true,
    });
    for (const page of [student, driver, office]) {
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    await student.screenshot({
      path: "test-results/mobile-plan.png",
      fullPage: true,
    });
    // A separate driver browser with permission denied must not fabricate a location.
    const denied = await browser.newContext({ permissions: [] });
    const deniedPage = await denied.newPage();
    await visit(deniedPage, "/driver?bus=BK03");
    await deniedPage
      .getByRole("button", { name: "Share phone GPS" })
      .click();
    await deniedPage
      .getByRole("alert")
      .filter({ hasText: "Location permission denied" })
      .waitFor();
    s = await snapshot();
    assert.equal(s.buses.find((b) => b.id === "BK03").updatedAt, 0);
    await act({ type: "mode", busId: "BK03", mode: "demo" });
    await denied.close();
    // Server rejects poor, stale, and backwards-time GPS, preserves a real zero speed.
    await act({ type: "mode", busId: "BK02", mode: "gps" });
    const ts = Date.now();
    assert.equal(
      (
        await act({
          type: "gps",
          busId: "BK02",
          lat: 1.55745,
          lng: 103.64455,
          accuracy: 5,
          timestamp: ts,
          speed: 0,
        })
      ).status,
      200,
    );
    s = await snapshot();
    assert.equal(s.buses.find((b) => b.id === "BK02").speed, 0);
    assert.equal(
      (
        await act({
          type: "gps",
          busId: "BK02",
          lat: 1.55745,
          lng: 103.64455,
          accuracy: 500,
          timestamp: ts + 1,
          speed: 0,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await act({
          type: "gps",
          busId: "BK02",
          lat: 1.55745,
          lng: 103.64455,
          accuracy: 5,
          timestamp: ts - 1,
          speed: 0,
        })
      ).status,
      400,
    );
    await act({ type: "mode", busId: "BK02", mode: "demo" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: independent passenger/driver/office sessions, 3 identities, booking, duplicate rejection, boarding, alighting, cancellation, report, notice, CSV, QR, map pin, mobile overflow, GPS denial and validation.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
