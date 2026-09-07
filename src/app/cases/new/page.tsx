"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { RedactionBanner } from "@/components/RedactionBanner";
import {
  DENIAL_TYPE_LIST,
  INDICATION_LIST,
  INDICATIONS,
  PAYER_LIST,
  drugsForIndication,
} from "@/lib/config";
import type {
  ClinicalEvidence,
  DenialDetails,
  FailedTherapy,
  Indication,
  CaseMeta,
} from "@/lib/types";
import { scanCasePayload, type RedactionHit } from "@/lib/redaction";

const emptyTherapy = (): FailedTherapy => ({
  drug: "",
  class: "",
  start: "",
  stop: "",
  reasonStopped: "",
});

export default function NewAppealPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [redactionHits, setRedactionHits] = useState<RedactionHit[]>([]);
  const [redactionAck, setRedactionAck] = useState(false);

  const [meta, setMeta] = useState<CaseMeta>({
    internal_case_id: "",
    patient_initials: "",
    indication: "plaque_psoriasis",
    requested_drug: "",
    requested_dose: "",
    place_of_service: "specialty_pharmacy",
  });

  const [denial, setDenial] = useState<DenialDetails>({
    payer_id: "uhc",
    denial_type: "step_therapy",
    denial_date: "",
    appeal_deadline: "",
    auth_or_claim_number: "",
    denial_verbatim: "",
    carc_codes: "",
  });

  const [clinical, setClinical] = useState<ClinicalEvidence>({
    diagnosis_icd10: ["L40.0"],
    disease_severity: {},
    failed_therapies: [emptyTherapy()],
    contraindications_to_step: "",
    labs_imaging: "",
    clinical_narrative_bullets: "",
    guidelines_user_paste: "",
  });

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.push("/login");
        return;
      }
      const { user } = await me.json();
      setUserName(user.name);
    })();
  }, [router]);

  const drugs = useMemo(
    () => drugsForIndication(meta.indication),
    [meta.indication]
  );

  function onIndication(ind: Indication) {
    const def = INDICATIONS[ind];
    setMeta((m) => ({
      ...m,
      indication: ind,
      requested_drug: "",
      requested_dose: "",
    }));
    setClinical((c) => ({
      ...c,
      diagnosis_icd10: def.defaultIcd10,
    }));
  }

  async function submitAndGenerate() {
    setSaving(true);
    setError("");
    const therapies = clinical.failed_therapies.filter((t) => t.drug.trim());
    const payload = {
      meta,
      denial,
      clinical: {
        ...clinical,
        failed_therapies: therapies,
        diagnosis_icd10: clinical.diagnosis_icd10.filter(Boolean),
      },
      outcome: { status: "draft" },
    };

    const clientHits = scanCasePayload({
      meta: payload.meta,
      denial: payload.denial,
      clinical: payload.clinical,
    });
    setRedactionHits(clientHits);
    if (clientHits.length > 0 && !redactionAck) {
      setSaving(false);
      setError(
        "Possible PHI patterns detected (SSN / MRN / DOB labels). Remove them, or acknowledge the warning to continue if REQUIRE_REDACTION_CHECK is off on the server."
      );
      return;
    }

    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaving(false);
      if (data.redactionHits?.length) {
        setRedactionHits(data.redactionHits);
        setError(
          data.error ||
            "Server redaction check blocked this case. Remove SSN/MRN/DOB patterns."
        );
      } else {
        setError(data.error || "Failed to create case");
      }
      return;
    }
    if (data.redactionHits?.length) setRedactionHits(data.redactionHits);
    const created = data.case;
    await fetch(`/api/cases/${created.id}/generate`, { method: "POST" });
    setSaving(false);
    router.push(`/cases/${created.id}`);
  }

  const steps = ["Case meta", "Denial", "Clinical", "Review"];

  return (
    <div className="page-shell pb-20 sm:pb-6">
      <AppNav userName={userName} />
      <main className="container-narrow py-5 sm:py-6">
        <p className="ops-kicker">Workflow</p>
        <h1 className="page-title mt-1">New appeal</h1>
        <p className="page-subtitle">
          Step {step + 1} of {steps.length} · {steps[step]}
        </p>
        <div className="mt-4">
          <RedactionBanner />
        </div>

        {/* Step indicator */}
        <ol className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex w-full flex-col gap-1.5 rounded-lg p-2 text-left transition ${
                    active ? "bg-brand-50" : "hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`h-1.5 w-full rounded-full ${
                      active
                        ? "bg-brand-600"
                        : done
                          ? "bg-brand-300"
                          : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`truncate text-xs font-semibold ${
                      active
                        ? "text-brand-800"
                        : done
                          ? "text-brand-700"
                          : "text-slate-500"
                    }`}
                  >
                    {i + 1}. {s}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="card-pad mt-5">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="section-title">Case details</h2>
              <label className="block">
                <span className="label">Internal case ID *</span>
                <input
                  className="field"
                  value={meta.internal_case_id}
                  onChange={(e) =>
                    setMeta({ ...meta, internal_case_id: e.target.value })
                  }
                  placeholder="e.g. SYN-PSO-100"
                  required
                />
              </label>
              <label className="block">
                <span className="label">Patient initials (optional)</span>
                <input
                  className="field"
                  value={meta.patient_initials || ""}
                  onChange={(e) =>
                    setMeta({ ...meta, patient_initials: e.target.value })
                  }
                  placeholder="J.D."
                />
                <span className="hint">Initials only — no full names</span>
              </label>
              <label className="block">
                <span className="label">Indication *</span>
                <select
                  className="field"
                  value={meta.indication}
                  onChange={(e) => onIndication(e.target.value as Indication)}
                >
                  {INDICATION_LIST.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Requested drug *</span>
                <select
                  className="field"
                  value={meta.requested_drug}
                  onChange={(e) => {
                    const d = drugs.find((x) => x.name === e.target.value);
                    setMeta({
                      ...meta,
                      requested_drug: e.target.value,
                      requested_dose: d?.typicalDoses[0] || "",
                    });
                  }}
                >
                  <option value="">Select…</option>
                  {drugs.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.class})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Dose</span>
                <input
                  className="field"
                  value={meta.requested_dose || ""}
                  onChange={(e) =>
                    setMeta({ ...meta, requested_dose: e.target.value })
                  }
                />
              </label>
              <label className="block">
                <span className="label">Place of service</span>
                <select
                  className="field"
                  value={meta.place_of_service}
                  onChange={(e) =>
                    setMeta({
                      ...meta,
                      place_of_service: e.target
                        .value as CaseMeta["place_of_service"],
                    })
                  }
                >
                  <option value="office">Office</option>
                  <option value="specialty_pharmacy">Specialty pharmacy</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="section-title">Denial details</h2>
              <label className="block">
                <span className="label">Payer *</span>
                <select
                  className="field"
                  value={denial.payer_id}
                  onChange={(e) =>
                    setDenial({
                      ...denial,
                      payer_id: e.target.value as DenialDetails["payer_id"],
                    })
                  }
                >
                  {PAYER_LIST.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label">Denial type *</span>
                <select
                  className="field"
                  value={denial.denial_type}
                  onChange={(e) =>
                    setDenial({
                      ...denial,
                      denial_type: e.target
                        .value as DenialDetails["denial_type"],
                    })
                  }
                >
                  {DENIAL_TYPE_LIST.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Denial date *</span>
                  <input
                    type="date"
                    className="field"
                    value={denial.denial_date}
                    onChange={(e) =>
                      setDenial({ ...denial, denial_date: e.target.value })
                    }
                  />
                </label>
                <label className="block">
                  <span className="label">Appeal deadline</span>
                  <input
                    type="date"
                    className="field"
                    value={denial.appeal_deadline || ""}
                    onChange={(e) =>
                      setDenial({ ...denial, appeal_deadline: e.target.value })
                    }
                  />
                  <span className="hint">
                    Confirm with payer — suggested defaults are not legal advice
                  </span>
                </label>
              </div>
              <label className="block">
                <span className="label">Auth / claim number</span>
                <input
                  className="field"
                  value={denial.auth_or_claim_number || ""}
                  onChange={(e) =>
                    setDenial({
                      ...denial,
                      auth_or_claim_number: e.target.value,
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="label">Denial verbatim *</span>
                <textarea
                  className="field"
                  rows={4}
                  value={denial.denial_verbatim}
                  onChange={(e) =>
                    setDenial({ ...denial, denial_verbatim: e.target.value })
                  }
                  placeholder="Paste denial language (redact names)"
                />
              </label>
              <label className="block">
                <span className="label">CARC codes</span>
                <input
                  className="field"
                  value={denial.carc_codes || ""}
                  onChange={(e) =>
                    setDenial({ ...denial, carc_codes: e.target.value })
                  }
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="section-title">Clinical evidence</h2>
              <label className="block">
                <span className="label">ICD-10 (comma-separated) *</span>
                <input
                  className="field"
                  value={clinical.diagnosis_icd10.join(", ")}
                  onChange={(e) =>
                    setClinical({
                      ...clinical,
                      diagnosis_icd10: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <div>
                <p className="label mb-2">Disease severity</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["bsaPercent", "BSA %"],
                      ["iga", "IGA"],
                      ["pga", "PGA"],
                      ["dlqi", "DLQI"],
                      ["hurleyStage", "Hurley"],
                      ["durationYears", "Years"],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="block">
                      <span className="text-xs font-medium text-slate-600">
                        {label}
                      </span>
                      <input
                        type="number"
                        className="field !mt-1"
                        value={
                          clinical.disease_severity[k] != null
                            ? String(clinical.disease_severity[k])
                            : ""
                        }
                        onChange={(e) =>
                          setClinical({
                            ...clinical,
                            disease_severity: {
                              ...clinical.disease_severity,
                              [k]:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="label !inline">Failed therapies *</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                    onClick={() =>
                      setClinical({
                        ...clinical,
                        failed_therapies: [
                          ...clinical.failed_therapies,
                          emptyTherapy(),
                        ],
                      })
                    }
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-3">
                  {clinical.failed_therapies.map((t, idx) => (
                    <div
                      key={idx}
                      className="grid gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 sm:grid-cols-2"
                    >
                      {(
                        [
                          ["drug", "Drug"],
                          ["class", "Class"],
                          ["start", "Start"],
                          ["stop", "Stop"],
                        ] as const
                      ).map(([k, label]) => (
                        <input
                          key={k}
                          placeholder={label}
                          className="field !mt-0"
                          value={t[k] || ""}
                          onChange={(e) => {
                            const next = [...clinical.failed_therapies];
                            next[idx] = { ...next[idx], [k]: e.target.value };
                            setClinical({
                              ...clinical,
                              failed_therapies: next,
                            });
                          }}
                        />
                      ))}
                      <input
                        placeholder="Reason stopped"
                        className="field !mt-0 sm:col-span-2"
                        value={t.reasonStopped}
                        onChange={(e) => {
                          const next = [...clinical.failed_therapies];
                          next[idx] = {
                            ...next[idx],
                            reasonStopped: e.target.value,
                          };
                          setClinical({
                            ...clinical,
                            failed_therapies: next,
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="label">Contraindications to step</span>
                <textarea
                  className="field"
                  rows={2}
                  value={clinical.contraindications_to_step || ""}
                  onChange={(e) =>
                    setClinical({
                      ...clinical,
                      contraindications_to_step: e.target.value,
                    })
                  }
                />
              </label>
              <label className="block">
                <span className="label">Labs / imaging</span>
                <textarea
                  className="field"
                  rows={2}
                  value={clinical.labs_imaging || ""}
                  onChange={(e) =>
                    setClinical({ ...clinical, labs_imaging: e.target.value })
                  }
                />
              </label>
              <label className="block">
                <span className="label">Clinical narrative bullets *</span>
                <textarea
                  className="field"
                  rows={4}
                  value={clinical.clinical_narrative_bullets}
                  onChange={(e) =>
                    setClinical({
                      ...clinical,
                      clinical_narrative_bullets: e.target.value,
                    })
                  }
                  placeholder="- Bullet one&#10;- Bullet two"
                />
              </label>
              <label className="block">
                <span className="label">Guidelines (user paste)</span>
                <textarea
                  className="field"
                  rows={3}
                  value={clinical.guidelines_user_paste || ""}
                  onChange={(e) =>
                    setClinical({
                      ...clinical,
                      guidelines_user_paste: e.target.value,
                    })
                  }
                  placeholder="Paste society guideline excerpt — generator will not invent cites"
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="section-title">Review & generate</h2>
              <dl className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Case
                  </dt>
                  <dd className="mt-0.5 text-slate-900">
                    {meta.internal_case_id || "(missing)"} ·{" "}
                    {INDICATIONS[meta.indication].label}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Drug
                  </dt>
                  <dd className="mt-0.5 text-slate-900">
                    {meta.requested_drug || "(missing)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Denial
                  </dt>
                  <dd className="mt-0.5 text-slate-900">
                    {denial.denial_type} · {denial.payer_id} ·{" "}
                    {denial.denial_date || "(missing date)"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Failed therapies
                  </dt>
                  <dd className="mt-0.5 text-slate-900">
                    {clinical.failed_therapies.filter((t) => t.drug).length}
                  </dd>
                </div>
              </dl>
              <p className="text-sm text-slate-500">
                Click generate to create the letter + checklist. You can edit on
                the case page.
              </p>
              {redactionHits.length > 0 && (
                <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-950">
                  <p className="font-semibold">Redaction scan findings</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4">
                    {redactionHits.map((h, i) => (
                      <li key={i}>
                        {h.message}
                        {h.sample ? (
                          <span className="ml-1 font-mono text-[11px] text-amber-800/80">
                            ({h.sample})
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <label className="mt-2 flex items-start gap-2 text-[12px]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={redactionAck}
                      onChange={(e) => setRedactionAck(e.target.checked)}
                    />
                    <span>
                      I removed or accept responsibility for these patterns (server
                      may still block if{" "}
                      <code className="font-mono text-[11px]">REQUIRE_REDACTION_CHECK=true</code>
                      ).
                    </span>
                  </label>
                </div>
              )}
              {error && (
                <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-clinical-danger">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* Desktop nav */}
          <div className="mt-8 hidden justify-between gap-3 sm:flex">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  saving ||
                  !meta.internal_case_id ||
                  !meta.requested_drug ||
                  !denial.denial_date ||
                  !denial.denial_verbatim ||
                  !clinical.clinical_narrative_bullets
                }
                onClick={submitAndGenerate}
                className="btn-primary"
              >
                {saving ? "Generating…" : "Create & generate letter"}
              </button>
            )}
          </div>
        </div>

        {/* Sticky mobile CTA */}
        <div className="sticky-cta sm:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="btn-primary flex-[2]"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={
                  saving ||
                  !meta.internal_case_id ||
                  !meta.requested_drug ||
                  !denial.denial_date ||
                  !denial.denial_verbatim ||
                  !clinical.clinical_narrative_bullets
                }
                onClick={submitAndGenerate}
                className="btn-primary flex-[2]"
              >
                {saving ? "Generating…" : "Generate"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
