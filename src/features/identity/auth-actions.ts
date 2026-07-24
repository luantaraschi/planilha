"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeAuthInput } from "./identity-model";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { message: string };

export async function signIn(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const input = normalizeAuthInput(formData);
  if (!input.ok) return { message: input.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input.value);
  if (error) {
    return {
      message:
        "Não foi possível entrar. Confira os dados ou, no primeiro acesso, escolha Criar minha conta.",
    };
  }

  redirect("/");
}

export async function signUp(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const input = normalizeAuthInput(formData);
  if (!input.ok) return { message: input.message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(input.value);
  if (error) {
    return {
      message: "Não foi possível criar sua conta. Confira os dados informados.",
    };
  }

  redirect("/onboarding");
}

export async function signInWithGoogle(
  _previousState: AuthState,
): Promise<AuthState> {
  void _previousState;
  const origin = (await headers()).get("origin");
  if (!origin) {
    return { message: "Não foi possível iniciar o acesso com o Google." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/onboarding` },
  });

  if (error || !data.url) {
    return { message: "Não foi possível continuar com o Google." };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
