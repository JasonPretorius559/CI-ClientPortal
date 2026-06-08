import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import { RegisterForm } from "../../auth/RegisterForm";
import { AdminPageAccess } from "../AdminPageAccess";

export function AdminUserRegistrationPage() {
  return (
    <AdminPageAccess>
      <div className="space-y-6">
        <PageHeader
          title="Register User"
          description="Create a portal account for a new user."
          action={
            <Button asChild variant="secondary">
              <Link to="/admin/setup">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to setup
              </Link>
            </Button>
          }
        />

        <Card className="max-w-2xl">
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </AdminPageAccess>
  );
}
