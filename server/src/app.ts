import cors from 'cors';
import express from 'express';
import { config } from './config';

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});