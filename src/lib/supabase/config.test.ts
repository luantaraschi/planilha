import { describe, expect, it } from "vitest";
import { getSupabaseConfig } from "./config";

describe("getSupabaseConfig", () => {
  it("returns a valid public configuration", () => {
    expect(
      getSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
      }),
    ).toEqual({
      url: "http://127.0.0.1:54321",
      publishableKey: "test-key",
    });
  });

  it("rejects missing configuration without exposing secrets", () => {
    expect(() => getSupabaseConfig({})).toThrow("Supabase não configurado.");
  });
});
