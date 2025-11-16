import r from 'express';
const router = r.Router();
import demo from './demo';

export const routes = () => {
  router.use(demo);
  return router;
};
