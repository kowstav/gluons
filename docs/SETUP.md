# From local demo to connected prototype

The default demo runs immediately with `npm ci && npm run dev`. Enable each service deliberately; none is required to explore the product. Keep secrets in `apps/dashboard/.env.local` or the hosting provider's encrypted environment settings. Never commit real keys.

## 1. Local configuration

Copy `apps/dashboard/.env.example` to `apps/dashboard/.env.local`. PowerShell:

```powershell
Copy-Item apps/dashboard/.env.example apps/dashboard/.env.local
```

The local store is intended for one Node process. The dev server listens on `127.0.0.1` and does not expose your demo to the network. Set `GLUONS_ALLOW_LOCAL_DEMO=true` for a local `npm start` production preview. Hosted Vercel use always requires Supabase.

## 2. Supabase: login, durable data and live updates

1. Create a Supabase project in your own account.
2. Run `supabase/migrations/001_gluons.sql` in its SQL editor, then `supabase/seed.sql`. Alternatively, link the local Supabase CLI project and run `supabase db push` and the catalog seed. `supabase start` supports local development if Docker and the Supabase CLI are installed.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the dashboard environment. Restart Next.js after changing public variables.
4. Visit `/login`. Create an owner account, confirm its email if required by your project, and sign in. Each authenticated owner receives a separate, clearly labeled sample workspace. The builder can then add real business details to that owner's workspace.
5. In Supabase Auth, configure your actual Site URL, allowed redirects and email delivery for deployment.
6. The migration adds `workspaces` to `supabase_realtime`. The dashboard subscribes to workspace changes and also polls every five seconds as a fallback.

`save_workspace` performs revision checks, snapshot writes, relational projections, and savings snapshot generation in one Postgres transaction. All owner tables use RLS. Direct client mutation privileges are revoked; the RPC checks the caller's owner ID. Trial requests permit public inserts but no public reads. The service role is used only for authenticated webhook intake into the explicitly configured owner workspace.

The embedded Postgres test executes the actual migration with mocked Supabase auth functions and validates isolation, constraints and revision conflicts. A live Supabase integration test still needs your project configuration.

## 3. EfficientAI: Jev and working models

1. Create a Vercel AI Gateway API key with your preferred budget.
2. Set `AI_GATEWAY_API_KEY` and `GLUONS_AI_MODE=gateway`.
3. Confirm that your Gateway account can access `typesafe-ai/jev` and the configured working models. You can change `AI_MODEL_CHEAP`, `AI_MODEL_MEDIUM`, and `AI_MODEL_FRONTIER` without changing the engine.
4. Set token rates to match your current provider configuration. Defaults are illustrative snapshots and all calculated usage costs are labeled estimates.
5. Run one low-risk task in a trial business. Inspect the route and both the Gluons and Gateway logs before increasing volume.

The implementation uses `experimental_decide` for Jev, with a choice question for difficulty and a boolean probability for special attention. A decision-service failure produces a visible failed task and no action. Working models use `generateText` with `Output.object`. The engine checks output kind and executable data against trusted component logic before staging anything. A failed attempt moves to the next tier, with at most three working-model attempts. Every action requires human approval regardless of Jev's answer.

The experimental decision API is pinned through `package-lock.json`. See [AI SDK decisions](https://ai-sdk.dev/docs/ai-sdk-core/decisions).

## 4. Twilio number + Vapi voice intake

1. In your own Twilio account, obtain a suitable telephone number. Number rental and usage are paid services; this repository does not buy one.
2. Import that Twilio number into Vapi and create an inbound assistant. Supply the configured business catalog and opening hours as its knowledge context.
3. Instruct the assistant to collect the request and explain that the owner must confirm it. It must never promise that an order, refund or purchase has been completed. Do not give it tools that bypass Gluons staging.
4. Set Vapi's Server URL to `https://YOUR_DOMAIN/api/webhooks/vapi`. Configure a custom `x-gluons-secret` header with the same strong random value as `VAPI_WEBHOOK_SECRET`. Subscribe to `end-of-call-report` events.
5. Set `WEBHOOK_BUSINESS_ID` and `WEBHOOK_OWNER_ID`. With Supabase, also set `SUPABASE_SERVICE_ROLE_KEY` on the server. The owner ID is the authenticated user's UUID; the business ID appears in the workspace API response or database table.
6. The endpoint accepts `message.artifact.transcript` or `message.transcript`. Optional `message.analysis.structuredData` may contain `catalogItemId` and `quantity`. IDs and quantities are still validated against the business setup. Without structured data, exact catalog-name matching and a numeric quantity provide a simple prototype extraction path. Unrecognized requests become a staged owner-reviewed reply, not an invented order.
7. Place a real test call only after those accounts and credentials are configured. The completed call creates a task; it cannot approve or execute its own action.

Call IDs are scoped idempotency keys. No phone number or Vapi assistant was provisioned during this build. See [Vapi server events](https://docs.vapi.ai/server-url/events).

## 5. Optional WhatsApp sandbox

1. Enable Twilio's WhatsApp sandbox and join it from your test phone according to Twilio's instructions.
2. Set the inbound message URL to `https://YOUR_DOMAIN/api/webhooks/twilio`.
3. Configure `PUBLIC_APP_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` exactly. `PUBLIC_APP_URL` must match the public origin used by Twilio because signature verification includes the complete URL.
4. Configure webhook owner and business IDs as above. Inbound WhatsApp requests are signed and verified with Twilio's SDK. Message SIDs deduplicate intake.
5. In trial mode, approving a reply records it without sending anything. In live mode, delivery requires `LIVE_ACTIONS_ENABLED=true`. The recipient comes from the verified inbound sender and cannot be changed by generated output or the owner text editor.

For an ambiguous delivery failure, reconcile the message in Twilio before any manual retry. The prototype intentionally blocks automatic retries of an `executing` or `execution_unknown` action. See [Twilio webhook security](https://www.twilio.com/docs/usage/webhooks/webhooks-security).

## 6. Langfuse

Create a Langfuse project and configure `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, and `LANGFUSE_SECRET_KEY`. A task trace and per-attempt generation observations are sent to the public ingestion endpoint after the workspace commit. Transcripts are not sent in the telemetry adapter; model name, token usage, estimated cost, task ID and routing metadata are included. A telemetry failure does not undo a saved task. Repeated webhook telemetry uses stable trace/generation IDs.

This adapter logs estimates from Gluons, not a reconciled provider invoice. See [Langfuse public API](https://langfuse.com/docs/api-and-data-platform/features/public-api).

## 7. Vercel and your domain

1. Import `kowstav/gluons` into your Vercel account.
2. Set the **Root Directory** to `apps/dashboard`. Enable access to files outside that directory so the workspace packages are included. Use the Next.js framework preset, npm install from the workspace root, and the dashboard build script. Vercel supports npm workspaces; the root lockfile must remain committed.
3. Configure Supabase variables before deployment. A filesystem demo is deliberately refused on Vercel because serverless local disks are not durable.
4. Add the AI, webhook and telemetry variables you intend to enable. Leave `GLUONS_AI_MODE=demo` and `LIVE_ACTIONS_ENABLED=false` until you are ready to make paid requests and approve real messages.
5. Add a strong `CRON_SECRET`. The included Vercel cron calls `/api/cron` daily at **17:00 UTC / 22:30 Asia/Kolkata**. It stages a daily report and low-stock alerts for enabled components in the configured business. Event IDs make repeat calls idempotent. Every resulting proposal still waits for owner approval.
6. Add your own domain in Vercel's domain settings and apply its verified DNS instructions. Update Supabase's Site URL, `PUBLIC_APP_URL`, Twilio and Vapi webhook URLs to that domain.
7. Verify login, two separate owner accounts, Realtime, one trial task, a PDF download and one deliberately approved live test before broader use.

The build did not deploy to a Vercel account or configure a domain because none was supplied. The GitHub repository, local app and deployment configuration are available independently.

## Trial requests

Landing-page requests are stored locally in the demo, or in `trial_requests` on Supabase. Inspect them in the local JSON file or Supabase dashboard as the project operator. No external email, CRM or calendar delivery is implied. Add your chosen service when you are ready to operationalize follow-up. Public inserts have a basic process-local rate limit and honeypot; add provider-level bot protection before a broadly advertised launch.
