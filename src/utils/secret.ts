import config from './../config';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Result } from './result';

const client = new SecretManagerServiceClient();

const storage = new Map();

export const getSecret = async (secretName: string): Promise<Result<string, Error>> => {
  const cachedSecretValue = storage.get(secretName);
  if (cachedSecretValue) return { ok: true, value: cachedSecretValue };

  const secretPath = `projects/${config.projectId}/secrets/${secretName}`;
  const latestSecretPath = `${secretPath}/versions/latest`;

  try {
    const latestSecretVersion = await client
      .accessSecretVersion({ name: latestSecretPath })
      .then((version) => version[0]?.payload?.data?.toString() ?? '');

    storage.set(secretName, latestSecretVersion);
    return { ok: true, value: latestSecretVersion };
  } catch (e: any) {
    // Code 9 means the latest secret either Destroyed or Disabled
    if (e.code === 9) {
      const [allEnabledSecrets] = await client.listSecretVersions({
        parent: secretPath,
        filter: 'state=ENABLED',
      });

      if (allEnabledSecrets[0]) {
        const latestActiveVersion = allEnabledSecrets[0].name;
        const latestSecretVersion = await client
          .accessSecretVersion({ name: latestActiveVersion })
          .then((version) => version[0]?.payload?.data?.toString() ?? '');

        storage.set(secretName, latestSecretVersion);
        return { ok: true, value: latestSecretVersion };
      }
    }

    return { ok: false, error: e as Error };
  }
};
