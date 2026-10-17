import test from "node:test";
import assert from "node:assert/strict";
import { roleLinks } from "../src/role-links";
test("presentation paths stay on one origin and QR passenger links use the explicit path", () => {
  const links = roleLinks("https://buskita-phi.vercel.app/office?stop=cp");
  assert.equal(links.role, "office");
  assert.equal(links.passenger, "https://buskita-phi.vercel.app/passenger");
  assert.equal(links.driver, "https://buskita-phi.vercel.app/driver");
  assert.equal(roleLinks("http://localhost:4317/driver").role, "driver");
  assert.equal(roleLinks("http://localhost:4317/").role, "passenger");
  assert.equal(roleLinks("http://localhost:4317/passenger?stop=fke").role, "passenger");
});
