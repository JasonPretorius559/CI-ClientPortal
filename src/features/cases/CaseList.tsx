import { CaseCard } from "./CaseCard";
import { CaseTable } from "./CaseTable";

export function CaseList({ cases }: { cases: unknown[] }) {
  return (
    <>
      <div className="hidden md:block">
        <CaseTable cases={cases} />
      </div>
      <div className="space-y-3 md:hidden">
        {cases.map((caseItem, index) => (
          <CaseCard key={`${index}`} caseItem={caseItem} />
        ))}
      </div>
    </>
  );
}
