# Run Backend Tests

Run Spring Boot unit and integration tests for the service or gateway modules.

## Usage
```
/test-backend [module] [pattern]
```

- `module`: `service` (default) or `gateway`
- `pattern` (optional): test class name to run a single test

## Commands

### Unit tests only (fast, no Docker needed)
```bash
cd service && ./mvnw test
cd gateway && ./mvnw test
```

### Full test suite including integration tests (requires Docker)
```bash
cd service && ./mvnw verify
cd gateway && ./mvnw verify
```

### Single integration test
```bash
cd service && ./mvnw verify -Dit.test=CourseResourceIT
cd gateway && ./mvnw verify -Dit.test=AccountResourceIT
```

## Key test classes

### Service module (`service/src/test/`)
- `web/rest/CourseResourceIT` — Course CRUD API
- `web/rest/LessonResourceIT` — Lesson CRUD API
- `web/rest/UserLessonProgressResourceIT` — Progress tracking + XP endpoints
- `web/rest/UserCourseEnrollmentResourceIT` — Enrollment endpoints
- `domain/` — Entity unit tests (validators, equals, hashCode)
- `service/` — Service implementation tests

### Gateway module (`gateway/src/test/`)
- `web/rest/AccountResourceIT` — Account management API
- `web/rest/UserJWTControllerIT` — JWT authentication

## Integration test requirements
- Docker must be running (Testcontainers starts MySQL + Elasticsearch)
- Run `docker compose up -d` first if not already up
- Tests tagged `@IntegrationTest` require live containers

## After running

Report:
- BUILD SUCCESS or BUILD FAILURE
- Which tests failed and the error message
- Fix failures before committing
