# Emergency Credential Rotation Procedure

## Compromised Credentials Inventory

The following secret-bearing entries were exposed and must be treated as compromised:

- Database:
  - `DATABASE_URL` (development, test, production)
- Auth and signing:
  - `JWT_SECRET`
  - `CRED_ENC_KEY`
- Email and messaging:
  - `SMTP_USER`
  - `SMTP_PASS`
  - `MAILGUN_API_KEY`
  - `MAILGUN_DOMAIN`
  - `MAILGUN_FROM`
- AI and API integrations:
  - `GROQ_API_KEY`
- OAuth and scheduling integrations:
  - `ZOOM_ACCOUNT_ID`
  - `ZOOM_CLIENT_ID`
  - `ZOOM_CLIENT_SECRET`
  - `ZOOM_SECRET_TOKEN`
  - `GOOGLE_CALENDAR_ID`
- Cloud and access configuration:
  - `AWS_ACCESS_KEY_ID` (commented but exposed)
  - `AWS_SECRET_ACCESS_KEY` (commented but exposed)
  - `AWS_ASSUME_ROLE_ARN`
  - `AWS_REGION`
  - `AWS_BILLING_REGION`
  - `AWS_ASSUME_ROLE_SESSION_NAME`
- Firebase/GCP service account (`backend/service-account.json`):
  - `private_key`
  - `private_key_id`
  - `client_email`
  - `client_id`
  - all associated service-account metadata in that JSON

## Mandatory Rotation Checklist

- [ ] Freeze deployments until this checklist is complete.
- [ ] Revoke and recreate all database users/passwords for dev/test/prod.
- [ ] Rotate JWT signing secret and invalidate active refresh/session tokens.
- [ ] Rotate SMTP credentials (app password / provider credential).
- [ ] Rotate Mailgun API key and validate sending domain settings.
- [ ] Rotate Groq API key and remove old key from provider console.
- [ ] Rotate Zoom OAuth client secret and webhook/verification tokens.
- [ ] Rotate Google Calendar / OAuth-linked secrets and revoke old client credentials.
- [ ] Revoke AWS IAM access keys that appeared in files, even if commented out.
- [ ] Rotate `CRED_ENC_KEY` and re-encrypt stored encrypted cloud credentials.
- [ ] Disable and replace exposed GCP/Firebase service account key, then create a new key only if required.
- [ ] Audit all third-party integrations for token use and issue new tokens where possible.
- [ ] Confirm old credentials are unusable by direct validation tests.

## Rotation Execution Steps

1. Stop external access paths that can consume leaked credentials.
2. Rotate production credentials first, then test, then development.
3. Update secrets in the secret manager (`GitHub Actions Secrets`, cloud secret manager, deployment platform secrets).
4. Redeploy backend services after each credential set rotation.
5. Invalidate user/API sessions dependent on rotated signing/auth material.
6. Re-encrypt persisted credentials after `CRED_ENC_KEY` rotation.
7. Replace service-account file locally from secure key delivery, never from git.
8. Run integration smoke tests after each rotation batch.
9. Record rotation date/time, operator, and impacted systems in incident notes.

## Git History Purge Commands (git-filter-repo)

```bash
# 1) Ensure a clean working state before rewriting history
git status

# 2) Install git-filter-repo (preferred history rewrite tool)
python3 -m pip install --user git-filter-repo

# 3) Remove sensitive files from index now (keeps local files on disk)
git rm --cached --ignore-unmatch backend/.env.development backend/.env.test backend/.env.production backend/service-account.json
git add .gitignore backend/.env.example .pre-commit-config.yaml .gitleaks.toml .github/workflows/secret-scan.yml SECURITY_ROTATION.md SETUP.md SECURITY_CLEANUP_CHECKLIST.md
git commit -m "security: remove secret files from tracking and add secret scanning controls"

# 4) Rewrite all history to purge sensitive paths
git filter-repo --force \
  --invert-paths \
  --path backend/.env.development \
  --path backend/.env.test \
  --path backend/.env.production \
  --path backend/service-account.json

# 5) Expire reflogs and aggressively garbage collect orphaned secret blobs
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6) Verify files are gone from history and object graph
git log --all -- backend/.env.development
git log --all -- backend/.env.test
git log --all -- backend/.env.production
git log --all -- backend/service-account.json
git rev-list --objects --all | grep 'backend/.env.development'
git rev-list --objects --all | grep 'backend/.env.test'
git rev-list --objects --all | grep 'backend/.env.production'
git rev-list --objects --all | grep 'backend/service-account.json'

# 7) Force-push rewritten history (coordinate a freeze window first)
git push origin --force --all
git push origin --force --tags
```

## Fallback Purge Commands (BFG Repo-Cleaner)

```bash
# 1) Mirror clone for BFG usage
REMOTE_URL="$(git remote get-url origin)"
git clone --mirror "$REMOTE_URL" repo-mirror.git
cd repo-mirror.git
curl -L -o bfg.jar https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# 2) Delete sensitive file history
java -jar bfg.jar --delete-files .env.development --delete-files .env.test --delete-files .env.production --delete-files service-account.json

# 3) Final cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4) Verification
git log --all -- backend/.env.development
git rev-list --objects --all | grep 'backend/.env.development'

# 5) Force push rewritten mirror
git push --force --all
git push --force --tags
```

## Post-Purge Team Recovery

```bash
# Each engineer must run a fresh clone after force-push
REMOTE_URL="$(git remote get-url origin)"
cd ..
mv master-01 master-01_pre_purge_backup
git clone "$REMOTE_URL" master-01
cd master-01
```
