import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import consentRouter from './routes/consent.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'litmo-backend' }));
app.use('/api/consent', consentRouter);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`Litmo API listening on ${port}`));
