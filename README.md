# Node.js API + Postgres + continuous worker

Three services, one repository. The Express API stores report requests in Postgres. A separate worker polls pending rows every second, locks one with `FOR UPDATE SKIP LOCKED`, and commits the total and completion status in the same transaction. No Redis service is required.

## Railway

The `.railway/railway.ts` infrastructure definition provisions Postgres, API and worker from this repository. API: `npm start`, pre-deploy: `npm run migrate`, health check: `/healthz`, port 3000. Worker: `npm run worker`, no public domain. Both application services reference the private Postgres `DATABASE_URL`; disable sleeping for this continuous-polling workload. The infrastructure definition generates a 64-character API_TOKEN. Generate a public domain for the API only.

Migrations run once per API deployment, not per application replica or worker startup. The initial migration is repeatable. Worker startup waits up to 60 seconds for the schema.

## Verify a hosted deployment

Copy the generated API_TOKEN from the API service’s Variables tab into your shell. Do not commit it. Set API_URL to your API’s generated HTTPS domain. Run `npm ci` and `npm run smoke` with both environment variables set.

## Local setup

Requires Node.js 22+ and Postgres. Set DATABASE_URL and a random API_TOKEN (at least 24 characters) in your environment. Run `npm ci`, `npm run migrate`, then `npm start` and `npm run worker` in separate terminals. Run `npm run smoke` from a third terminal with the same token. For a hosted API, set API_URL before running the smoke script.

## API

- GET /healthz: unauthenticated database/schema readiness.
- POST /reports: Bearer API_TOKEN, JSON `{"amountsCents":[1250,2500,375]}`; HTTP 202 with a report ID.
- GET /reports/ID: same token; eventually `status: "complete"`, `total_cents: "4125"`. Postgres bigint is serialized as a string.

## Job semantics

A stopped worker leaves requests pending in Postgres. A crash before transaction commit releases its row lock and rolls back the result, so another worker can retry. Multiple workers skip locked rows. The calculation is short and runs inside the transaction; do not use this pattern to hold locks during slow HTTP calls or long CPU tasks. There are no external side effects. Email, payments, retries with backoff, dead letters and tenant authorization require a fuller job system.

This teaching API shares one administrative token. Add workload-specific authentication, rate limits, retention, monitoring and backup policy for production. The starter uses single-node Postgres; it does not configure high availability.

## Validation

`npm test` checks amount validation and totals; `npm run check:iac` checks the infrastructure definition; `npm run smoke` checks readiness, auth, input validation and an accepted job completing with 4125 cents. Hosted validation evidence belongs to the accompanying article, not a cross-provider benchmark.
