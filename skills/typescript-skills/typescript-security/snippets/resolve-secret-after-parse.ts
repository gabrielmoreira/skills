export async function loadSecurityDependencies(config: { dbSecretArn: string }) {
  const secret = await secretsManager.getSecretValue({ SecretId: config.dbSecretArn });
  if (!secret.SecretString) throw new Error('DB secret is missing SecretString');

  return {
    dbPassword: secret.SecretString,
  };
}
