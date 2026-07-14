import { Link } from "react-router-dom";
import { Cpu, Database, FileJson2, MessageSquareText, UserPlus } from "lucide-react";
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
    title: "Case Type Prompts",
    description: "Manage OpenAI analysis prompts by case type and linked case type.",
    to: "/admin/setup/case-type-prompts",
    icon: MessageSquareText,
  },
  {
    title: "OpenAI Model Settings",
    description: "Choose the default analysis model used from masterfiles instead of the .env fallback.",
    to: "/admin/setup/openai-model-settings",
    icon: Cpu,
  },
  {
    title: adminMasterfileConfigs.entityTypes.label,
    description: adminMasterfileConfigs.entityTypes.description,
    to: "/admin/setup/entity-types",
    icon: Database,
  },
  {
    title: "Analysis Schema Map",
    description: "View the ten hardcoded output contracts used by the analysis engine.",
    to: "/admin/setup/structured-output-schemas",
    icon: FileJson2,
  },
  {
    title: "Users",
    description: "Manage portal users, roles, statuses, and account access.",
    to: "/admin/setup/users",
    icon: UserPlus,
  },
];

export function AdminSetupPage() {
  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Admin Setup"
          description="Manage the masterfile data that powers case routing, structured analysis, and user access."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {setupCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.to} className="flex min-h-56 flex-col">
                <CardHeader className="flex flex-row items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-5">
                  <p className="text-sm leading-6 text-ink-600">{card.description}</p>
                  <Button asChild variant="secondary" className="w-fit">
                    <Link to={card.to}>{card.title === "Analysis Schema Map" ? "View" : "Manage"}</Link>
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
