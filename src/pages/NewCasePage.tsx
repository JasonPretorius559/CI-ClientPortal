import { PageHeader } from "../components/ui/PageHeader";
import { PageShell } from "../components/ui/PageShell";
import { CaseCreateForm } from "../features/cases/CaseCreateForm";

export function NewCasePage() {
  return (
    <PageShell>
      <PageHeader title="Create New Case" description="Submit a new insurance case with the information needed for a clear first review." />
      <CaseCreateForm />
    </PageShell>
  );
}
