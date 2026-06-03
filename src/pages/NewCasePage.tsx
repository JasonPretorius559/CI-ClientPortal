import { PageHeader } from "../components/ui/PageHeader";
import { CaseCreateForm } from "../features/cases/CaseCreateForm";

export function NewCasePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create New Case" description="Submit a new insurance case with the information needed for a clear first review." />
      <CaseCreateForm />
    </div>
  );
}
