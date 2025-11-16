import { APP_NAME, DEFAULT_PROJECT, JSON_BODY_MAX_SIZE, PORT, TIMEOUT } from '../utils/constants';
import status from 'statuses';

const config: any = () => {
  return {
    appName: process.env.APP_NAME || APP_NAME,
    serverPort: process.env.PORT || PORT,
    projectId: process.env.PROJECT_ID || DEFAULT_PROJECT,
    timeout: TIMEOUT,
    jsonBodyMaxSize: JSON_BODY_MAX_SIZE,
    status: status,
    bucketName: process.env.BUCKET_NAME,
    secretName: process.env.SECRET_NAME,
    environment: process.env.ENVIRONMENT || 'local',
    database: {
      host: 'localhost',
      user: 'root',
      password: '',
      name: 'db',
    },
  };
};

export default config();
