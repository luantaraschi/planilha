import type { CookieMethodsServer } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  next: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("next/server", () => ({
  NextResponse: { next: mocks.next },
}));

import { updateSession } from "./proxy";

type Response = {
  cookies: { set: ReturnType<typeof vi.fn> };
  headers: { set: ReturnType<typeof vi.fn> };
};

function createResponse(): Response {
  return { cookies: { set: vi.fn() }, headers: { set: vi.fn() } };
}

describe("updateSession", () => {
  beforeEach(() => {
    mocks.createServerClient.mockReset();
    mocks.next.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  });

  it("reads request cookies, refreshes claims once, and applies refreshed cookies", async () => {
    const initialResponse = createResponse();
    const refreshedResponse = createResponse();
    const unusedResponse = createResponse();
    const requestCookies = [{ name: "session", value: "old-token" }];
    const request = {
      cookies: { getAll: vi.fn(() => requestCookies), set: vi.fn() },
    } as unknown as NextRequest;
    const cookiesToSet = [{ name: "session", value: "new-token", options: { path: "/" } }];
    const headers = { "Cache-Control": "no-store" };
    let adapter: CookieMethodsServer | undefined;
    const getClaims = vi.fn(async () => {
      adapter?.setAll?.(cookiesToSet, headers);
      return { data: { claims: { sub: "user-1" } }, error: null };
    });

    mocks.next
      .mockReturnValueOnce(initialResponse)
      .mockReturnValueOnce(refreshedResponse)
      .mockReturnValueOnce(unusedResponse);
    mocks.createServerClient.mockImplementation((_, __, options) => {
      adapter = (options as { cookies: CookieMethodsServer }).cookies;
      return { auth: { getClaims } };
    });

    const result = await updateSession(request);
    expect(adapter?.getAll()).toEqual(requestCookies);

    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(result.response).toBe(refreshedResponse);
    expect(result.claims).toEqual({ claims: { sub: "user-1" } });
    expect(request.cookies.set).toHaveBeenCalledWith("session", "new-token");
    expect(refreshedResponse.cookies.set).toHaveBeenCalledWith(
      "session",
      "new-token",
      { path: "/" },
    );
    expect(refreshedResponse.headers.set).toHaveBeenCalledWith(
      "Cache-Control",
      "no-store",
    );
  });
});
