import * as fs from 'fs';
import { GoogleAuth } from 'google-auth-library';

/**
 * @remarks
 * This function detects the google environment and  returns the current project_id
 *
 * @returns {string}
 */
export const getCurrentProjectId = async (): Promise<string> => {
  // Detect Google environment
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    return await auth.getProjectId();
  } catch (e: unknown) {
    throw new Error(`Error while detecting GCP environment: ${(e as Error).message}`);
  }
};


/**
 * Function to generate a random string
 * @param length
 */
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

/**
 * @remarks
 * Delete a file from the file system
 * @param filePath
 *
 */
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
