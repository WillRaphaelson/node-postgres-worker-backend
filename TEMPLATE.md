# Deploy and Host Node.js API, Postgres, and Worker on Railway

Deploy a Node.js API, a continuously running background worker, and Postgres together. Submit a report, get its ID immediately, and retrieve the completed result after the worker processes it.

## About Hosting Node.js API, Postgres, and Worker

This starter deploys three services from [the supporting repository](https://github.com/WillRaphaelson/node-postgres-worker-backend):

- API: Express on Node.js 22, `npm start`, a public HTTPS domain on port 3000, and a `/healthz` deployment health check.
- Worker: `npm run worker`, continuously polling Postgres without a public domain.
- Postgres: private database connection and persistent volume.

API and worker use service references for DATABASE_URL. The API generates an API_TOKEN; retrieve it from the API service's Variables tab after deployment. The API runs `npm run migrate` before deploying, and the worker waits for the schema. Serverless sleeping is disabled for the application services.

## Why Deploy Node.js API, Postgres, and Worker on Railway

Keep the application's request handler, job processor, and database together while giving the API and worker independent processes. Railway supplies private service connections, generated environment values, deployment logs, and resource metrics in the same project.

## Common Use Cases

- Learning how to host a complete Node.js backend.
- Separating asynchronous processing from HTTP requests.
- Starting a small database-backed report-processing workflow.

The sample calculation is deliberately short and database-only. It is not a full multi-tenant API or a general-purpose job queue. External side effects, slow tasks, retry scheduling, tenant authorization, and workload-specific production controls need additional design.

## Dependencies for Node.js API, Postgres, and Worker

The API and worker build from one Dockerfile with Node.js 22. Runtime packages are Express and node-postgres. Postgres holds pending requests and completed results; Redis is not required.

### Deployment Dependencies

Deploy all three services and keep both application DATABASE_URL references pointed at the deployed Postgres service. Only the API needs public networking. Allow its pre-deploy migration to finish. The starter uses single-node Postgres; configure backups and availability to match your production needs.

To check deployment, clone the repository, run `npm ci`, set API_URL to the API's generated HTTPS domain and API_TOKEN to your generated token, then run `npm run smoke`. It submits amounts of 1250, 2500, and 375 cents and checks that the worker completes a report totaling 4125 cents.
