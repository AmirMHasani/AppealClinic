# AppealClinic Help

Operational guide for PA coordinators and billing staff. AppealClinic drafts insurer-ready medical-necessity / step-therapy appeal letters for dermatology biologics and JAKs. It does not connect to your EHR, does not fax or portal-submit, and does not replace clinical or billing review.

Every export includes: *Draft for clinical/billing review. Confirm payer criteria and deadlines before submission.*

---

## Run a denial through the wizard

1. **Triage outside the app.** Confirm this is a clinical appeal (step therapy, medical necessity, non-formulary, or quantity/dose limit). Eligibility, coding, and timely-filing issues are admin fixes — do not use the wizard for those.
2. **Open New appeal** from the dashboard.
3. **Case meta**
   - Enter your **internal case ID** (required). Prefer this over any patient identifier.
   - Optional initials only if your clinic policy allows; omit when possible.
   - Select indication (plaque psoriasis, atopic dermatitis, or hidradenitis suppurativa), requested drug, dose if known, and place of service.
4. **Denial**
   - Select payer (from the loaded payer packs).
   - Select denial type and denial date.
   - Appeal deadline is optional; defaults are suggestions only — **confirm on the denial letter / portal** before you rely on them.
   - Paste **redacted** denial language (required). Auth/claim numbers and CARC codes optional.
5. **Clinical evidence**
   - ICD-10 codes, severity measures (BSA, IGA/PGA, DLQI, Hurley stage as applicable), failed therapies (drug, class, dates, reason stopped), contraindications to preferred steps, labs when relevant, and short clinical bullets from the chart.
   - Optional: paste a society guideline excerpt you are authorized to use.
6. **Review → Generate.** The app creates a letter draft, evidence checklist, gaps list, and citation block.
7. **Edit on the case page**, then export DOCX / PDF / copy. A clinician or authorized signer reviews and signs.
8. **Submit in the payer’s channel** (portal, fax, mail) outside AppealClinic.
9. **Log outcome** (submitted / won / partial / lost) and optional dollars recovered so clinic metrics stay accurate.

Median target: usable draft in under five minutes when inputs are ready.

---

## Redaction rules

AppealClinic is **redaction-first**. Staff are responsible for scrubbing packets before entry. Pattern warnings catch some slips (e.g. SSN-like numbers, MRN/member-ID labels, DOB labels); they are not a substitute for judgment.

**Do not enter**

| Avoid | Use instead |
| --- | --- |
| Full patient name | Internal case ID; optional initials if allowed |
| SSN | Omit |
| Full MRN / member ID as free text | Internal case ID; put auth/claim # only in the dedicated field if needed for the letter |
| Date of birth | Omit from free text |
| Street address, phone, email of the patient | Omit |
| Photos of insurance cards or ID | Omit |
| Unredacted chart dumps | Short clinical bullets with identifiers removed |

**Allowed / expected**

- Internal case ID
- Redacted denial language (payer phrases, criteria citations from the letter)
- Diagnosis codes, severity scores, drug names, therapy history without identifiers
- Clinic letterhead and NPI from Settings (clinic data, not patient PHI)

Until BAAs and production hosting are in place for your tenant, treat the product as **synthetic / de-identified / shadow-validation** only. Do not put live PHI into the MVP environment.

---

## What not to paste (PHI)

Do not paste anything that would re-identify the patient in free-text fields (`denial_verbatim`, clinical narrative, guidelines paste, notes), including:

- Full names, nicknames tied to the chart, or unique free-text descriptors
- SSN, driver’s license, or insurance card images
- Full medical record numbers or member IDs in narrative fields
- DOB, home address, phone, personal email
- Family member names or employer details that identify the patient
- Unredacted progress notes or entire chart exports

If the UI flags a possible PHI pattern, remove it before generating. If you are unsure whether a string is identifiers, remove it.

---

## How citations work

**Hard rule:** Letters may cite only **sourced payer-pack slots** or **text you paste** in the wizard. The generator must not invent policy numbers, statute cites, or URLs.

### Payer packs

Each payer (e.g. UnitedHealthcare, Aetna, Cigna, Anthem/Elevance, Humana, regional Blue stub) ships with:

- Display name and aliases
- Common denial phrases
- Default appeal-window suggestion (confirm with the payer — not legal advice)
- **Citation slots**: title, URL, section, notes — publicly sourced and dated in config

The letter’s “Guideline / policy anchors” section pulls from those slots when they apply to the selected drug/indication. Policies change; **re-verify the live PDF/HTML on the payer site before submission.**

### Fail-closed behavior

If no usable slot exists for the payer + drug + indication, the draft shows:

`Citation needed: …`

Fill the gap by:

1. Confirming the correct payer pack is selected, or
2. Pasting authorized guideline / policy text into the wizard’s guidelines field, or
3. Attaching the current official policy PDF with the submission outside the app

Never replace a “Citation needed” line with a guessed policy number or URL.

### Optional user paste

Society guideline excerpts (e.g. AAD/NPF) appear only when you paste approved text. Do not expect the model to supply guideline language on its own.

### Optional LLM polish

If an operator enables model polish, it may clarify wording only. It must not add clinical facts, drugs, or citations that are not already in the letter.

---

## After you export

1. Clinician / authorized signer reviews and edits.
2. Confirm denial reason mapping, attachments on the checklist, and current payer criteria.
3. Confirm appeal deadline from the denial / portal (not from the app default alone).
4. Submit via the payer’s process.
5. Update case status and outcome in AppealClinic.

---

## Out of scope (v1)

- EHR write-back or eligibility APIs
- Auto-submit to payers, PBMs, or CoverMyMeds
- Eligibility, coding, or timely-filing “appeals”
- Guaranteeing overturn rates
- Behavioral health or non-derm specialties

Questions on security posture: see the Security overview for practice managers. Product questions: contact your AppealClinic operator.
