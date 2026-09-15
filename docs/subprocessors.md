# AppealClinic — Subprocessors (draft)

**As of:** 2026-09-15  
**Audience:** Founder + counsel; customer schedule before PHI go-live.  
**Status:** Draft — not a signed legal schedule yet.

Real PHI is allowed only when `APP_MODE=phi` and `docs/phi-mode-checklist.md` is complete.

---

## Current / planned vendors

| Role | Vendor | Status | Notes |
| --- | --- | --- | --- |
| App host | **Render** | **Live (demo)** | Free web service — `https://appealclinic.onrender.com`. Stay on Render Free until closer to PHI. Paid Render web **TBD** (Amir); do not provision Starter/Fly in this phase. |
| Database (demo) | **Render Free Postgres** | **Live (demo only)** | Instance `dpg-dakns77qj5pc73d7koj0-a`. **Not** a BAA path for PHI. Expires ~**2026-10-15**. |
| Database (PHI) | **Neon** (Scale + HIPAA BAA) | **Locked path — not provisioned yet** | Amir creates Neon Scale org, accepts self-serve BAA, enables HIPAA on project. See `docs/neon-cutover.md` and [Neon HIPAA](https://neon.com/docs/security/hipaa). Free/Launch must not hold PHI. |
| Payments | **Stripe** | Test only / unset until Phase 4 | Card data stays with Stripe when enabled. **Stripe stays last.** Live keys gated by `STRIPE_LIVE_ENABLED`. |
| LLM (optional) | Unset / **Azure OpenAI** or **AWS Bedrock** (TBD) | Unset on demo | Core drafts are rules-based. BAA LLM only if polish is needed under PHI. |
| Email | None | — | No transactional email yet. Add only with BAA or no-PHI mail. |

---

## Demo vs PHI posture

| Environment | Host | DB | `APP_MODE` |
| --- | --- | --- | --- |
| Public demo (now) | Render Free | Render Free Postgres | `demo` |
| PHI (later) | Render Free for now; paid Render web TBD | Neon Scale + BAA | `phi` only after checklist |

---

## Change control

Update this list before any customer BAA that references subprocessors. Engineering must not add a subprocessor that touches PHI without Amir + counsel sign-off.
