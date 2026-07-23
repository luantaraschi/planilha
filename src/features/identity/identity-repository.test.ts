import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(),
  getClaims: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { getCurrentIdentity } from "./identity-repository";

const PROFILE_FIELDS =
  "user_id, display_name, avatar_url, onboarding_completed";
const PREFERENCE_FIELDS =
  "user_id, currency, locale, timezone, week_starts_on, email_reminders, ai_processing_consent";

const profile = {
  user_id: "user-123",
  display_name: "Lu",
  avatar_url: null,
  onboarding_completed: false,
};

const preferences = {
  user_id: "user-123",
  currency: "BRL",
  locale: "pt-BR",
  timezone: "America/Bahia",
  week_starts_on: 0,
  email_reminders: true,
  ai_processing_consent: false,
};

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function query(single: ReturnType<typeof vi.fn>) {
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, single };
}

describe("identity repository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
    mocks.createClient.mockResolvedValue({
      auth: { getClaims: mocks.getClaims },
      from: mocks.from,
    });
  });

  it("redirects to login when verified claims are absent", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });

    await expect(getCurrentIdentity()).rejects.toThrow(
      "NEXT_REDIRECT:/entrar",
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("loads exact profile and preference fields in parallel", async () => {
    const profileResult = deferred<{
      data: typeof profile;
      error: null;
    }>();
    const preferenceResult = deferred<{
      data: typeof preferences;
      error: null;
    }>();
    const profileQuery = query(
      vi.fn(() => profileResult.promise),
    );
    const preferenceQuery = query(
      vi.fn(() => preferenceResult.promise),
    );
    mocks.getClaims.mockResolvedValue(verifiedClaims());
    mocks.from.mockImplementation((table: string) =>
      table === "profiles" ? profileQuery : preferenceQuery,
    );

    const identityPromise = getCurrentIdentity();
    await vi.waitFor(() => {
      expect(profileQuery.single).toHaveBeenCalledOnce();
      expect(preferenceQuery.single).toHaveBeenCalledOnce();
    });

    expect(profileQuery.select).toHaveBeenCalledWith(PROFILE_FIELDS);
    expect(preferenceQuery.select).toHaveBeenCalledWith(PREFERENCE_FIELDS);
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.from).toHaveBeenCalledWith("preferences");
    expect(profileQuery.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(preferenceQuery.eq).toHaveBeenCalledWith(
      "user_id",
      "user-123",
    );

    profileResult.resolve({ data: profile, error: null });
    preferenceResult.resolve({ data: preferences, error: null });

    await expect(identityPromise).resolves.toEqual({
      userId: "user-123",
      profile,
      preferences,
    });
  });

  it.each(["profiles", "preferences"])(
    "fails safely when the %s row is missing",
    async (missingTable) => {
      const profileQuery = query(
        vi.fn().mockResolvedValue({
          data: missingTable === "profiles" ? null : profile,
          error:
            missingTable === "profiles"
              ? new Error("sensitive database detail")
              : null,
        }),
      );
      const preferenceQuery = query(
        vi.fn().mockResolvedValue({
          data: missingTable === "preferences" ? null : preferences,
          error:
            missingTable === "preferences"
              ? new Error("sensitive database detail")
              : null,
        }),
      );
      mocks.getClaims.mockResolvedValue(verifiedClaims());
      mocks.from.mockImplementation((table: string) =>
        table === "profiles" ? profileQuery : preferenceQuery,
      );

      const identityPromise = getCurrentIdentity();

      await expect(identityPromise).rejects.toThrow(
        "Não foi possível carregar seu perfil.",
      );
      await expect(identityPromise).rejects.not.toThrow(
        "sensitive database detail",
      );
    },
  );
});
