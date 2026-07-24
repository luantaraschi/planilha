import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#FFFAF7",
    description: "Organização pessoal, rotina e finanças em um só lugar.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "any",
        src: "/icons/garden-app.svg",
        type: "image/svg+xml",
      },
      {
        purpose: "maskable",
        sizes: "any",
        src: "/icons/garden-maskable.svg",
        type: "image/svg+xml",
      },
    ],
    lang: "pt-BR",
    name: "Meu espaço",
    orientation: "any",
    scope: "/",
    short_name: "Meu espaço",
    start_url: "/",
    theme_color: "#A73655",
  };
}
