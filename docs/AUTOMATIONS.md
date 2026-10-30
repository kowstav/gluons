# Reusable document and operations workflows

Open `/dashboard?tab=workflows`. The default food business supports invoices, stock counts, customer questions and catalog requests. Create a **Field services**, **Property maintenance**, **Vehicle repair** or **Small fleets** business in Business setup to enable work requests and job-sheet summaries. These packs are research-led prototypes awaiting practitioner validation.

## Run

```sh
npm ci
npm run dev
```

PDF text, CSV parsing, fuzzy lookup and stock rules run locally. In AI demo mode no paid inference occurs. Setting the existing live Gateway variables enables the existing typed AI proposal pipeline. Local preparation is recorded separately in task details with engine names, source hash and elapsed time; token cost is not presented as total processing cost.

### Optional image OCR

Set `GLUONS_OCR_ENABLED=true` on a Node host that supports worker threads, local package files and WebAssembly. English language data is installed through `@tesseract.js-data/eng`; requests do not download it or send document contents to an OCR service. Restart the server after changing the environment. OCR is disabled by default to avoid assuming a serverless host supports long-running workers.

Accepted: PNG/JPEG, at most 2 MB and 12 million pixels; 25-second recognition timeout. Confidence is a whole-document heuristic, not a guarantee about amounts. A scanned PDF without a text layer is rejected; upload the relevant page as a PNG/JPEG or paste checked text. Multi-page PDF rendering/OCR is not implemented.

### Optional invoice2data worker

Use Python 3.12 in a project venv:

```sh
python -m venv .venv-invoices
# Linux/macOS:
.venv-invoices/bin/python -m pip install -r packages/automation-bridge/requirements.txt
# Windows:
.venv-invoices/Scripts/python.exe -m pip install -r packages/automation-bridge/requirements.txt
```

Set `GLUONS_INVOICE_PYTHON` to that interpreter's **absolute path**, and optionally `GLUONS_INVOICE_RUNNER` to the absolute path of `packages/automation-bridge/invoice.py`. The default runner path assumes the Next app runs from `apps/dashboard`. Restart Next. This worker is optional and cannot be assumed available on Vercel. No Python process runs if the interpreter variable is empty. A worker failure leaves the extracted text editable and displays a warning; it does not silently assert a successful template match.

The shipped template covers a checked USD text layout with `Invoice:`, ISO `Date:` and `Total: USD` lines. It uses real invoice2data parsing with AI fallback disabled. A sector expert can add reviewed supplier templates in the source; uploads cannot supply templates or executable code. OCR and PDF reading occur before this structured-text step. The template's generic issuer label is **not vendor identity verification**.

Run the real bridge smoke test:

```sh
python packages/automation-bridge/test_invoice.py
```

## Input formats and boundaries

- **Receipt:** `Total: USD 48.50` on its own line, or an explicitly owner-confirmed positive USD amount. Distinct competing totals, missing explicit currency, unsupported currencies and missing totals need correction. Owner override is deliberately editable; the app does not convert currencies or verify tax/accounting treatment.
- **Stock:** CSV headers `id,quantity`. IDs must already exist in business setup. Imported thresholds are ignored; configured thresholds govern. Maximum 20 rows, no duplicate IDs. Only low counts are staged; inventory changes only after approval in live mode. No supplier orders.
- **Job sheet:** CSV headers `job,minutes,status`, with unique job IDs, minutes from 0–1440 and `completed`/`pending` statuses. The summary records observed work duration; it does not treat it as time saved, payroll or performance scoring.
- **Work request:** plain English plus an explicit fixed timezone offset. Chrono provides a suggested timestamp only when an exact hour is found without multiple competing date results. Owner must check dates, daylight saving, scope and availability. No calendar reservation, emergency response or dispatch.
- **Customer question:** Fuse searches configured hours, phone and catalog. Missing answers and sensitive requests defer to the owner. No free-form FAQ upload or vector store is claimed.
- **Catalog request:** Fuse matches a configured item; close competing matches fail. Quantity must be explicitly supplied and prices come from setup. Owner checks the staged match before approval.

Uploads are authenticated in hosted use, rate limited, at most 2 MB, and read in memory. Text PDFs are limited to 10 pages; extracted text must fit the 6,000-character task limit. No document URL fetching is provided. Local demo mode follows the existing loopback-only deployment policy. Task text persists in the owner-scoped workspace; uploaded original files do not.

The existing owner decision and trial gate applies to every workflow. A requested visit records a job only in Gluons' internal operations ledger after live approval; it does not dispatch a worker. Batch preparation validates input before staging. Live Gateway imports permit at most one qualifying task per request to bound model calls and request duration; demo batch imports can prepare up to 20.

The UI keeps a request ID for retries of the same unchanged form, and runtime event IDs suppress duplicate staging for that request. Importing the same invoice again under a new request ID is **not document-level duplicate detection**; owner review remains necessary. File hashes in provenance identify source text, not verified document authenticity.

## Upstream provenance

See [research and repo decisions](research/2026-10-30-opportunities.md), [the dated repository snapshot](research/repositories-2026-10-30.json), `package-lock.json`, the pinned Python requirements and [third-party notices](../third_party/NOTICE.md). Parsers are integrated through actual executable imports; entire workflow platforms were not copied into Gluons.

## Verification

`npm test` exercises real PDF.js extraction and Tesseract OCR, fixed-offset date parsing, CSV validation, stock thresholds, retrieval fallback, replay handling and approval/trial behavior. `npm run test:http` uses an isolated data file and a production server, including document → workflow → pending approval and a new field-service setup. GitHub CI also installs the pinned Python worker and runs invoice2data on positive and rejected examples. Tests use synthetic fixtures, not real customer data or paid services.
