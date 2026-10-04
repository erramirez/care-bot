# Care Bot — version 4 family care demo

This is a dependency-free local prototype with fictional data. Do not use it as the family's actual medication record yet: it has no authentication, cross-device synchronization, or secure health-data storage.

## Hosting and repository

Source: https://github.com/erramirez/care-bot

This release packages the original version 4 demo without changing its care workflows. Netlify builds with `npm run build` and publishes only `dist/`. Pushes to `main` publish automatically after the build checks pass. No API keys or runtime services are required.

The hosted demo still stores entries only in the current browser. Opening it on another device does not share records. Summary settings do not send messages or run schedules. Use fictional information.

## Open the demo

From this folder, run:

```
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Then open http://127.0.0.1:4173 in a browser. Keep the server running during the walkthrough. Return to this same address and browser to retain local entries.

## Version 4: summary preferences and previews

Open the Summary settings link above the daily plan, or visit `/#summaries`. Choose Mom, You, or Sibling; save individual email/text preferences, frequency, selected days, time/time zone, coverage, and topics. Use fictional contact details. Preview sample email content or a text notice with a simulated View summary button. No OpenAI API calls or messages are sent, and no background schedules run.

The previous complete day or seven days are used for preview reporting, based on this device's local dates. Individual time zones are stored for future server delivery. Source links let you review the underlying entries. Existing care records are retained.

[FULL_APP_PLAN.md](FULL_APP_PLAN.md) records the shared-service architecture, calendar questions, AI validation, delivery workflow, implementation phases, and acceptance checks.

## Version 3: simpler daily care

The main screen now has four large buttons: Record medication, Record sleep, Record behavior, and Add note. Add to schedule is a primary action at the top. The daily schedule includes medications, activities, and appointments, grouped by morning, afternoon, and evening. Text is larger, controls have at least 52-pixel touch targets, and unnecessary decorative copy has been removed.

Add to schedule supports an appointment, a one-time activity, or a daily activity, with optional activity times. Mark done records a routine directly; View record lets you correct it later. Demo caregiver selection is under Demo settings. Existing version-2 browser data is retained.

## Walkthrough

1. Start on Today and record a routine.
2. Review the morning dose, then record an evening dose and try a correction.
3. Open Trackers; add an overnight sleep entry and a demeanor observation.
4. Review seven days of sleep and demeanor, including the context behind an entry.
5. Add an appointment, a question, and visit notes.
6. Switch the demo caregiver to Sibling and add a note or offer to help.
7. Reload the page and confirm entries remain.

About this demo includes JSON backup export and a confirmed reset to fictional sample data.

## Trackers

Sleep periods include full start/end dates, overnight/nap type, estimated awake minutes, a required quality rating, and optional notes. Estimated sleep is elapsed time minus awake minutes. Periods are grouped by their end date. Overlapping periods are rejected to avoid double-counting.

Demeanor is a family observation scale: 1 very unsettled, 2 unsettled, 3 mixed/in between, 4 comfortable, 5 calm and content. It is not a clinical measure. Each observation retains its time, author, context, notes, and correction history. Missing entries are shown as missing, never zero.

## Persistence and offline use

Records are saved in this browser's localStorage. A service worker caches the page after the initial load so it can reopen offline in supported browsers. Clearing browser data removes records and the offline cache. No entries are uploaded or shared, online or offline. Cached information is not encrypted. The demo caregiver selector is role simulation only.

This version supports fixed daily medication schedules. As-needed plans, active reminders, invitations, secure sign-in, AI transcription, and Mayo/Epic access remain future work.

## Verification

```
node --test tests/*.test.mjs
node --check dist/app.js
node --check dist/sw.js
```
