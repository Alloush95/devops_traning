import mysql from 'mysql2/promise';
import config from '../config';

let db: mysql.Connection | null = null;

// Create a connection pool
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Execute a query
 * @param query
 */
export const executeQuery = async (query: string): Promise<any> => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query);
    return results;
  } catch (err) {
    throw err;
  } finally {
    connection.release(); // Ensure the connection is released back to the pool
  }
};
