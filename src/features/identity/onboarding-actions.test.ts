import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getClaims: vi.fn(),
  rpc: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { completeOnboarding } from "./onboarding-actions";

const INITIAL_STATE = { message: "" };

function onboardingData(displayName = " Lu ") {
  const data = new FormData();
  data.set("displayName", displayName);
  data.set("timezone", "America/Bahia");
  data.set("emailReminders", "on");
  return data;
}

function verifiedClaims() {
  return {
    data: {
      claims: {
        iss: "http://supabase.test/auth/v1",
        sub: "user-123",
        aud: "authenticated",
        exp: 2_000_000_000,
        iat: 1_999_996_400,
        role: "authenticated",
        aal: "aal1",
        session_id: "session-123",
      },
      header: { alg: "RS256", kid: "test-key", typ: "JWT" },
      signature: new Uint8Array(),
    },
    error: null,
  };
}

describe("onboarding action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: { getClaims: mocks.getClaims },
      rpc: mocks.rpc,
    });
    mocks.getClaims.mockResolvedValue(verifiedClaims());
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it("validates before accessing Supabase", async () => {
    await expect(
      completeOnboarding(INITIAL_STATE, onboardingData(" ")),
    ).resolves.toEqual({
      message: "Informe um nome com até 80 caracteres.",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("verifies authentication for the write", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });

    await expect(
      completeOnboarding(INITIAL_STATE, onboardingData()),
    ).rejects.toThrow("NEXT_REDIRECT:/entrar");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns a safe message when the RPC fails", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: new Error("sensitive database detail"),
    });

    await expect(
      completeOnboarding(INITIAL_STATE, onboardingData()),
    ).resolves.toEqual({
      message: "Não foi possível preparar seu espaço. Tente novamente.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("calls the onboarding RPC, revalidates and redirects home", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(
      completeOnboarding(INITIAL_STATE, onboardingData()),
    ).rejects.toThrow("NEXT_REDIRECT:/");

    expect(mocks.rpc).toHaveBeenCalledWith("complete_onboarding", {
      display_name_input: "Lu",
      timezone_input: "America/Bahia",
      email_reminders_input: true,
      ai_consent_input: false,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });
});
