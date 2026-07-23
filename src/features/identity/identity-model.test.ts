import { describe, expect, it } from "vitest";
import { normalizeAuthInput, normalizeOnboardingInput } from "./identity-model";

describe("identity input", () => {
  it("normalizes a valid email and password", () => {
    const data = new FormData();
    data.set("email", " LU@EXAMPLE.COM ");
    data.set("password", "12345678");
    expect(normalizeAuthInput(data)).toEqual({
      ok: true,
      value: { email: "lu@example.com", password: "12345678" },
    });
  });

  it("rejects an invalid login", () => {
    const data = new FormData();
    data.set("email", "sem-email");
    data.set("password", "123");
    expect(normalizeAuthInput(data)).toEqual({
      ok: false,
      message: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres.",
    });
  });

  it("normalizes onboarding preferences", () => {
    const data = new FormData();
    data.set("displayName", " Lu ");
    data.set("timezone", "America/Bahia");
    data.set("emailReminders", "on");
    expect(normalizeOnboardingInput(data)).toEqual({
      ok: true,
      value: {
        displayName: "Lu",
        timezone: "America/Bahia",
        emailReminders: true,
        aiConsent: false,
      },
    });
  });
});
