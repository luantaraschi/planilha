import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve("src/features/finance/finance-dashboard.module.css"),
  "utf8",
);

describe("finance tablet layout", () => {
  it("keeps summary and ledger split at the 900px navigation breakpoint", () => {
    const tabletRules = css
      .split("@media (max-width: 56.25rem)")[1]
      ?.split("@media (max-width: 47rem)")[0];

    expect(tabletRules).toContain(".workspace");
    expect(tabletRules).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1\.4fr\)\s*minmax\(16rem,\s*0\.68fr\)/,
    );
  });

  it("collapses the workspace only below the phone breakpoint", () => {
    const phoneRules = css
      .split("@media (max-width: 47rem)")[1]
      ?.split("@media (max-width: 34rem)")[0];

    expect(phoneRules).toMatch(
      /\.accountStrip,\s*\.monthlySummary,\s*\.workspace,\s*\.assistant\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
    );
  });
});
