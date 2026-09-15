# APP_MODE=phi gate checklist

**Do not set `APP_MODE=phi` on any environment until every box below is done.**  
Unknown / unset `APP_MODE` is treated as **demo** (fail closed for PHI).  
Public `*.onrender.com` demo forces demo unless `ALLOW_PHI_ON_DEMO_HOST=true` (safety latch).

---

## Legal / vendor

- [ ] **Customer BAA** template ready; counsel review as needed
- [ ] **Neon Scale** org + self-serve **HIPAA BAA** accepted ([docs](https://neon.com/docs/security/hipaa); console: [https://console.neon.tech](https://console.neon.tech))
- [ ] Neon **project** HIPAA-enabled (irreversible; Free/Launch must not hold PHI)
- [ ] App host BAA path decided (Render Free for now; paid Render web TBD closer to PHI — do not auto-provision)
- [ ] Optional LLM: **Azure OpenAI** or **Bedrock** BAA **or** explicit “rules-only / no LLM”
- [ ] `docs/subprocessors.md` published to customer schedule

## Infra / product

- [ ] Cut over DB per `docs/neon-cutover.md` (pooled URL + `sslmode=require` as `DATABASE_URL`)
- [ ] **Not** the public synthetic demo URL unless intentionally dual-purposed with latch override
- [ ] Free Render Postgres migrated or retired before ~**2026-10-15**
- [ ] Strong `AUTH_SECRET` (no weak defaults)
- [ ] Redaction posture reviewed (`REQUIRE_REDACTION_CHECK` still recommended)
- [ ] Phase 2 tenancy: Clinic / Membership / `clinicId` scoping verified
- [ ] Audit log + retention delete path verified (`docs/retention.md`)
- [ ] Stripe remains test/off until Phase 4 (`docs/stripe-go-live.md`)

## Code gates (already in product)

- `getAppMode()` / `isPhiMode()` / `isDemoMode()` in `src/lib/env.ts`
- Case create/update/generate refuse `intent: "phi"` or `X-AppealClinic-PHI: 1` with **403** when not in phi mode
- EnvironmentBanner: amber demo vs muted “PHI mode — BAA environment”

---

**Owner:** Amir (vendor/BAA) + Engineering (env flip after checklist).  
**Stripe:** still last. **No live PHI on Render Free Postgres.**
