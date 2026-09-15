# Payer pack gaps (honest inventory)

**Updated:** 2026-09-15  
**Rule:** Citation slots must use **verified public URLs only**. Never invent policy PDFs. Generator **fail-closes** with “Citation needed” when slots do not match the case.

Clinics remain responsible for confirming current payer criteria and deadlines before submission.

---

## Independence Blue Cross (IBX) — commercial derm biologics

### Reality check

**Commercial derm biologic PA criteria (Cosentyx SC, Dupixent, Skyrizi SC, adalimumab, JAKs, etc.) are often portal-only** at IBX. Public web sources do **not** currently publish full commercial step-therapy / medical-necessity criteria PDFs comparable to UHC/Aetna/Cigna packs.

What we ship today for IBX is therefore **partial**:

| Slot type | What it is | What it is not |
| --- | --- | --- |
| Medicare Advantage medical policies | Public MA pages (e.g. Ilumya PsO; Cosentyx **IV**) | Commercial SC Cosentyx / Dupixent / Skyrizi criteria |
| Provider bulletin | Process/attestation; names Dupixent/Cosentyx/Skyrizi | Full coverage criteria text |
| Commercial specialty precert list (Jan 2026) | Lists Cosentyx / Skyrizi **IV** (immunological class) as needing precert on medical benefit | Full clinical criteria; SC pharmacy biologics often elsewhere |
| Immune Modulating Therapy **PA form** | Questions clinics answer for Cosentyx/Skyrizi/etc. | A policy PDF — **form ≠ coverage criteria** |
| Legacy psoriasis agents form (2011) | Old medical-benefit intake (Stelara-era) | Current commercial SC biologic criteria |
| Commercial PA hub | Where to submit PA / find forms | Deep-linked commercial pharmacy policy PDFs |
| Pharmacy Policy Bulletins portal | Terms-gated commercial bulletins | Open public PDF of Dupixent/Cosentyx SC criteria |

### Public URLs in `payers.ts` (verified 2026-09-15)

1. https://medpolicy.ibx.com/ibc/ma/Pages/Policy/b7428f98-6f1f-4d1e-b75c-baf2f3c327dc.aspx — MA Ilumya  
2. https://medpolicy.ibx.com/ibc/ma/Pages/Policy/c20c37f2-153c-4e9a-a872-dd5b1f12b7d4.aspx — MA Cosentyx IV  
3. https://www.ibx.com/pdfs/resources/for-providers/precertification/ibc-precert-01-2026.pdf — commercial specialty precert list  
4. https://www.ibx.com/resources/for-providers/policies-and-guidelines/pharmacy-information/prior-authorization.html — commercial PA hub  
5. https://provcomm.ibx.com/archive-ibc/news/Pages/22-3373.aspx — biologics provider bulletin  
6. https://www.ibx.com/pdfs/resources/for-providers/forms/value-immune-modulating-therapy-prior-auth.pdf — Immune Modulating Therapy PA form  
7. https://www.ibx.com/pdfs/providers/pharmacy_information/prior_authorization/psoriasis_ibc.pdf — legacy psoriasis agents PA form (02/2011)  
8. https://www.ibx.com/providers/pharmacy_information/pharmacy_policies/ — terms-gated pharmacy policy portal  

### Explicitly not found (do not invent)

- No public deep commercial policy PDF for **Dupixent** (AD) criteria verified on open web  
- No public deep commercial SC **Cosentyx** / **Skyrizi** derm criteria PDF verified (precert list + PA form only)  
- No public commercial **adalimumab** / JAK derm criteria PDF verified beyond form/hub/portal pointers  
- Full pharmacy formulary PA criteria remain largely **behind IBX portal / PBM** after Accept

### Clinic workflow (tone)

1. Paste current **portal** criteria (or attach the payer PDF) into the case / letter before submit.  
2. Use AppealClinic slots for public anchors only.  
3. If the generator cannot map a slot → expect **Citation needed** (fail-closed). Do not invent cites.

### Search notes

Public web + IBX provider PDFs were checked for commercial Cosentyx/Dupixent/Skyrizi/adalimumab criteria. **Additional full commercial criteria PDFs: none found.** Only the list above is cited.

---

## Humana — MA PDP vs commercial (Phase 1 deepen)

### Reality check

Humana’s **open public** derm biologic criteria are strongest on **Medicare PDP** prior-authorization PDFs. **Commercial** Cosentyx SC / Dupixent / Skyrizi SC **full clinical criteria PDFs were not found** on the open web (beyond a commercial PA/notification **list**).

Confirm **MA vs commercial** on every denial before citing PDP criteria in a commercial appeal.

### Public URLs in `payers.ts` (verified 2026-09-15)

1. https://assets.humana.com/is/content/humana/2026%20Enhanced-2%20PDP-Prior%20Authorizationpdf — 2026 Enhanced-2 PDP PA (Cosentyx/Dupixent/Adalimumab entries)  
2. https://assets.humana.com/is/content/humana/2026%20Lean%20Enhanced-1%20PDP-Prior%20Authorizationpdf — 2026 Lean Enhanced-1 PDP PA (includes Cosentyx criteria text)  
3. https://provider.humana.com/pharmacy-resources/prior-authorizations — pharmacy PA hub (process/forms)  
4. https://assets.humana.com/is/content/humana/FINAL_July%202024%20Commercial%20Prior%20Authorization%20and%20Notification%20Listpdf — commercial PAL (**list**, not drug criteria)  
5. https://mcp.humana.com/tad/TAD_New/Home.aspx — MCP policy library home (search by drug/LOB; deep links unstable)

### Explicitly not found (do not invent)

- No clean open **commercial** Cosentyx SC / Dupixent / Skyrizi SC **criteria** PDF verified beyond the commercial PAL list  
- Commercial derm biologic criteria remain plan-specific / portal or MCP search — paste member-plan criteria when PDP slots do not apply

### Clinic workflow

1. Read the denial LOB (Medicare Advantage / PDP vs commercial).  
2. Prefer matching PDP PDF slots only for Medicare pharmacy denials.  
3. For commercial: use PAL + PA hub as process anchors; paste plan-specific criteria; expect **Citation needed** if no matching slot.

---

## Other payers (brief)

| Payer | Gap notes |
| --- | --- |
| UHC / Aetna / Cigna / Anthem | Stronger public PDF/HTML slots; still re-verify effective dates before submit |
| Highmark | Aliased under IBX regional stub — not a full separate pack |

When deepening packs, prefer public PDFs with stable URLs; document portal-only gaps the same way as IBX / Humana commercial.
