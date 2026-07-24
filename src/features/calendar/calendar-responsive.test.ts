import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("calendar responsive contract", () => {
  it("mantém o painel de detalhe visível em tablet de 800px", () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        "src/features/calendar/calendar-workspace.module.css",
      ),
      "utf8",
    );
    expect(css).not.toMatch(
      /@media\s*\(max-width:\s*50rem\)[\s\S]*?\.dayDetail\s*\{\s*display:\s*none/,
    );
  });
});
