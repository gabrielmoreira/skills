import fs from 'node:fs/promises';

type VerifyResourcesDependencies = {
  assertSecretExists: (arn: string) => Promise<void>;
};

export async function verifyResources(
  { secretArn, tlsCertPath }: { secretArn: string; tlsCertPath: string },
  { assertSecretExists }: VerifyResourcesDependencies,
 ) {
  await assertSecretExists(secretArn);
  await fs.access(tlsCertPath);
}
