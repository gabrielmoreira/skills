export type DatabaseConfig = {
  credentialsSource: {
    kind: 'secrets-manager';
    secretArn: string;
  };
};
