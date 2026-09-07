# Phase 2 — Shadow validation plan

**Goal:** Prove AppealClinic drafts are usable on *real* (de-identified) derm biologic denials before any clinic is charged.  
**Exit criteria:** 10–20 cases run; median time-to-usable-draft under 5 minutes; a biller/PA coordinator would send after light edit; edit rate logged; zero fabricated citations in outputs.  
**Status:** Plan only — do not collect real PHI into the app until redaction rules below are followed.

---

## 1. What “shadow” means

- Clinic (or Amir’s contact) provides **already-denied** PA/claim materials.
- We run them through AppealClinic **offline / internal** — not as a paying customer.
- Clinic may use or ignore the draft; we measure quality, not patient outcomes yet.
- No marketing claims from this phase except internal learning.

---

## 2. Sample target (n = 15 preferred; 10 minimum, 20 max for v1)

| Dimension | Target mix |
|---|---|
| Indications | ~6 PsO, ~5 AD, ~4 HS |
| Denial types | Mostly step therapy + medical necessity; include 2–3 non-formulary / quantity |
| Payers | Prefer UHC, Aetna, Cigna, Anthem, Humana, IBX/local Blue — at least 4 distinct |
| Drugs | Cosentyx, Dupixent, Skyrizi, adalimumab/biosimilar, others as available |
| Geography | Philly beachhead OK; out-of-state fine if de-identified |

**Sources (in order of preference)**
1. Warm intro to a Philly independent derm practice manager / PA coordinator  
2. Billing company that serves derm clinics  
3. Amir’s professional network (MD peers) — de-identified samples only  
4. Public redacted sample letters / EOBs if truly usable (rare)

**Ask script (short)**  
> “We’re validating an appeal-draft tool for derm biologics before any sales. Could you share 10–15 *already denied* PA/appeal packets with names/MRNs/DOBs/addresses removed? We only need denial reason, payer, drug, indication, and clinical bullets (failed therapies, BSA/IGA/Hurley). No login to your EHR. You’ll get the drafts back for optional use; nothing is billed.”

---

## 3. Redaction rules (mandatory before anything hits the app)

**Strip or never collect**
- Full name, DOB, SSN, address, phone, email  
- Full MRN / member ID (replace with `SHADOW-###`)  
- Provider NPI of real clinic if they prefer (optional clinic letterhead OK for their copy)  
- Photos of cards / portals with visible PHI  

**Allowed**
- Payer name, denial date, denial verbatim (names scrubbed)  
- Drug, dose, indication, ICD-10  
- Severity scores, failed therapy list, labs (no patient identifiers)  
- Auth/claim numbers **only if** truncated or replaced with synthetic IDs  

**Intake checklist (paper/PDF before data entry)**  
- [ ] No full name  
- [ ] No DOB / address / phone  
- [ ] MRN/member ID replaced  
- [ ] Denial text scrubbed  
- [ ] Stored only under `golden-set/shadow/` (gitignored) or encrypted local folder — **never commit real packets to git**

Add to `.gitignore`:
```
golden-set/shadow/
*.phi.pdf
```

---

## 4. Run protocol (per case)

1. **Intake form** — fill wizard fields from redacted packet (or JSON mirroring golden-set shape).  
2. **Generate** — one click; start timer.  
3. **Review** — Amir or a derm-familiar reviewer edits until “would send.” Stop timer.  
4. **Score**
   - Time to usable draft (minutes)  
   - Edit distance / % paragraphs kept (rough: light / medium / heavy)  
   - Rubric (same 7 criteria as Phase 1); criterion 4 (citations) must be 1.0  
   - Would a PA coordinator send? (Y/N + note)  
5. **Log** row in `golden-set/shadow/results.csv` (template below).  
6. **Do not** submit to payer as part of this study unless the clinic independently chooses to.

### results.csv columns
```
case_id,indication,payer,drug,denial_type,minutes_to_usable,edit_level,rubric_avg,cite_ok,would_send,notes
```

---

## 5. Exit criteria (all required)

| Metric | Pass bar |
|---|---|
| Cases completed | ≥ 10 (target 15) |
| Median minutes to usable draft | under 5 |
| “Would send” rate | ≥ 80% after edit |
| Citation safety | 100% cite_ok (no fabricated policies) |
| Heavy edits | under 20% of cases |
| Payer coverage | ≥ 4 distinct payers |

If fail: fix templates/prompt packs for failing denial types; re-run failed cohort; do **not** proceed to sales.

---

## 6. Philly outreach plan (beachhead)

1. List 20 independent derm clinics (Google / society directory — manual).  
2. Amir sends 5–10 personal emails/LinkedIn (not cold blast with product pitch).  
3. Offer: free shadow drafts + summary of time saved; no contract.  
4. One clinic providing 10 packets is enough to start; second clinic for diversity.  
5. Track outreach in a simple sheet: clinic, contact, asked, packets received, date.

**Incentive:** free Phase 2 drafts + first look at product when sellable; no PHI leaves their control if they prefer to paste themselves on a screenshare.

---

## 7. What we explicitly will not do in Phase 2

- Charge money  
- Claim overturn rates  
- Store unredacted PHI in git, Slack, or email threads without encryption  
- Auto-submit to payers  
- Expand beyond derm biologics mid-shadow  

---

## 8. After Phase 2 passes → Phase 3

- Security one-pager + BAA-capable LLM/hosting decision  
- Then Stripe live + limited Philly GTM  

---

## 9. Immediate next actions for Amir

1. Pick 1–2 Philly derm contacts to ask this week.  
2. Confirm redaction workflow (who scrubs — clinic vs Amir).  
3. When first 3 packets arrive, run protocol and log CSV.  
4. Tell Chief of Staff — we score and tighten templates from failures.
