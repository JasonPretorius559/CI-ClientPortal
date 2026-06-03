import React from "react";
import { SCHEMA_LABELS } from "../../../useReportCatalog";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ScrollText, ArrowRight } from "lucide-react";

interface Props {
  schemaKeys: { key: string; label: string }[];
  onSelect: (key: string) => void;
  isLoading: boolean;
}

export function ReportTypeSelector({ schemaKeys, onSelect, isLoading }: Props) {
  if (isLoading) return <div className="p-8 text-center text-ink-500">Loading available report types...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ink-950">Choose a Report Type</h1>
        <p className="mt-2 text-ink-600">Select the schema family to start designing your template.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {schemaKeys.length === 0 && !isLoading && (
          <div className="col-span-full rounded-lg border border-dashed border-ink-300 p-12 text-center">
            <p className="text-ink-500">No report types were found. Check the backend field-catalog endpoint.</p>
          </div>
        )}
        
        {schemaKeys.map(({ key, label }) => (
          <Card 
            key={key} 
            className="cursor-pointer transition hover:border-ink-950 hover:shadow-soft"
            onClick={() => onSelect(key)}
          >
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink-50 text-ink-950">
                  <ScrollText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink-950">{label}</h3>
                  <p className="text-xs text-ink-500 uppercase tracking-wider">{key}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-ink-300" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}