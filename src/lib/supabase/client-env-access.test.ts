import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("browser Supabase environment access", () => {
  it("keeps public variables statically visible to the Next client bundle", async () => {
    const source = await readFile(
      join(process.cwd(), "src", "lib", "supabase", "client.ts"),
      "utf8",
    );

    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_URL");
    expect(source).toContain(
      "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
    expect(source).toContain("process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(source).not.toContain("getSupabaseConfig(process.env)");
  });
});
