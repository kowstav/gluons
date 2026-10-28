# Prototype verification record

Verified locally during the 2026-10-28 build. No real business or paid provider data was used.

## Automated verification

- TypeScript strict checking for dashboard, runtime, scripts and tests.
- 25 component, runtime and embedded Postgres tests. The database test executes the real migration with Supabase auth functions mocked locally, including RLS, direct-mutation denial, atomic projections and revision conflicts.
- Optimized Next.js production build, including all page and API routes.
- Four end-to-end HTTP tests against an isolated production server and data file: routing/escalation/edit/approval/trial, unauthorized webhook and malformed input rejection, durable trial requests without visitor read access, and new-business deployment with stock mapping plus exactly-once local order execution.
- Six exported Agent Skills and generated catalog seed. GitHub CI verifies the exports match committed sources.

## Browser acceptance

Used the actual running application at a desktop 1440×1000 breakpoint and a phone 390×844 breakpoint.

1. Routed an order with the deliberately invalid cheap-output example. The task escalated to the medium model and entered pending staging.
2. Edited its pickup note and approved it. The reviewed queue showed the new content, original-preserving edit flag, owner identity and **simulated** trial result. No live operation was created.
3. Inspected both model attempts, their output-check results, decision details and estimated costs in EfficientAI.
4. Built **Corner Coffee** through the three-step builder with an espresso catalog, coffee-bean inventory, threshold and 0.02 kg consumption per sale.
5. Confirmed all six shared components and the food-vendor pack changed from **Used by 1 business** to **Used by 2 businesses**.
6. Downloaded the trial PDF. Rendered the final saved report to PNG and visually inspected its single page: no clipped text, no split section, readable assumptions and a page footer.
7. Checked the phone approval page, navigation drawer and landing page. Their document scroll widths matched their viewport widths; there was no horizontal overflow. Phone review buttons have 44 px minimum height.
8. Submitted the landing-page free-trial form with synthetic `example.test` contact details. The same persistence path is covered by the HTTP tests.
9. Packaged ten real browser acceptance screenshots into a 30-second WebM walkthrough with English captions. This is a silent screenshot walkthrough, not a narrated continuous screen recording.

The retained desktop and landing screenshots are in `docs/screenshots/`; the walkthrough, poster and captions are in `apps/dashboard/public/`.

## Account-dependent verification still required

No credentials were supplied for a live Supabase project, AI Gateway, Twilio, Vapi, Langfuse or Vercel. Their adapter code and configuration are present; real sign-in delivery, real model calls, real voice and WhatsApp operations, remote telemetry, hosting and DNS have not been asserted as verified. Food and retail sector rules still require real sector-expert validation before a pilot. See `SETUP.md` and `ARCHITECTURE.md` for the exact boundaries and next steps.
