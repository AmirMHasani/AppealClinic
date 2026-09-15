# Retention & clinic data deletion (Phase 2)

**As of:** 2026-09-15

## Policy (intended)

| Topic | Policy |
| --- | --- |
| **Active retention** | Case drafts and related inputs retained while the clinic subscription is active |
| **Post-cancel grace** | Proposed **30 days** after cancellation for export |
| **Deletion SLA** | On owner request (or after grace), clinic **case** data deleted from the app DB within **30 days**; backups age out on the provider cycle |
| **Exports** | Clinics should export DOCX/PDF of drafts before deletion |

## Productized path (MVP today)

**Owner-only** endpoint:

```http
DELETE /api/clinic/data
```

- Requires authenticated session with membership role `owner`
- Deletes **all `AppealCase` rows** for the actor's `clinicId`
- Does **not** delete users, memberships, letterhead (`ClinicSettings`), or Stripe `AppMeta`
- Writes an audit event: `clinic.delete_data` with `{ deletedCases }`
- Demo Clinic: also clears the `AppMeta.seeded` flag so demo cases can be re-seeded on next login

Settings UI: **Settings → Retention → Delete all clinic cases**.

## Audit

Queryable at `GET /api/audit?limit=100` (clinic-scoped). Events include login, case create/update/generate/export, settings change, user create, and clinic data delete.

## Related

- `docs/security-one-pager.md` — practice-manager overview
- Phase 2 exit: two clinics cannot see each other's cases; delete path works
