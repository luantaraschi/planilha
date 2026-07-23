import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GardenIcon } from "./garden-icon";

describe("GardenIcon", () => {
  it("expõe uma imagem nomeada quando recebe título", () => {
    render(<GardenIcon name="today" title="Hoje" />);

    expect(screen.getByRole("img", { name: "Hoje" })).toBeInTheDocument();
  });

  it("permanece decorativo quando não recebe título", () => {
    const { container } = render(<GardenIcon name="finance" />);

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
