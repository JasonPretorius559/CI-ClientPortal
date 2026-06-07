import { Link } from "react-router-dom";
import { Database, FileJson2, PanelsTopLeft } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { AdminPageAccess } from "../AdminPageAccess";
import { adminMasterfileConfigs } from "../adminMasterfile.config";

const setupCards = [
  {
    title: adminMasterfileConfigs.caseTypes.label,
    description: adminMasterfileConfigs.caseTypes.description,
    to: "/admin/setup/case-types",
    icon: Database,
  },
  {
    title: adminMasterfileConfigs.linkedCaseTypes.label,
    description: adminMasterfileConfigs.linkedCaseTypes.description,
    to: "/admin/setup/linked-case-types",
    icon: Database,
  },
  {
    title: adminMasterfileConfigs.entityTypes.label,
    description: adminMasterfileConfigs.entityTypes.description,
    to: "/admin/setup/entity-types",
    icon: Database,
  },
  {
    title: "Structured Output Schemas",
    description: "Manage AI output schemas linked to case type and linked case type combinations.",
    to: "/admin/setup/structured-output-schemas",
    icon: FileJson2,
  },
  {
    title: "Report Designs",
    description: "Manage admin report layouts and field bindings.",
    to: "/admin/report-designs",
    icon: PanelsTopLeft,
  },
];

export function AdminSetupPage() {
  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Admin Setup"
          description="Manage the masterfile data that powers case routing, structured analysis, and report design."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {setupCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.to}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-ink-200 bg-ink-100">
                      <Icon className="h-5 w-5 text-ink-700" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle>{card.title}</CardTitle>
                      <p className="mt-1 text-sm leading-6 text-ink-600">{card.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary">
                    <Link to={card.to}>Manage</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminPageAccess>
  );
}
