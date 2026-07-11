import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import consentRouter from './routes/consent.js';
import compatibilityRouter from './routes/compatibility.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'litmo-backend' }));
// consentRouter's /overlap is the deprecated Chapter 1/2 POC route, kept only for
// compatibility until no client depends on it (docs/KNOWN_LIMITATIONS.md). New work
// must use compatibilityRouter, the canonical Chapter 3 engine.
app.use('/api/consent', consentRouter);
app.use('/api/consent', compatibilityRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Litmo API listening on ${port}`));
