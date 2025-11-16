import 'source-map-support/register';
import app from './app';
import config from './config';

const port = config.serverPort;
const server = app.listen(port, () => {
  console.log(`app running: listening on port ${port}`);
});

// change default request timeout to 10 minutes
server.timeout = config.timeout;
