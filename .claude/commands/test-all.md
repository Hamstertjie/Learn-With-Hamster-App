# Run All Tests

Run the complete test suite: frontend Jest tests + backend unit tests for both modules.

## What this does

Runs in sequence:

1. **Frontend unit tests** (no Docker needed)
   ```bash
   cd gateway && npm run jest
   ```

2. **Gateway backend unit tests**
   ```bash
   cd gateway && ./mvnw test
   ```

3. **Service backend unit tests**
   ```bash
   cd service && ./mvnw test
   ```

4. **Integration tests** (requires Docker — ask user first)
   ```bash
   cd service && ./mvnw verify
   cd gateway && ./mvnw verify
   ```

## Quick smoke test (recommended before committing)

Run only the fast frontend + unit tests, skip integration tests:
```bash
cd gateway && npm run jest && ./mvnw test
cd service && ./mvnw test
```

## Summary to report

After each step, report:
- ✅ PASS — number of tests
- ❌ FAIL — which test(s) and why

Fix any failures before creating a commit or PR.

## Test coverage targets
- Frontend: aim for >70% statement coverage on `app/home/`, `app/browse/`
- Backend: all new endpoints (XP, enrollment, progress) should have IT coverage
