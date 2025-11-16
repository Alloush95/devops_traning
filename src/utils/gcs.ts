import { Storage } from '@google-cloud/storage';
import { deleteFile, getCurrentProjectId } from './helpers';
import logger from './logger';

export type DownloadResult = { ok: true; path: string } | { ok: false; error: Error };
export type UploadResult = { ok: true; gcsPath: string } | { ok: false; error: Error };
export type Result = { ok: true } | { ok: false; error: Error };

/**
 * @remarks
 * download a file from gcp bucket
 * @param downloadToPath the destination where the file is going to be downloaded
 * @param filePathInBucket name of the file (including folders if any) to be downloaded  example: file.txt or folder/file.txt
 * @param bucketName the bucketName
 * @param requestId the requestId is used for logging,tracing and debugging purposes.
 * @param projectId the projectId is an optional attribute, if not provided the function will automatically detect the current environment projectId and use it.
 *
 * @returns {Promise<DownloadResult>}
 * */
export const downloadFileFromBucket = async (
  downloadToPath: string,
  bucketName: string,
  filePathInBucket: string,
  requestId: string,
  projectId: string = '',
): Promise<DownloadResult> => {
  try {
    if (!downloadToPath || !bucketName || !filePathInBucket) {
      logger.error('downloadToPath,bucketName and filePathInBucket are required', { requestId });
      return {
        ok: false,
        error: new Error('downloadToPath,bucketName and filePathInBucket are required'),
      };
    } else {
      logger.info(`downloading file from bucket.`, { fileName: filePathInBucket, requestId });
      if (!projectId) {
        projectId = await getCurrentProjectId();
      }
      const storage = new Storage({
        projectId,
      });
      const options = {
        destination: downloadToPath,
      };

      // Downloads the file
      await storage.bucket(bucketName).file(filePathInBucket).download(options);
      logger.info(`gs://${bucketName}/${filePathInBucket} downloaded to ${downloadToPath}.`, {
        fileName: filePathInBucket,
        requestId,
      });

      return { ok: true, path: downloadToPath };
    }
  } catch (error: unknown) {
    // delete empty file in case of failure
    deleteFile(downloadToPath);
    logger.error('error while downloading the file', {
      error,
      requestId,
    });
    return { ok: false, error: error as Error };
  }
};

/**
 * @remarks
 * upload a file to a gcp bucket
 * @param localPath the source of the file that will be uploaded
 * @param filePathInBucket name of the file (including folders if any) to be uploaded  example: file.txt or folder/file.txt
 * @param bucketName the bucketName
 * @param requestId the requestId is used for logging,tracing and debugging purposes.
 * @param projectId the projectId is an optional attribute, if not provided the function will automatically detect the current environment projectId and use it.
 *
 * @returns {Promise<UploadResult>}
 * */
export const uploadFileToBucket = async (
  localPath: string,
  bucketName: string,
  filePathInBucket: string,
  requestId: string,
  projectId: string = '',
): Promise<UploadResult> => {
  try {
    if (!localPath || !bucketName || !filePathInBucket) {
      logger.error('localPath,bucketName and filePathInBucket are required', { requestId });
      return {
        ok: false,
        error: new Error('localPath,bucketName and filePathInBucket are required'),
      };
    } else {
      logger.info(`uploading file to bucket.`, { fileName: filePathInBucket, requestId });

      if (!projectId) {
        projectId = await getCurrentProjectId();
      }
      const storage = new Storage({
        projectId,
      });

      const options = {
        destination: filePathInBucket,
      };
      // Upload the file
      await storage.bucket(bucketName).upload(localPath, options);
      logger.info(`${filePathInBucket} uploaded to gs://${bucketName}/${filePathInBucket} .`, {
        requestId,
      });

      return { ok: true, gcsPath: `gs://${bucketName}/${filePathInBucket}` };
    }
  } catch (error: unknown) {
    logger.error('error while uploading the file', {
      error,
      requestId,
    });
    return { ok: false, error: error as Error };
  }
};

/**
 * @remarks
 * delete a file from a gcp bucket
 *
 * @param filePath name of the file (including folders if any) to be deleted  example: file.txt or folder/file.txt
 * @param bucketName the bucketName
 * @param requestId the requestId is used for logging,tracing and debugging purposes.
 * @param projectId the projectId is an optional attribute, if not provided the function will automatically detect the current environment projectId and use it.
 *
 * @returns {Promise<Result>}
 * */
export const deleteFileFromBucket = async (
  filePath: string,
  bucketName: string,
  requestId: string,
  projectId: string = '',
): Promise<Result> => {
  try {
    logger.info(`deleting ${filePath} from ${bucketName}`, { requestId });

    if (!projectId) {
      projectId = await getCurrentProjectId();
    }
    const storage = new Storage({
      projectId,
    });
    // delete file from  bucket
    await storage.bucket(bucketName).file(filePath).delete();
    return { ok: true };
  } catch (error: unknown) {
    logger.error('error while deleting the file', {
      error,
      requestId,
    });
    return { ok: false, error: error as Error };
  }
};

/**
 * @remarks
 * check if a file exists in the given folder/bucket
 *
 * @param filePath name of the file (including folders if any) to be deleted  example: file.txt or folder/file.txt
 * @param bucketName the bucketName
 * @param requestId the requestId is used for logging,tracing and debugging purposes.
 * @param projectId the projectId is an optional attribute, if not provided the function will automatically detect the current environment projectId and use it.
 *
 * @returns {Promise<Result>}
 */
export const checkIfFileExistsInBucket = async (
  filePath: string,
  bucketName: string,
  requestId: string,
  projectId: string = '',
): Promise<Result> => {
  try {
    if (!projectId) {
      projectId = await getCurrentProjectId();
    }
    const storage = new Storage({
      projectId,
    });
    const bucketObject = storage.bucket(bucketName);

    const fileInBucket = bucketObject.file(filePath);

    const fileExists = await fileInBucket.exists();
    if (fileExists[0]) {
      return { ok: true };
    } else {
      return { ok: false, error: new Error('File does not exist') };
    }
  } catch (error: unknown) {
    logger.error('error while checking if the  file exists', {
      error,
      requestId,
    });
    return { ok: false, error: error as Error };
  }
};
