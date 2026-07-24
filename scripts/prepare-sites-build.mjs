import { cpSync, existsSync, renameSync, rmSync } from "node:fs";

if (!existsSync(".open-next/worker.js")) {
  throw new Error("Run the OpenNext build before preparing the Sites archive.");
}

rmSync("dist", { force: true, recursive: true });
cpSync(".open-next", "dist/server", { recursive: true });
renameSync("dist/server/worker.js", "dist/server/index.js");
cpSync(".open-next/assets", "dist/static", { recursive: true });
