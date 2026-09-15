# Keep-alive (Render Free web sleep)

**Audience:** CoS / Amir — reduce cold-start surprises on PM demos.  
**Live URL:** https://appealclinic.onrender.com  
**Rule:** Do **not** add paid always-on without Amir approving spend.

---

## Why this exists

Render **Free** web services **sleep after ~15 minutes** of idle traffic. The next visitor hits a **cold start** (~**30–60 seconds**). With Postgres attached, start also runs `prisma db push` (usually fast once the schema matches).

Acceptable for founder demos. Annoying mid-call with a practice manager.

---

## Recommended ping

Hit one of these every **10–14 minutes** via UptimeRobot, cron-job.org, GitHub Actions, or any free HTTP monitor:

| Probe | Expected |
| --- | --- |
| `GET https://appealclinic.onrender.com/api/health` | JSON `{ "ok": true, "db": true }` when Postgres is attached (`db` is whether `DATABASE_URL` is set — no secrets) |
| `GET https://appealclinic.onrender.com/` | Landing HTML (heavier; fine as fallback) |

Prefer `/api/health` — lightweight, no auth, no PHI.

---

## Setup sketch (UptimeRobot or similar)

1. New HTTP(s) monitor → URL = `https://appealclinic.onrender.com/api/health`
2. Interval = **10–14 min** (not every minute — be a good Free-tier neighbor)
3. Alert only if consecutive failures (optional); the goal is wake-ups, not paging

---

## What not to do

- Do **not** upgrade to paid always-on without **Amir**
- Do **not** scrape authenticated app routes or send credentials in the monitor
- Do **not** treat keep-alive as a substitute for migrating Free Postgres before ~**2026-10-15** (see `docs/deploy-cheap.md`)

---

## Related

- Full deploy notes: `docs/deploy-cheap.md`
- Phase plan: `docs/phased-finish-plan.md` (Phase 0 keep-alive)
