# AppealClinic — Pilot one-pager

**Use after** hosted MVP is ready (`docs/mvp-definition.md`). Approach practices with a pilot — not a “help us validate” ask.

## Problem
Independent derm clinics burn staff time rewriting biologic / JAK prior-auth and medical-necessity appeals. National PA burden is severe; denials are under-appealed even when overturn rates are high.

## Product
Clinical ops workspace: redacted denial + clinical evidence → insurer-ready draft + evidence checklist → DOCX/PDF. Clinic reviews and submits in the payer channel. Citations come only from sourced payer-pack URLs (or clinic paste) — fail-closed, no invented policies.

## Price
**$249/mo** per location (unlimited drafts in MVP pricing). Competitors for context: CoverMyMeds & SamaCare often **$0 to practices** (different model); Muni ~**$20/appeal**; ClaimBack ~**$49–$199/mo**.

## Public proof points (sourced — not invented)

| Figure | What it is | Source |
|---|---|---|
| **39** PAs / physician / week | All-specialty burden | AMA 2024 PA Physician Survey |
| **13** hrs / week | Physician + staff PA time | Same AMA survey |
| **40%** | Practices with exclusive PA staff | Same AMA survey |
| **20%** | Physicians who always appeal adverse PA | AMA reporting on same survey |
| **7.7%** denied; **11.5%** of denials appealed; **80.7%** overturned when appealed | Medicare Advantage funnel | KFF / CMS 2024 |
| **~30%** of denied PAs appealed; **21.7%** of those later approved (5/23) | Single-center derm (dated, small n) | JAMA Dermatology 2020 (Utah, 2016 data) |
| **$15.80** median staff cost / biologic PA | Same derm study | JAMA Dermatology 2020 |

**ROI formula (clinic must supply volume):**  
`Annual overturns ≈ (biologic PAs/provider/mo × providers × 12) × denialRate × appealRate × overturnRate`  
Dollar value needs clinic-specific `$` per overturned course — **unknown publicly; do not invent.**

## Security
Redaction-first. Demo / pre-BAA environments are **not** for live PHI. Human review required. BAA + BAA-capable hosting before PHI workflows (`docs/security-one-pager.md`).

## Pilot offer (14 days)
- Onboard PA coordinator / practice manager  
- Run **10 recent biologic/JAK denials** (de-identified until BAAs)  
- Return appeal-ready drafts for review/edit/file  
- Cancel anytime; no lock-in  

## Non-goals
No EHR write-back. No auto-submit to payers. Not a clinical judgment product. No guaranteed overturn rate.

## Contact
Amir Hasani, MD — Founder, AppealClinic  
[email] · [phone]
