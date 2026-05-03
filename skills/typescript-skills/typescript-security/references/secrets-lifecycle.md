# Secrets Lifecycle

Keep these steps separate when possible:
- declare the secret source in config
- parse the config
- fetch the secret
- use the secret in the narrowest scope possible
- redact it in errors and logs
