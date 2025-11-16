import express from 'express';
import { routes } from './routers/main';
import config from './config';
import generateRequestId from './middlewares/generateRequestId';
const app = express();

app.use(express.json({ limit: config.jsonBodyMaxSize }));
app.use(generateRequestId); // generate a request id
app.use(routes());

export default app;
