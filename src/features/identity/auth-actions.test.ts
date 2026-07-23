import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  signIn,
  signInWithGoogle,
  signOut,
  signUp,
} from "./auth-actions";

const INITIAL_STATE = { message: "" };

function credentials(email = "LU@EXAMPLE.COM", password = "12345678") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

describe("authentication actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: {
        signInWithPassword: mocks.signInWithPassword,
        signUp: mocks.signUp,
        signInWithOAuth: mocks.signInWithOAuth,
        signOut: mocks.signOut,
      },
    });
    mocks.headers.mockResolvedValue(
      new Headers({ origin: "https://planner.test" }),
    );
  });

  it("validates credentials before login", async () => {
    const result = await signIn(
      INITIAL_STATE,
      credentials("invalid", "short"),
    );

    expect(result.message).toMatch(/e-mail válido/);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("logs in with normalized credentials and redirects home", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    await signIn(INITIAL_STATE, credentials());

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "lu@example.com",
      password: "12345678",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("returns a user-correctable login error", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("invalid credentials"),
    });

    await expect(signIn(INITIAL_STATE, credentials())).resolves.toEqual({
      message: "Não foi possível entrar. Confira seu e-mail e sua senha.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("validates credentials before signup", async () => {
    const result = await signUp(INITIAL_STATE, credentials("", ""));

    expect(result.message).toMatch(/e-mail válido/);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("creates an account and redirects to onboarding", async () => {
    mocks.signUp.mockResolvedValue({ data: {}, error: null });

    await signUp(INITIAL_STATE, credentials());

    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "lu@example.com",
      password: "12345678",
    });
    expect(mocks.redirect).toHaveBeenCalledWith("/onboarding");
  });

  it("returns a user-correctable signup error", async () => {
    mocks.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("duplicate"),
    });

    await expect(signUp(INITIAL_STATE, credentials())).resolves.toEqual({
      message:
        "Não foi possível criar sua conta. Confira os dados informados.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("starts Google OAuth with the local callback", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.test/auth" },
      error: null,
    });

    await signInWithGoogle(INITIAL_STATE);

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "https://planner.test/auth/callback?next=/onboarding",
      },
    });
    expect(mocks.redirect).toHaveBeenCalledWith(
      "https://accounts.google.test/auth",
    );
  });

  it("returns an OAuth error without a local origin", async () => {
    mocks.headers.mockResolvedValueOnce(new Headers());

    await expect(signInWithGoogle(INITIAL_STATE)).resolves.toEqual({
      message: "Não foi possível iniciar o acesso com o Google.",
    });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns an OAuth error without an authorization URL", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { provider: "google", url: null },
      error: new Error("provider unavailable"),
    });

    await expect(signInWithGoogle(INITIAL_STATE)).resolves.toEqual({
      message: "Não foi possível continuar com o Google.",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("signs out and returns to login", async () => {
    mocks.signOut.mockResolvedValue({ error: null });

    await signOut();

    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/entrar");
  });
});
