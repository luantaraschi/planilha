"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { completeCurrentOnboarding } from "./identity-repository";
import { normalizeOnboardingInput } from "./identity-model";

export type OnboardingState = { message: string };

export async function completeOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const input = normalizeOnboardingInput(formData);
  if (!input.ok) return { message: input.message };

  if (!(await completeCurrentOnboarding(input.value))) {
    return {
      message: "Não foi possível preparar seu espaço. Tente novamente.",
    };
  }

  revalidatePath("/");
  redirect("/");
}
