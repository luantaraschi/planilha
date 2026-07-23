import type { CookieMethodsServer } from "@supabase/ssr";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

import { createClient } from "./server";

describe("server Supabase client", () => {
  beforeEach(() => {
    mocks.createServerClient.mockReset();
    mocks.cookies.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  });

  it("reads and writes the Next cookie store when writes are allowed", async () => {
    const cookieStore = {
      getAll: vi.fn(() => [{ name: "session", value: "token" }]),
      set: vi.fn(),
    };
    let adapter: CookieMethodsServer | undefined;

    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.createServerClient.mockImplementation((_, __, options) => {
      adapter = (options as { cookies: CookieMethodsServer }).cookies;
      return { auth: {} };
    });

    await createClient();
    expect(adapter?.setAll).toBeTypeOf("function");
    adapter!.setAll!([{ name: "session", value: "new-token", options: { path: "/" } }], {});

    expect(adapter?.getAll()).toEqual([{ name: "session", value: "token" }]);
    expect(cookieStore.set).toHaveBeenCalledWith("session", "new-token", { path: "/" });
  });

  it("does not throw when a Server Component rejects cookie writes", async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(() => {
        throw new Error("Cookie writes are not allowed here");
      }),
    };
    let adapter: CookieMethodsServer | undefined;

    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.createServerClient.mockImplementation((_, __, options) => {
      adapter = (options as { cookies: CookieMethodsServer }).cookies;
      return { auth: {} };
    });

    await createClient();
    expect(adapter?.setAll).toBeTypeOf("function");

    expect(() =>
      adapter!.setAll!([{ name: "session", value: "new-token", options: { path: "/" } }], {}),
    ).not.toThrow();
  });
});
