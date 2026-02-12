# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learn With Hamster is a learning management platform built with JHipster 8.11.0 as a microservices monorepo. It consists of two deployable modules that communicate via Consul service discovery and share JWT authentication.

This project is a **modernized rebuild** of the [Electronic Armory "Armory" project](https://github.com/ElectronicArmory/Armory), an open-source learning management system originally built with JHipster 4.x. The Armory project (by Mike Ziray / Electronic Armory) used Gradle, Angular 2, and JHipster Registry. Learn With Hamster preserves the same domain model and microservices architecture but upgrades to:
- JHipster 4.x -> **JHipster 8.11.0**
- Gradle -> **Maven**
- Angular 2 -> **Angular 19**
- JHipster Registry -> **Consul**
- The Armory `armory/` service module maps to our **`service/`** module
- The Armory `gateway/` module maps to our **`gateway/`** module

The core concept is a hierarchical learning content system: **Disciplines** contain **Programs**, which contain **Courses**, which contain **Lessons**. Each level can have attached **Resources** (videos, images, tutorials, etc.). The platform supports pricing at the Discipline, Program, and Course levels, and multi-language lesson content.

## Architecture

### Module Layout

- **`gateway/`** - API Gateway + Angular 19 frontend (port 8081)
  - Reactive (WebFlux) Spring Boot application
  - Spring Cloud Gateway routes requests to microservices (`/services/service/**` -> service)
  - Owns user management (User, Authority entities)
  - R2DBC for database access (reactive)
  - Frontend served as SPA with `SpaWebFilter`

- **`service/`** - Microservice owning all learning domain entities (port 8080)
  - Traditional (non-reactive) Spring Boot application with Undertow
  - Owns: Discipline, Program, Course, Lesson, Resource
  - JPA/Hibernate for database access
  - Elasticsearch for search
  - Hazelcast for second-level cache
  - OpenFeign for inter-service calls

### Domain Model (defined in `app.jdl`)

```
Discipline --(ManyToMany)--> Program --(ManyToMany)--> Course --(ManyToMany)--> Lesson
    |                           |                         |                       |
    +---(OneToMany)---> Resource (each entity can have Resources)
```

Enums: `Level` (NOVICE..PROFESSIONAL), `ResourceType` (VIDEO, IMAGE, TUTORIAL, PAGE, PARTIAL, TOOL), `Language` (ENGLISH, SPANISH, HUNGARIAN, GERMAN)

### Code Patterns (service module)

All domain entities follow the same JHipster pattern:
- **Entity** (`domain/`) -> **DTO** (`service/dto/`) via **MapStruct Mapper** (`service/mapper/`)
- **Repository** (`repository/`) with `WithBagRelationships` for ManyToMany eager fetching
- **Search Repository** (`repository/search/`) for Elasticsearch
- **Service interface** (`service/`) -> **ServiceImpl** (`service/impl/`)
- **REST Resource** (`web/rest/`) with standard CRUD + search endpoints

### Infrastructure

- **Consul** - Service discovery and centralized config (`docker/central-server-config/application.yml` holds shared JWT secret)
- **MySQL** - Production database (gateway on port 3306, service on port 3307)
- **H2** - Dev database (file-based, `devDatabaseType: h2Disk`)
- **Elasticsearch** - Full-text search for service entities (port 9200)
- **Liquibase** - Database migrations (`src/main/resources/config/liquibase/`)

## Build & Run Commands

### Prerequisites
- Java 17 (JDK 17, 21, or 24 supported)
- Node.js >= 22.15.0
- Docker (for infrastructure services)
- Maven 3.2.5+

### Start Infrastructure
```bash
docker compose up -d                    # starts consul, both mysql instances, elasticsearch
```

### Gateway (from `gateway/` directory)
```bash
./mvnw                                  # build and run (default goal: spring-boot:run)
./mvnw -Dskip.installnodenpm -Dskip.npm # backend only, skip frontend build
npm start                               # Angular dev server with HMR (port 4200)
npm run build                           # production frontend build
```

### Service (from `service/` directory)
```bash
./mvnw                                  # build and run (default goal: spring-boot:run)
```

### Testing

**Gateway backend tests:**
```bash
cd gateway
./mvnw verify                           # unit + integration tests
./mvnw test                             # unit tests only (excludes *IT*, *IntTest*)
./mvnw verify -Dit.test=AccountResourceIT  # single integration test
```

**Service backend tests:**
```bash
cd service
./mvnw verify                           # unit + integration tests
./mvnw test                             # unit tests only
./mvnw verify -Dit.test=CourseResourceIT   # single integration test
```

**Gateway frontend tests:**
```bash
cd gateway
npm test                                # Angular tests (Jest) with lint
npm run jest                            # Jest only, no lint
npm run lint                            # ESLint
npm run e2e                             # Cypress e2e tests (headed)
```

Integration tests require Docker (Testcontainers for MySQL, Elasticsearch).

### Maven Profiles
- `dev` (default) - H2 database, dev tools
- `prod` - MySQL, production frontend build
- `api-docs` - Enable SpringDoc/OpenAPI
- `no-liquibase` - Skip database migrations
- `e2e` - End-to-end test packaging

### Linting & Formatting
```bash
cd gateway && npm run lint:fix          # ESLint + Prettier for frontend
./mvnw spotless:apply                   # Java formatting (either module)
./mvnw checkstyle:check                 # Checkstyle (nohttp check)
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `app.jdl` | Master JDL - full application + entity definitions |
| `docker-compose.yml` | Root infrastructure (Consul, MySQL x2, Elasticsearch) |
| `docker/central-server-config/application.yml` | Shared Consul config (JWT secret) |
| `gateway/.yo-rc.json` / `service/.yo-rc.json` | JHipster generator config |
| `{module}/src/main/resources/config/application*.yml` | Spring Boot config per profile |
| `{module}/src/main/resources/config/liquibase/master.xml` | Liquibase migration entrypoint |

## Important Notes

- Gateway is **reactive** (WebFlux/R2DBC), service is **non-reactive** (MVC/JPA) - do not mix reactive and blocking patterns within the same module
- JWT secret must match between gateway and service - it's centralized in `docker/central-server-config/application.yml`
- The gateway auto-discovers service routes via Consul - requests to `/services/service/**` are forwarded with JWT relay
- All DTOs use MapStruct; do not manually map between entities and DTOs
- i18n supports English (`en`) and Arabic-Libya (`ar-ly`)
