import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, CheckCircle2, Eye, FileCheck2, FileSearch, GitCompareArrows, Presentation, UserRound } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/Card";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { LoadingSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { PageHeader } from "../../../../components/ui/PageHeader";
import { AdminPageAccess } from "../../AdminPageAccess";
import { SchemaFieldsPreview } from "../components/SchemaFieldsPreview";
import { getStructuredOutputSchemaFields, listStructuredOutputSchemas } from "../structuredOutputSchemas.api";

const workflows = {
  comparison: { name: "Comparison", icon: GitCompareArrows },
  policy_analysis: { name: "Policy Analysis", icon: FileSearch },
  record_of_advice: { name: "Record of Advice", icon: FileCheck2 },
  agm_pack: { name: "AGM Pack", icon: Presentation },
} as const;

const lanes = [
  { key: "commercial", name: "Commercial", icon: BriefcaseBusiness, workflowKeys: ["comparison", "policy_analysis", "record_of_advice"] },
  { key: "personal", name: "Personal", icon: UserRound, workflowKeys: ["comparison", "policy_analysis", "record_of_advice"] },
  { key: "sectional_title", name: "Sectional Title", icon: Building2, workflowKeys: ["comparison", "policy_analysis", "record_of_advice", "agm_pack"] },
] as const;

export function StructuredOutputSchemasPage() {
  const [selectedKey, setSelectedKey] = useState("");
  const schemasQuery = useQuery({ queryKey: ["admin", "hardcoded-structured-schemas"], queryFn: listStructuredOutputSchemas });
  const fieldsQuery = useQuery({ queryKey: ["admin", "hardcoded-structured-schema-fields", selectedKey], queryFn: () => getStructuredOutputSchemaFields(selectedKey), enabled: Boolean(selectedKey) });

  return (
    <AdminPageAccess>
      <div className="page-section">
        <PageHeader title="Analysis Schema Map" description="Read-only system schemas compiled into Cloud Insure. They cannot be created, edited, published, or deleted from the portal." />

        <section className="overflow-hidden rounded-[2rem] border border-ink-950 bg-ink-950 text-white shadow-[0_20px_55px_rgba(17,17,17,0.16)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_240px] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warning-100">System contract</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-[-0.045em] sm:text-3xl">Deterministic outputs, matched to each insurance workflow.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Code deployment is the only way to change these schemas. Select a workflow below to inspect its hardcoded field contract.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Registry</p>
              <div className="mt-2 flex items-end justify-between"><p className="text-3xl font-bold">10<span className="text-base text-white/35"> / 10</span></p><Badge tone="attention">Locked</Badge></div>
            </div>
          </div>
        </section>

        {schemasQuery.isLoading ? <div className="grid gap-4 xl:grid-cols-3"><LoadingSkeleton className="h-96" /><LoadingSkeleton className="h-96" /><LoadingSkeleton className="h-96" /></div> : null}
        {schemasQuery.isError ? <ErrorState title="Unable to load the hardcoded registry" message={schemasQuery.error instanceof Error ? schemasQuery.error.message : "Schema metadata could not be loaded."} onRetry={() => void schemasQuery.refetch()} /> : null}

        {schemasQuery.data ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {lanes.map((lane, index) => {
              const LaneIcon = lane.icon;
              return (
                <section key={lane.key} className="rounded-[1.75rem] border border-ink-200 bg-white p-5 shadow-[0_10px_28px_rgba(17,17,17,0.045)]">
                  <div className="flex items-center gap-3 border-b border-ink-200 pb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white"><LaneIcon className="h-4 w-4" aria-hidden="true" /></span>
                    <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-warning-700">Product line 0{index + 1}</p><h2 className="mt-1 text-lg font-bold tracking-[-0.035em] text-ink-950">{lane.name}</h2></div>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {lane.workflowKeys.map((workflowKey) => {
                      const workflow = workflows[workflowKey];
                      const WorkflowIcon = workflow.icon;
                      const schemaKey = `${lane.key}_${workflowKey}_v1`;
                      const schema = schemasQuery.data.find((item) => item.key === schemaKey);
                      return (
                        <article key={schemaKey} className="rounded-xl border border-ink-200 bg-[#faf9f6] p-3.5">
                          <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-white"><WorkflowIcon className="h-4 w-4" aria-hidden="true" /></span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-ink-950">{workflow.name}</h3><CheckCircle2 className="h-4 w-4 text-success-700" aria-label="Hardcoded and active" /></div>
                              <p className="mt-1.5 break-all font-mono text-[10px] text-ink-500">{schemaKey}</p>
                              <div className="mt-3 flex items-center justify-between"><Badge tone="dashed">Code v{schema?.version ?? 1}</Badge><Button variant="ghost" className="h-9 px-3" onClick={() => setSelectedKey(schemaKey)}><Eye className="h-3.5 w-3.5" aria-hidden="true" />Fields</Button></div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}

        {selectedKey ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Hardcoded fields · {selectedKey}</CardTitle>
                  <p className="mt-2 text-sm text-ink-600">Read-only system contract compiled into the application.</p>
                </div>
                <Button variant="ghost" onClick={() => setSelectedKey("")}>Close</Button>
              </div>
            </CardHeader>
            <CardContent>
              {fieldsQuery.isLoading ? <LoadingSkeleton className="h-40" /> : null}
              {fieldsQuery.isError ? <ErrorState title="Unable to load schema fields" message={fieldsQuery.error instanceof Error ? fieldsQuery.error.message : "Field metadata could not be loaded."} onRetry={() => void fieldsQuery.refetch()} /> : null}
              {fieldsQuery.data ? <SchemaFieldsPreview fields={fieldsQuery.data} /> : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminPageAccess>
  );
}
