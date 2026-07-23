import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  redirect: vi.fn((url: URL) => url),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/server", () => ({
  NextResponse: { redirect: mocks.redirect },
}));

import { GET } from "./route";

function request(search = "") {
  return {
    nextUrl: new URL(`https://planner.test/auth/callback${search}`),
  } as NextRequest;
}

function redirectedTo() {
  return (mocks.redirect.mock.calls.at(-1)?.[0] as URL).toString();
}

describe("PKCE callback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
    });
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: {}, user: {} },
      error: null,
    });
  });

  it("returns to login when code is absent", async () => {
    await GET(request("?next=/onboarding"));

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(redirectedTo()).toBe("https://planner.test/entrar");
  });

  it("returns to login when the PKCE exchange fails", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error("invalid code"),
    });

    await GET(request("?code=bad&next=/onboarding"));

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("bad");
    expect(redirectedTo()).toBe("https://planner.test/entrar");
  });

  it("rejects protocol-relative and parser-reinterpreted destinations", async () => {
    await GET(request("?code=ok&next=//evil.test/path"));
    expect(redirectedTo()).toBe("https://planner.test/");

    await GET(request("?code=ok&next=/%5Cevil.test/path"));
    expect(redirectedTo()).toBe("https://planner.test/");
  });

  it("allows a relative destination after a successful exchange", async () => {
    await GET(request("?code=ok&next=/onboarding?step=1"));

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("ok");
    expect(redirectedTo()).toBe(
      "https://planner.test/onboarding?step=1",
    );
  });
});
