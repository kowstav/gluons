# Prototype verification record

Workflow expansion (2026-10-30): researched ten niches and reviewed 18 repository candidates. Added four research-led sector packs, two reusable components and six workflow paths. Real fixture verification covers PDF.js text extraction, Tesseract OCR using bundled English data, invoice2data positive/uppercase/no-match behavior, CSV validation, date offsets, retrieval fallbacks and owner approval/trial isolation. Browser QA created **Northside Field Team** through Business setup, staged an unconfirmed requested visit, and read a synthetic invoice image through OCR and the Python template worker before staging an expense. Source material and setup details are in [the research report](research/2026-10-30-opportunities.md) and [automation runbook](AUTOMATIONS.md). No live telephony, paid inference, dispatch or vendor accounting was exercised. A production HTTP regression caught upstream PDF whitespace flattening; the adapter now preserves line boundaries and tests the extracted total as well as raw text.

Final expansion verification: 36 Node/component/database tests and eight production HTTP tests passed, alongside strict type checking and the optimized build. The separate real Python bridge smoke test passed. Mobile browser QA at 390px confirmed a compact workflow selector, 16px entry text and no page overflow. Dependency audit reported zero known npm advisories; this is not a full upstream security audit. The saved screenshots show the new workflow screen and the unconfirmed field-service approval.

Visual refresh (2026-10-29): applied the Anthropic Frontend Design skill and Vercel Web Design Guidelines. See [design rationale and sources](DESIGN.md). Checked the public page and workspace at desktop, tablet and phone widths, including the 320px landing page and overview, 390px queue, services, business setup and report, and 768px public layout. Fixed the setup-choice overflow found during phone QA. Editable data tables and the activity log scroll inside their containers. A computed-style contrast check of 35 setup-form text elements found no failures against the corresponding normal/large-text contrast thresholds. Native dialogs have accessible names, phone navigation supports Escape, and the remaining entry motion respects reduced-motion preferences. Creating a demo task, escalation details, editing and approving a trial proposal, service navigation, trial request dialog and one-page PDF export were checked in the actual browser. The refreshed demo uses ten new screenshots. The PDF dependency was updated to 4.2.1 after an advisory was reported; npm audit then reported zero known vulnerabilities.

Customer-copy update (2026-10-29): the public site, metadata, demo captions and owner workspace now describe services, setup support, approval and measurable trial results. The former technical library and builder presentation has been replaced by **Services** and **Business setup**. The previous reuse-count walkthrough below records the original build; it is no longer shown to customers. The demo video and screenshots have been replaced to match the customer-facing experience. An additional HTTP check protects the public-copy boundary.

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
