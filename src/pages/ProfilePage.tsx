import { Card, CardContent } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../features/auth/useAuth";

function readUserField(user: unknown, key: string) {
  if (!user || typeof user !== "object" || Array.isArray(user)) return "";
  const value = (user as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function ProfilePage() {
  const { user } = useAuth();
  const fields = [
    ["First name", readUserField(user, "firstName")],
    ["Last name", readUserField(user, "lastName")],
    ["Name", readUserField(user, "name")],
    ["Email", readUserField(user, "email")],
    ["Phone number", readUserField(user, "phoneNumber")],
    ["Role", readUserField(user, "role")],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your current account information." />
      <Card>
        <CardContent>
          {fields.length > 0 ? (
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm font-medium text-ink-500">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-ink-950">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-ink-600">No profile details are available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
