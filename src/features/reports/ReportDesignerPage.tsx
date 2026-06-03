import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { ReportDesignerShell } from "./components/ReportDesignerShell";

export function ReportDesignerPage() {
  const { templateId } = useParams();

  return (
    <div className="space-y-6">
      <PageHeader
        title={templateId ? "Edit Report Template" : "New Report Template"}
        description="Design reusable Cloud Insure report templates."
        action={
          <Button asChild variant="secondary">
            <Link to="/reports/templates">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Templates
            </Link>
          </Button>
        }
      />
      <ReportDesignerShell templateId={templateId} />
    </div>
  );
}
