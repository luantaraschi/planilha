import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

describe("Loading", () => {
  it("anuncia que o dia está sendo carregado", () => {
    render(<Loading />);

    expect(
      screen.getByRole("status", { name: "Carregando seu dia" }),
    ).toHaveAttribute("aria-busy", "true");
  });
});
