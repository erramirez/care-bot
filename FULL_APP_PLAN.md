# Family care hub — full-app development plan

## Current direction

Family only, one care recipient. Mom is the primary caregiver and maintains the medication plan and appointments. The interface is designed around an 80-year-old user who is comfortable with technology: large controls, plain language, short forms, and immediate access to daily tasks.

Keep Today focused on the schedule and four actions: Record medication, Record sleep, Record behavior, and Add note. Put personal delivery preferences in Summary settings rather than expanding the main navigation.

## Current local version: v4

- Daily schedule with medications, appointments, one-time activities, and daily activities.
- Dose recording and preserved corrections; medication plans with effective dates.
- Sleep start/end, estimated awake time, quality, notes, and overlap validation.
- Behavior observations on a labeled 1–5 family scale, with context and notes.
- Separate summary preferences for Mom, You, and Sibling: on/off, email/text, destination, daily/weekly/selected days, time, time zone, period, and selected topics.
- Email summary preview and text notification preview with a simulated View summary button.
- Sample summaries assembled deterministically from saved records, with source links and explicit missing information.
- Local saving, offline page cache, backup export, and confirmed demo reset.

This version does not call AI, run delivery schedules, send email/SMS, connect a calendar, or provide secure sign-in or cross-device sharing. Destination fields are for fictional walkthrough data. Preferences marked on are a saved intention, not an active delivery service. Preview reporting periods follow the device's local dates, not the selected delivery time zone.

Keep using the existing local-storage key/schema so earlier records are retained. Version numbers refer to the product release; storage schema remains version 2 with additive summaryPreferences fields.

## Calendar integration

**Open question:** Mom uses a calendar app believed to be Apple Calendar; its underlying account is not confirmed. Do not assume iCloud from the app name.

1. Confirm the app, account provider, calendars used, and what Mom expects to appear in both places.
2. Use a dedicated Dad's care calendar, leaving unrelated personal calendars outside the connection.
3. Prototype appointment export/import. Clearly label one-time copies and their inability to update automatically.
4. Add authorized read-only sync from the selected provider into the family schedule. Imported events retain provider, calendar ID, event ID, revision, recurrence instance, source time zone, cancellation state, and last successful sync time. Initially edit these in the source calendar.
5. Add writes only after testing duplicate detection, changes, deletion, recurring events, time-zone shifts, authorization revocation, and conflicts. Each event has a defined source of truth.

If the account is Google, Mom can continue using Apple Calendar with that account. If iCloud, validate the supported authorization/connection route before committing to an implementation. Do not expose a sensitive calendar through a public sharing link as a shortcut.

Calendar events are appointments and selected activities. Dose administration records, sleep, behavior, and private care notes stay in the care app. A scheduled event is never evidence that care happened.

## Shared service foundation

Replace browser-only persistence with a shared database behind an authenticated API. Keep the existing visual workflows.

- Real individual accounts and a single invited family group.
- Server-enforced roles: Mom coordinates care; a designated backup can maintain the plan; invited members can record care and observations. Administrative access and care-plan editing are separate permissions.
- Explicit invitations, revocation, session controls, secure connections, access controls, audit records, encrypted managed storage, backups, tested recovery, and exports.
- Stable IDs and record versions; immutable correction history. Changes to the medication plan do not rewrite dose history.
- Offline entries use an outbox, device ID, stable operation ID, creation/observation times, and an explicit pending/synced state. Duplicate or conflicting dose records are preserved and presented for review.
- Minimal opt-in offline cache. Show last successful sync. A disconnected device cannot know another caregiver's recent actions or immediately honor remote revocation.

Keep hosting/provider choice open until deployment is requested. Required capabilities are an authenticated web service, shared database, secret storage, scheduled job execution, and email/SMS delivery. These need to run when family devices are closed.

## AI summaries

Use one administrator-managed OpenAI API credential in server secret storage. Do not place a key in the browser, repository, exported data, or distributed ZIP. Family members need accounts and preferences, not their own keys.

1. Calculate medication counts, sleep totals, reporting windows, and missing information deterministically on the server.
2. Select only records the recipient is authorized to see and topics they selected. Send the minimum necessary care information to the API after the family has agreed to this processing.
3. Use a structured response format containing summary sections and valid source record IDs. Treat care notes as data, never as instructions. Validate references and numerical claims before saving or delivering the summary.
4. Label the result as AI-generated, with generation time, reporting period, data cutoff, and source links. Preserve the source-record snapshot used for that generation.
5. Require descriptions to distinguish unrecorded from skipped/held, avoid causal or diagnostic claims, and never recommend or apply medication changes. Behavior scores are personal observations, not clinical measures.
6. Keep generated summaries separate from original records. Review availability/retention settings, model capabilities, and costs before enabling live requests. Apply app-enforced usage limits, input/output limits, retries, and clear failure handling.

Start with manual Generate summary using fictional data on the server. Then test actual family-approved data and scheduled generation. The local v4 preview remains deterministic and explicitly non-AI.

## Per-person scheduling and distribution

Persist settings against a real user ID, not a display name. Store enabled state, channel, verified destination, frequency, selected weekdays, local time, IANA time zone, coverage, and topics. Recipients can edit their preferences or pause delivery.

- Daily/weekly summaries cover previous complete local calendar day(s) in the recipient's time zone. The UI must state this cutoff. Show upcoming appointments separately for the next seven days.
- Calculate sleep elapsed duration from actual timestamps with offsets. Calendar and delivery calculations must account for daylight saving changes; never rely on a fixed UTC offset.
- A server scheduler finds due recipients and creates idempotent jobs keyed by user, schedule version, and reporting window. Prevent duplicate sends after retries or restarts.
- Decide explicitly how to handle skipped/repeated daylight-saving times and late/missed runs. Show each recipient the next scheduled delivery.
- Generate once per eligible identical data window/topic set where authorized; keep delivery independent per recipient. Do not reuse a summary across different access scopes.
- Maintain queued/generated/sent/failed status, delivery-provider IDs, bounded retries, and administrator-visible failures. No new records means the summary says so; it does not invent a normal day.
- Late offline entries are not silently included in an already-delivered summary. Display the cutoff and mark later information for the next summary or a manually regenerated version.

### Email

Default to the summary in the email, with a clear data period and secure links back to the app. Explain that medical details will be present in the recipient's email account. Offer a link-only email option for greater privacy. Verify addresses and respect pause/unsubscribe settings.

### Text

Default to a short notification that a summary is ready, with a secure link. Do not include medication names, sleep scores, behavior, or other care details in text previews. Verify the number and obtain recipient opt-in. The link requires family sign-in; it does not grant access by possession alone. Support opt-out and failed-delivery handling. SMS provider charges are separate from AI usage.

## Delivery phases

1. **Family review of v4:** test visibility, wording, summary usefulness, and email/text preferences. Confirm calendar account.
2. **Shared service pilot:** individual accounts, shared records, permissions, backups, offline synchronization, and conflicts.
3. **Calendar + manual AI pilot:** narrow read-only calendar sync and source-checked summaries using a server-held credential.
4. **Scheduled delivery:** verified contacts, per-user preferences, reliable jobs, email/SMS integration, limits, and failure reporting.
5. **Later features:** voice transcription, optional reviewed longer-term summaries, as-needed medication workflows, and read-only Mayo/Epic access after separate feasibility work.

## Acceptance checks before live family use

- Mom can find the daily plan and record medication, sleep, or behavior without navigating to another page.
- One-time activities do not recur; medication corrections and effective dates preserve history.
- Members cannot read another family's data or change the medication plan without permission.
- Offline entries survive restart, sync once, and expose conflicts; cache limitations are clear.
- Calendar imports do not duplicate events and correctly handle cancellation, recurrence, and time zones.
- Summary counts match records, source links resolve, and missing information stays explicit.
- Notes attempting to instruct AI cannot alter its task or trigger actions.
- A closed browser does not stop scheduled generation; daylight-saving changes and retries do not duplicate delivery.
- Pausing or revoking access stops future delivery, and SMS links require sign-in.
- API keys and provider credentials never appear in client assets, logs, exports, or downloads.
- Recovery from a backup has been demonstrated.

## Decisions still needed

- Mom's calendar provider and desired direction of synchronization.
- Individual recipient schedules, topics, and email/text choices.
- Family agreement about sending care information for AI processing and detailed email delivery.
- Hosting, account, database, email, and SMS providers; operating budget.
- Final family wording for the behavior scale and whether medication tracking needs as-needed doses.
