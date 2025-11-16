declare namespace Express {
  export interface Request {
    id?: string; // random uuid given to each request.
  }
}
