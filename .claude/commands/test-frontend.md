# Run Frontend Tests

Run Angular/Jest unit tests for the gateway frontend.

## Usage
```
/test-frontend [pattern]
```

- `pattern` (optional): file or describe-block name pattern to filter tests

## What this does

1. If a pattern is provided, runs only matching specs:
   ```bash
   cd gateway && npm run jest -- --testPathPattern="<pattern>" --passWithNoTests
   ```

2. Without a pattern, runs all frontend unit tests:
   ```bash
   cd gateway && npm run jest
   ```

3. To run with coverage report:
   ```bash
   cd gateway && npm run jest -- --coverage
   ```

## Key test files
- `app/home/home.component.spec.ts` — home dashboard (auth, book parallax, computed stats, ring geometry)
- `app/browse/lesson/lesson-browse.component.spec.ts` — lesson viewer (notes, bookmarks, reading time, keyboard nav, resource labels)
- `app/browse/catalog/catalog.component.spec.ts` — catalog browse
- `app/browse/course/course-browse.component.spec.ts` — course browse
- `app/browse/bookmark.service.spec.ts` — bookmark service

## After running

Report:
- Which suites PASS / FAIL
- Total tests passed/failed
- Coverage gaps (lines not covered) if `--coverage` flag used
- Fix any failures before committing
