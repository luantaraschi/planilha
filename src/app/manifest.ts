import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#FFFAF7",
    description: "Finanças, rotina e planos em um só lugar.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "any",
        src: "/icons/organiza-app.svg",
        type: "image/svg+xml",
      },
      {
        purpose: "maskable",
        sizes: "any",
        src: "/icons/organiza-maskable.svg",
        type: "image/svg+xml",
      },
    ],
    lang: "pt-BR",
    name: "Organiza",
    orientation: "any",
    scope: "/",
    short_name: "Organiza",
    start_url: "/",
    theme_color: "#A73655",
  };
}
