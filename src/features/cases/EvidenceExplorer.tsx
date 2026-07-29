import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FileText,
  Quote,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { SearchInput } from "../../components/ui/SearchInput";
import type {
  EvidenceClaim,
  EvidenceConfidence,
  EvidenceExplorer as EvidenceExplorerData,
} from "./cases.api";

function confidenceTone(confidence: EvidenceConfidence | null) {
  if (confidence === "high") return "outline" as const;
  if (confidence === "low") return "attention" as const;
  return "muted" as const;
}

function formatConfidence(confidence: EvidenceConfidence | null) {
  return confidence ? `${confidence} confidence` : "Confidence unavailable";
}

function sourceLabel(claim: EvidenceClaim) {
  return [
    claim.sourceFileName || "Source file unavailable",
    claim.pageNumber ? `Page ${claim.pageNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function EvidenceExplorer({
  evidence,
}: {
  evidence: EvidenceExplorerData | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    evidence?.claims[0]?.id ?? null,
  );

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set((evidence?.claims ?? []).map((claim) => claim.category)),
      ).sort(),
    ],
    [evidence],
  );

  const filteredClaims = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (evidence?.claims ?? []).filter((claim) => {
      const matchesCategory =
        category === "All" || claim.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [
          claim.finding,
          claim.quote,
          claim.sourceFileName,
          claim.category,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );
      return matchesCategory && matchesQuery;
    });
  }, [category, evidence, query]);

  const selectedClaim =
    filteredClaims.find((claim) => claim.id === selectedClaimId) ??
    filteredClaims[0] ??
    null;

  useEffect(() => {
    if (!selectedClaim && filteredClaims[0]) {
      setSelectedClaimId(filteredClaims[0].id);
    }
  }, [filteredClaims, selectedClaim]);

  if (!evidence?.available) {
    return (
      <section className="rounded-2xl border border-dashed border-ink-300 bg-white p-5">
        <div className="flex items-start gap-3">
          <FileSearch
            className="mt-0.5 h-5 w-5 shrink-0 text-ink-500"
            aria-hidden="true"
          />
          <div>
            <h3 className="font-semibold text-ink-950">
              Evidence links unavailable
            </h3>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              This analysis version does not contain grounded source references.
              Run a new analysis after the evidence explorer is enabled to
              inspect findings against their supporting documents.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const coverage =
    evidence.coverage === null
      ? null
      : Math.round(Math.max(0, Math.min(1, evidence.coverage)) * 100);

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-brand-200 bg-white shadow-panel">
      <header className="border-b border-ink-800 bg-ink-950 px-5 py-5 text-white sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-300">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                Grounded analysis
              </p>
            </div>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em]">
              Evidence Explorer
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/70">
              Trace each analysis finding back to the exact document passage
              used to support it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/15 text-center">
            <div className="bg-white/5 px-4 py-3">
              <p className="text-lg font-semibold">
                {coverage === null ? "—" : `${coverage}%`}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">
                Coverage
              </p>
            </div>
            <div className="bg-white/5 px-4 py-3">
              <p className="text-lg font-semibold">
                {evidence.supportedClaimCount}/{evidence.claimCount}
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">
                Supported
              </p>
            </div>
          </div>
        </div>
        {coverage !== null ? (
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-brand-400 transition-[width] duration-300"
              style={{ width: `${coverage}%` }}
            />
          </div>
        ) : null}
      </header>

      {(evidence.warnings.length || evidence.issues.length) > 0 ? (
        <div className="border-b border-warning-100 bg-warning-50 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-warning-700"
              aria-hidden="true"
            />
            <div className="space-y-1 text-sm text-warning-700">
              {[...evidence.warnings, ...evidence.issues.map((issue) => issue.message)]
                .slice(0, 3)
                .map((message, index) => (
                  <p key={index}>{message}</p>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid min-w-0 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 border-b border-ink-200 lg:border-b-0 lg:border-r">
          <div className="space-y-4 border-b border-ink-200 bg-surface-muted p-4 sm:p-5">
            <SearchInput
              label="Search evidence"
              placeholder="Finding, quote, or document"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div>
              <label
                htmlFor="evidence-category"
                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500"
              >
                Finding category
              </label>
              <select
                id="evidence-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 outline-none transition focus:border-ink-950"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? `All categories (${evidence.claimCount})` : item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-[34rem] overflow-y-auto">
            {filteredClaims.length ? (
              filteredClaims.map((claim, index) => {
                const selected = selectedClaim?.id === claim.id;
                return (
                  <button
                    type="button"
                    key={claim.id}
                    aria-pressed={selected}
                    onClick={() => setSelectedClaimId(claim.id)}
                    className={[
                      "group flex w-full min-w-0 gap-3 border-b border-ink-200 px-4 py-4 text-left transition sm:px-5",
                      selected
                        ? "bg-brand-700 text-white"
                        : "bg-white hover:bg-brand-50",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                        selected
                          ? "border-white/25 bg-white/10 text-white"
                          : "border-ink-200 bg-ink-50 text-ink-600",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          "block text-[10px] font-semibold uppercase tracking-[0.12em]",
                          selected ? "text-white/55" : "text-ink-500",
                        ].join(" ")}
                      >
                        {claim.category}
                      </span>
                      <span className="mt-1 block text-sm font-medium leading-5">
                        {claim.finding}
                      </span>
                      <span
                        className={[
                          "mt-2 flex items-center gap-1.5 text-xs",
                          selected ? "text-white/60" : "text-ink-500",
                        ].join(" ")}
                      >
                        {claim.supported ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {claim.supported ? "Source verified" : "Support incomplete"}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="p-5 text-sm text-ink-600">
                No evidence findings match the current filters.
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 bg-[linear-gradient(135deg,#f3f4f6_0%,#ffffff_55%)] p-5 sm:p-6">
          {selectedClaim ? (
            <article className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={confidenceTone(selectedClaim.confidence)}>
                  {formatConfidence(selectedClaim.confidence)}
                </Badge>
                <Badge tone={selectedClaim.supported ? "outline" : "attention"}>
                  {selectedClaim.supported ? "Verified source" : "Review required"}
                </Badge>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Analysis finding
                </p>
                <h4 className="mt-2 text-lg font-semibold leading-7 tracking-[-0.01em] text-ink-950">
                  {selectedClaim.finding}
                </h4>
              </div>

              <div className="relative rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
                <Quote
                  className="absolute right-4 top-4 h-8 w-8 text-ink-100"
                  aria-hidden="true"
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Supporting passage
                </p>
                {selectedClaim.quote ? (
                  <blockquote className="mt-4 border-l-2 border-brand-600 pl-4 text-sm leading-7 text-ink-800">
                    “{selectedClaim.quote}”
                  </blockquote>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-ink-600">
                    No exact supporting passage was retained for this finding.
                    Treat it as unverified until the source is reviewed.
                  </p>
                )}
              </div>

              <div className="grid gap-px overflow-hidden rounded-2xl border border-ink-200 bg-ink-200 sm:grid-cols-2">
                <div className="min-w-0 bg-white p-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      Source
                    </p>
                  </div>
                  <p className="mt-2 break-words text-sm font-medium text-ink-950">
                    {sourceLabel(selectedClaim)}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                      Verification
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ink-950">
                    {selectedClaim.verified
                      ? "Quote matched supplied evidence"
                      : "Quote could not be matched exactly"}
                  </p>
                </div>
              </div>
            </article>
          ) : (
            <p className="text-sm text-ink-600">
              Select a finding to inspect its supporting evidence.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
