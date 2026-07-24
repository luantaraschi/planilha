import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve("src/features/finance/finance-dashboard.module.css"),
  "utf8",
);
const navigationCss = readFileSync(
  resolve("src/features/today/today-dashboard.module.css"),
  "utf8",
);

describe("finance tablet layout", () => {
  it("keeps summary and ledger split with the labeled rail through 1023px", () => {
    const tabletRules = css
      .split("@media (max-width: 63.999rem)")[1]
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

  it("applies the 48px contract to every visible finance control", () => {
    expect(css).toMatch(
      /\.skipLink,\s*\.accountSelector select,\s*\.accountSelector button,\s*\.formGrid input,\s*\.formGrid select,\s*\.importControls select,\s*\.fileDrop,\s*\.fileDrop input,\s*\.moneyInput,\s*\.primaryButton,\s*\.secondaryButton,\s*\.removeButton,\s*\.suggestions button,\s*\.chatForm input,\s*\.chatForm button\s*\{[^}]*min-height:\s*3rem/,
    );
  });

  it("applies the same contract to navigation visible on finance", () => {
    expect(navigationCss).toMatch(
      /\.brand,\s*\.navItem,\s*\.navActive,\s*\.moreSummary,\s*\.moreMenu a,\s*\.moreMenu button,\s*\.signOutButton\s*\{[^}]*min-height:\s*3rem/,
    );
  });
});
