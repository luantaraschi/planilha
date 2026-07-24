import { redirect } from "next/navigation";
import { NotesDashboard } from "@/features/personal/personal-dashboard";
import { getCurrentNotes } from "@/features/personal/personal-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";

export default async function NotesPage() {
  const identity = await getCurrentIdentity();
  if (!identity.profile.onboarding_completed) redirect("/onboarding");
  return <NotesDashboard notes={await getCurrentNotes()} />;
}
