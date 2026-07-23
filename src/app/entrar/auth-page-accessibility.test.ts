import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const authCss = readFileSync(
  resolve("src/app/entrar/auth-page.module.css"),
  "utf8",
);
const globalCss = readFileSync(
  resolve("src/app/globals.css"),
  "utf8",
);

function declarations(source: string, selector: string) {
  const selectorStart = source.indexOf(`${selector} {`);
  if (selectorStart < 0) throw new Error(`Missing CSS rule: ${selector}`);
  const bodyStart = source.indexOf("{", selectorStart) + 1;
  const bodyEnd = source.indexOf("}", bodyStart);

  return Object.fromEntries(
    source
      .slice(bodyStart, bodyEnd)
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf(":");
        return [
          entry.slice(0, separator).trim(),
          entry.slice(separator + 1).trim(),
        ];
      }),
  );
}

function token(name: string) {
  const value = globalCss.match(
    new RegExp(`${name}\\s*:\\s*(#[\\da-f]{6})`, "i"),
  )?.[1];
  if (!value) throw new Error(`Missing color token: ${name}`);
  return value;
}

function rgb(hex: string) {
  return [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16),
  );
}

function blend(foreground: string, background: string, alpha: number) {
  const fg = rgb(foreground);
  const bg = rgb(background);
  return fg.map((channel, index) =>
    Math.round(channel * alpha + bg[index] * (1 - alpha)),
  );
}

function luminance(color: number[]) {
  const [red, green, blue] = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrast(foreground: number[], background: number[]) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

describe("authentication page contrast", () => {
  it("keeps placeholder text at WCAG AA contrast", () => {
    const placeholder = declarations(
      authCss,
      ".credentialsForm > input::placeholder",
    );
    const foregroundToken = placeholder.color.match(/var\((--[^)]+)\)/)?.[1];
    if (!foregroundToken) throw new Error("Placeholder must use a color token");
    const background = token("--porcelain");
    const effectiveForeground = blend(
      token(foregroundToken),
      background,
      Number(placeholder.opacity ?? 1),
    );

    expect(
      contrast(effectiveForeground, rgb(background)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("puts mobile hero copy on opaque AA surfaces", () => {
    const mobileCss = authCss.slice(
      authCss.indexOf("@media (max-width: 760px)"),
      authCss.indexOf("@media (max-width: 430px)"),
    );

    expect(declarations(mobileCss, ".brand").background).toBe(
      "var(--porcelain)",
    );
    expect(declarations(mobileCss, ".welcome").background).toBe(
      "var(--porcelain)",
    );

    for (const foreground of ["--cocoa", "--clay", "--raspberry"]) {
      expect(
        contrast(rgb(token(foreground)), rgb(token("--porcelain"))),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
