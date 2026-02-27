# Secure Environment Setup

## 1. Create Local Environment File

```bash
cp backend/.env.example backend/.env.development
```

## 2. Populate Credentials Securely

- Retrieve credentials only from approved secret stores:
  - Cloud secret manager
  - GitHub environment/repository secrets
  - Internal password manager
- Do not request or share credentials in chat, email, tickets, or commits.
- Store `service-account.json` only in local secure storage at `backend/service-account.json` if required for local development.

## 3. Install Secret-Scanning Pre-Commit Hook

```bash
python3 -m pip install --user pre-commit
pre-commit install
pre-commit run --all-files
```

## 4. Security Operating Rules

- Never commit `.env` files or private keys.
- Rotate credentials immediately if accidental exposure is suspected.
- Use unique credentials per environment (development, test, production).
- Restrict credentials by least privilege and short expiration where supported.
- Keep all sensitive values in secret managers, not in repository files.

