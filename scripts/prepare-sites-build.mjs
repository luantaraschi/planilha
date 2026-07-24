import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

if (!existsSync(".sites-worker/worker.js")) {
  throw new Error("Run the bundled Worker build before preparing the Sites archive.");
}

rmSync("dist", { force: true, recursive: true });
mkdirSync("dist/server", { recursive: true });
cpSync(".sites-worker/worker.js", "dist/server/index.js");
cpSync(".open-next/assets", "dist/static", { recursive: true });
