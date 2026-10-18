# توجيهي 360 — Cloud Preview

> مش بس تعرف علامتك، تعرف كيف ترفعها.

This is the **preview development branch**, not the live public launch. The approved V1.0 prototype and `main` branch remain unchanged.

## What works
- Arabic responsive interface and a five-question *illustrative* maths demo, without a login.
- Demo corrections, explanations, and remedial reordering of missed questions saved in local storage.
- Supabase-based verified-cohort and ministerial-subject catalogs (currently unpublished).
- `quiz` Edge Function with server-side start, resume, grade, answer keys kept in `private` schema.
- `admin` Edge Function for role-checked plans, subjects, Excel imports (draft only), review and publication.
- Replaced legacy `xlsx@0.18.5` with `read-excel-file@9.3.12`.

## Important live status
- Supabase project `nwqsigilgobrepkpeanc` is connected using **publishable key only** in Vercel environment variables.
- The plan `2026/2027`, its four grade-11 subjects and cohort 2010 are **DRAFT / unverified**.
- Five original example mathematics questions have been inserted into Supabase as **draft**, **not** ministerial official questions.
- There are **zero teacher/admin user accounts** so far; an account must be registered and granted `admin` before using the management UI.
- Email login and real guest quizzes require Supabase Auth configuration and full end-to-end testing before production.
- Deployment is on a *preview branch*, do not promote without tests, privacy review and dependency security audit.

## One-time admin onboarding
1. From Supabase Dashboard > Authentication > Providers, configure Email, **Anonymous Sign-Ins**, and manual linking of anonymous users to a verified email (if guest upgrades are needed).
2. From the preview website, create a **regular personal account** with your own email. Verify that email.
3. In Supabase SQL Editor, after identifying the intended admin account, assign **only that confirmed identity**:

```sql
insert into public.user_roles(user_id, role)
select id, 'admin'
from auth.users
where email = 'YOUR_VERIFIED_ADMIN_EMAIL'
  and email_confirmed_at is not null
on conflict (user_id) do update set role='admin';
```

4. Sign out and back in, and open لوحة الإدارة.
5. Verify official ministry materials for the appropriate cohort before marking a plan or subject 'verified'.
6. Import teacher-reviewed original or licensed questions; publish only after review.

Never insert secret Supabase service keys into `VITE_` variables, GitHub or the browser.

## Excel columns
`question, A, B, C, D, correct, explanation, difficulty, topic, source_type, source_reference`.

## Known constraints
- The explanatory local demo is **not** part of the official ministerial question bank.
- Anonymous user persistence across devices requires converting/linking identity or a separate authenticated account.
- New branch was created specifically to repair Vercel build problems from incomplete root archive; it does not restore V1.0 source files byte-for-byte.
- More dependency vulnerabilities were reported by npm audit and must be reviewed before production.
- Automated authenticated quiz/admin end-to-end tests have **not** been run; do not claim launch-ready status.
