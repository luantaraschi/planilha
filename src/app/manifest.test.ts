import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const manifestPath = resolve("src/app/manifest.ts");
const serviceWorkerPath = resolve("public/sw.js");
const registrationPath = resolve(
  "src/components/service-worker-registration.tsx",
);

describe("PWA manifest", () => {
  it("declares install metadata and authored Organiza icons", () => {
    expect(existsSync(manifestPath)).toBe(true);
    if (!existsSync(manifestPath)) return;

    const source = readFileSync(manifestPath, "utf8");

    expect(source).toMatch(/name:\s*"Organiza"/);
    expect(source).toMatch(/short_name:\s*"Organiza"/);
    expect(source).toContain("/icons/organiza-app.svg");
    expect(source).toContain("/icons/organiza-maskable.svg");
    expect(source).toMatch(/display:\s*"standalone"/);
    expect(source).toMatch(/lang:\s*"pt-BR"/);
    expect(source).toMatch(/start_url:\s*"\/"/);
    expect(source).toMatch(/theme_color:\s*"#A73655"/);
    expect(source).toMatch(/src:\s*"\/icons\/organiza-app\.svg"/);
    expect(source).toMatch(/purpose:\s*"any"/);
    expect(source).toMatch(/src:\s*"\/icons\/organiza-maskable\.svg"/);
    expect(source).toMatch(/purpose:\s*"maskable"/);
  });
});

describe("public offline shell", () => {
  it("never stores navigation or authenticated responses", () => {
    expect(existsSync(serviceWorkerPath)).toBe(true);
    if (!existsSync(serviceWorkerPath)) return;

    const source = readFileSync(serviceWorkerPath, "utf8");

    expect(source).toContain('const OFFLINE_SHELL = "/offline.html"');
    expect(source).toMatch(/request\.mode !== "navigate"/);
    expect(source).not.toMatch(/cache\.put|caches\.match\(request\)/);
    expect(source).not.toMatch(/\/api|supabase|authorization/i);
    expect(existsSync(resolve("public/offline.html"))).toBe(true);
    expect(existsSync(resolve("public/icons/organiza-app.svg"))).toBe(true);
    expect(existsSync(resolve("public/icons/organiza-maskable.svg"))).toBe(true);
  });

  it("registers natively and presents connection state with a retry action", () => {
    expect(existsSync(registrationPath)).toBe(true);
    if (!existsSync(registrationPath)) return;

    const source = readFileSync(registrationPath, "utf8");

    expect(source).toMatch(/navigator\.serviceWorker\.register\("\/sw\.js"\)/);
    expect(source).toMatch(/addEventListener\("offline"/);
    expect(source).toMatch(/addEventListener\("online"/);
    expect(source).toMatch(/Tentar novamente/);
  });
});
