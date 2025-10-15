import 'dotenv/config';
import Fastify from 'fastify';
import {JSONFilePreset} from 'lowdb/node';
import {mkdir} from 'node:fs/promises';
import {startSensorLoop} from './sensor.js';
import ensureEnv from 'elliotisms/ensure-env';
import renderHTML from './render-html.js';
var PORT, maxMinutes, HISTORY_MS, db;

const start = async () => {
  await ensureEnv(); // optional; throws if missing
  PORT = Number(process.env.PORT);
  maxMinutes = Number(process.env.MAX_HISTORY_MINUTES);
  HISTORY_MS = Number(process.env.MAX_HISTORY_MINUTES);
  await mkdir('data', {recursive: true});
  db = await JSONFilePreset('data/seismo.json', {samples: []});
  function prune() {
    const cutoff = Date.now() - HISTORY_MS;
    db.data.samples = db.data.samples.filter(s => s.t >= cutoff);
  }

  setInterval(async () => {
    prune();
    await db.write();
  }, 30_000).unref();

  startSensorLoop(async sample => {
    db.data.samples.push(sample);
    prune();
    await db.write();
  });
};

const fastify = Fastify({logger: false});

fastify.get('/api/data', async (_req, reply) => {
  prune();
  return reply.send({historyMs: HISTORY_MS, samples: db.data.samples});
});

fastify.get('/', async (_req, reply) => {
  prune();
  const html = renderHTML(db.data.samples, HISTORY_MS);
  reply.type('text/html').send(html);
});

start()
  .then(() => {
    fastify
      .listen({port: PORT, host: '0.0.0.0'})
      .then(() => {
        console.log(`listening on http://0.0.0.0:${PORT}`);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  })
  .catch(e => {
    console.error('startup error:', e);
    process.exit(1);
  });
