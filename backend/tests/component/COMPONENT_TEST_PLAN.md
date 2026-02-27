# Component Test Plan

## External Edge Map

| Module | External Dependency | Adapter/File Path | Functions Covered |
| --- | --- | --- | --- |
| auth | Mailgun API client | `src/utils/sendEmail.js` via `src/config/mailgun.config.js` | `sendEmail`, `sendVerificationEmail` |
| inquiry | Zoom OAuth + Meetings API | `src/config/zoom.config.js`, `src/utils/zoomMeeting.js` | `getZoomAccessToken`, `createZoomMeeting` |
| inquiry | Google Calendar API + Zoom bridge | `src/utils/calenderSchedular.js` via `src/config/calender.config.js` and `src/utils/zoomMeeting.js` | `scheduleEvent`, `getFreeSlots` |
| chatbot | Groq SDK and OpenAI-compatible HTTP endpoint | `src/modules/shared/chatbot/aiExtractor.service.js` | `extractForStep` |
| etl | AWS STS AssumeRole | `src/aws/assumeRole.js` | `assumeRole` |
| etl | AWS S3 list/head + ETL dispatch | `src/modules/shared/ETL/pollClient.js` | `pollClient` |
| core-dashboard | Report aggregation adapter (DB-facing boundary) | `src/modules/core-dashboard/reports/reports.service.js` via `reports.aggregations.js` | `getDashboardSummary`, `getTopServices` |
| core-dashboard | PDF generation adapter | `src/modules/core-dashboard/reports/reports.controller.js` via `reports.pdf.js` | `downloadPDF` |

## No-Network Enforcement

- Global component setup is enabled through `tests/component/setup.js` when `TEST_SUITE=component`.
- `tests/component/_helpers/noNetwork.js` blocks outbound calls from:
  - `http.request` / `http.get`
  - `https.request` / `https.get`
  - `globalThis.fetch`
- Any unmocked outbound request throws immediately with a deterministic error.
- Per-test allowlist state is reset after each test.

## Test Files and Coverage

- `tests/component/auth/mailgun.component.test.js`
  - Verifies Mailgun payload mapping (`from`, `to`, `subject`, `html`).
  - Verifies provider errors are rethrown by `sendEmail`.
  - Verifies verification-email contract success path.
  - Verifies verification-email failure mapping (`{ success: false, message }`).

- `tests/component/inquiry/zoom.adapter.test.js`
  - Verifies OAuth token request URL + Basic auth header construction.
  - Verifies meeting-create endpoint, payload shape, and Bearer header.

- `tests/component/inquiry/calendar.component.test.js`
  - Verifies busy-slot rejection logic.
  - Verifies calendar accessibility failure handling.
  - Verifies successful schedule flow calls Zoom + Calendar insert with expected payload mapping.
  - Verifies scheduler error mapping on adapter failure.
  - Verifies free-slot computation excludes busy windows.

- `tests/component/chatbot/ai-extractor.component.test.js`
  - Verifies no call behavior when API key is absent.
  - Verifies Groq SDK success path and output sanitation.
  - Verifies SDK failure fallback to fetch with expected URL, headers, and body.
  - Verifies empty extraction forces clarification contract.
  - Verifies dual-path failure returns `null` safely.

- `tests/component/etl/assume-role.component.test.js`
  - Verifies STS client construction from env credentials.
  - Verifies runtime override behavior and fallback credentials.
  - Verifies required-config fast-fail behavior.
  - Verifies STS failure propagation.

- `tests/component/etl/poll-client.component.test.js`
  - Verifies list/head object calls and upload metadata persistence.
  - Verifies dedupe path (existing upload skipped).
  - Verifies invalid object entries are ignored.

- `tests/component/core-dashboard/reports.service.component.test.js`
  - Verifies empty response path avoids aggregation calls.
  - Verifies aggregation adapter parameter mapping and summary projection.
  - Verifies top-services percentage distribution projection.

- `tests/component/core-dashboard/reports.download.component.test.js`
  - Verifies PDF response headers + streaming lifecycle (`pipe`, `end`).
  - Verifies sync generation failure maps to `AppError` contract.
  - Verifies stream error maps to `AppError` contract when headers not sent.

- `tests/component/http.test.js`
  - Verifies HTTP helper behavior using mocked `supertest` agent only (no sockets/network).
  - Verifies header merge, query application, and body-send behavior.

## Refactors Applied

- `package.json`: added `test:component` script; `test:unit` narrowed to `tests/unit` only.
- `vitest.config.js`: component suite now loads `tests/component/setup.js` and skips DB global setup.
- `tests/setup.js`: DB truncation/connection teardown now only for DB suites.
- `tests/globalSetup.js`: global DB/docker setup now skipped for `component` suite.
- No runtime production module behavior was modified.
