import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Nunito_Sans: () => ({ variable: "font-ui" }),
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("declares the document smooth-scroll behavior for Next navigation", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main>Conteúdo</main>
      </RootLayout>,
    );

    expect(markup).toContain('data-scroll-behavior="smooth"');
  });
});
