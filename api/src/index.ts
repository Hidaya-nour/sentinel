import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', msg: `api listening on ${PORT}` }));
});
