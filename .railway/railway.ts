import process from 'node:process';
import { defineRailway, project, service, postgres, github, preserve } from 'railway/iac';
export default defineRailway(() => {
  const db = postgres('postgres');
  db.networking = { privateNetworkEndpoint: 'postgres' };
  const source = github('WillRaphaelson/node-postgres-worker-backend', { branch: 'main' });
  const api = service('api', {
    source, start: 'npm start', preDeploy: 'npm run migrate', healthcheck: '/healthz',
    deploy: { sleepApplication: false },
    ...(process.env.API_SERVICE_DOMAIN ? { networking: { serviceDomains: { [process.env.API_SERVICE_DOMAIN]: { port: 3000 } } } } : {}),
    env: { NODE_ENV: 'production', DATABASE_URL: db.env.DATABASE_URL,
      API_TOKEN: preserve(), PORT: '3000' },
  });
  const worker = service('worker', {
    source, start: 'npm run worker', deploy: { sleepApplication: false },
    env: { NODE_ENV: 'production', DATABASE_URL: db.env.DATABASE_URL },
  });
  return project('node-postgres-worker-backend', { resources: [api, worker, db] });
});
