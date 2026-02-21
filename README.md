# Learn With Hamster

A learning management platform built with **JHipster 8.11.0** as a microservices monorepo. Browse disciplines, courses, and lessons in a Udemy-style interface.

This is a modernized rebuild of the [Electronic Armory "Armory" project](https://github.com/ElectronicArmory/Armory) by Mike Ziray, upgraded from JHipster 4.x to 8.11.0 with Angular 19, Consul service discovery, and Maven.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Gateway (port 8081)                                │
│  Angular 19 SPA + Spring Cloud Gateway (WebFlux)    │
│  User management, JWT auth, reactive (R2DBC)        │
├─────────────────────────────────────────────────────┤
│              Consul (service discovery)             │
├─────────────────────────────────────────────────────┤
│  Service (port 8080)                                │
│  Domain entities: Discipline, Program, Course,      │
│  Lesson, Resource, UserLessonProgress               │
│  Spring MVC, JPA/Hibernate, Elasticsearch           │
└─────────────────────────────────────────────────────┘
```

### Domain Model

```
Discipline ──ManyToMany──> Program ──ManyToMany──> Course ──ManyToMany──> Lesson
    │                        │                       │                      │
    └───OneToMany──> Resource (each level can have attached resources)
```

- **Disciplines** - Top-level learning areas (e.g., Sport, Music, Technology)
- **Programs** - Groupings within a discipline (e.g., Cycling, Swimming)
- **Courses** - Individual courses with level and pricing (e.g., Trackstand Mastery)
- **Lessons** - Content units with language support
- **Resources** - Attachments (VIDEO, IMAGE, TUTORIAL, PAGE, PARTIAL, TOOL)
- **UserLessonProgress** - Tracks which lessons a user has visited (per course)

## Prerequisites

- Java 17+ (JDK 17, 21, or 24)
- Node.js >= 22.15.0
- Docker & Docker Compose
- Maven 3.2.5+

## Quick Start

### 1. Start Infrastructure

```bash
docker compose up -d
```

This starts Consul, two MySQL instances (gateway on 3306, service on 3307), and Elasticsearch.

### 2. Start the Service Module

```bash
cd service
./mvnw
```

Runs on port 8080 with H2 in-memory database (dev profile). Sample data is loaded automatically.

### 3. Start the Gateway

```bash
cd gateway
./mvnw
```

Runs on port 8081. The Angular frontend is built and served by Spring Boot.

For frontend development with hot reload:

```bash
cd gateway
npm start
```

This starts the Angular dev server on port 4200 with HMR, proxying API calls to port 8081.

### 4. Open the App

- **Application**: http://localhost:8081 (or http://localhost:4200 for dev server)
- **Default accounts**:
  - Admin: `admin` / `admin`
  - User: `user` / `user`

## Screen Flows

### Public (no login required on Angular side)

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero section and feature highlights |
| `/catalog` | Browse all disciplines with course counts |
| `/catalog/discipline/:id` | Discipline detail with courses and resources |
| `/catalog/course/:id` | Course detail with expandable lesson curriculum |
| `/catalog/lesson/:id` | Lesson viewer with resources, notes, bookmarks, and progress |

> **Note**: API calls require authentication. Browse pages show a login prompt for anonymous users and load data for authenticated users.

### Authenticated

| Route | Description |
|-------|-------------|
| `/my-learning` | Personal dashboard: in-progress and completed courses, bookmarked lessons |
| `/cart` | Shopping cart with item list and checkout link |
| `/checkout` | Order summary, billing info, place order |
| `/order-confirmation` | Success message with link to My Learning |
| `/account/settings` | Profile settings |

**Lesson Progress Tracking**: When a logged-in user views a lesson within a course, their visit is automatically recorded server-side. The course sidebar shows a progress bar and green checkmarks next to completed lessons. Progress persists across sessions.

**Interactive Lesson Features**:
- **⌨️ Keyboard Navigation** — `←` `→` arrow keys move between lessons (inactive when typing in notes)
- **📝 My Notes** — Per-lesson textarea, auto-saved to localStorage
- **⏱ Reading Time** — Estimated from word count + video resources, shown as a badge
- **🔖 Bookmarks** — Bookmark any lesson; bookmarked lessons appear in My Learning dashboard
- **🎓 TUTORIAL Resources** — Rendered as a dedicated step-by-step card with a Start Tutorial CTA
- **Smart Action Buttons** — Watch Video / Launch Tool / Start Tutorial / View Image (context-aware)

**Shopping Cart**: Priced courses show "Add to Cart" instead of "Enroll Now". Items are stored in localStorage with a reactive signal-based service. The navbar displays a cart icon with a badge count. Checkout enrolls all cart items via the enrollment API. Free courses bypass the cart entirely.

**My Learning Dashboard**:
- Stats row showing enrolled / in-progress / completed / bookmarked counts
- Courses split into **Continue Learning** (in-progress) and **Completed** (with gold trophy accent) sections
- **Bookmarked Lessons** section with direct links to bookmarked lesson pages

### Admin Only (ROLE_ADMIN)

| Route | Description |
|-------|-------------|
| `/discipline` | CRUD management for disciplines |
| `/program` | CRUD management for programs |
| `/course` | CRUD management for courses |
| `/lesson` | CRUD management for lessons |
| `/resource` | CRUD management for resources |
| `/admin/*` | User management, metrics, health, logs |

## Sample Data

The dev profile includes sample data demonstrating the full hierarchy (6 courses, 37 lessons, 39 resources):

```
Sport (free)
├── Cycling
│   ├── Trackstand Mastery (free, Beginner) — 7 lessons
│   │   ├── What Is a Trackstand?
│   │   ├── Bike Setup for Balance Training
│   │   ├── Finding Your Balance Point
│   │   ├── The Rocking Technique
│   │   ├── Steering Corrections and Weight Shifts
│   │   ├── One-Minute Trackstand Challenge
│   │   └── Trackstands on Different Terrain
│   └── Road Cycling Fundamentals ($19, Novice) — 4 lessons
└── Swimming
    └── Introduction to Freestyle Swimming ($29, Beginner) — 3 lessons

Music ($49)
└── Guitar Fundamentals
    └── Acoustic Guitar for Beginners ($25, Novice) — 5 lessons

Technology ($99)
└── Web Development
    ├── HTML, CSS & JavaScript Essentials ($49, Beginner) — 5 lessons
    └── Building Full Stack Apps with JHipster (free, Intermediate) — 12 lessons
        ├── Why JHipster? Architecture and Stack Overview
        ├── Designing Your Domain Model with JDL
        ├── Interactive: Generate Your JHipster App from Scratch ← TUTORIAL resource
        ├── Exploring the Generated Project Structure
        ├── Entities, DTOs, and the MapStruct Mapper Chain
        ├── Customizing Angular: Browse Module and SCSS Theming
        ├── Service Discovery with Consul
        ├── Database Migrations with Liquibase
        ├── Security: JWT, HttpOnly Cookies, and CSP Headers
        ├── Running the Full Stack with Docker Compose
        ├── Testing: Unit, Integration, and End-to-End
        └── Building for Production and Deploying
```

Resources include YouTube videos, JHipster official docs, JDL Studio, and direct links to this project's GitHub repository (browse module, docker-compose.yml, Liquibase master.xml).

To reset sample data, delete the H2 database and restart:

```bash
cd service
./mvnw clean spring-boot:run
```

## Testing

```bash
# Gateway backend
cd gateway
./mvnw verify                              # unit + integration tests
./mvnw test                                # unit tests only

# Gateway frontend
cd gateway
npm test                                   # Jest + lint
npm run jest                               # Jest only
npm run e2e                                # Cypress e2e

# Service backend
cd service
./mvnw verify                              # unit + integration tests
./mvnw test                                # unit tests only
```

Integration tests use Testcontainers (requires Docker).

### Frontend Test Coverage

| File | Tests |
|------|-------|
| `bookmark.service.spec.ts` | localStorage persistence, toggle, multi-bookmark, corrupt data recovery |
| `lesson-browse.component.spec.ts` | auth state, notes (save/persist/overwrite), reading time, bookmarks, keyboard nav (ArrowLeft/Right, edge cases, input guard), resource action labels |
| `my-learning.component.spec.ts` | enrollments, in-progress/completed computed split, bookmark loading, null-body resilience |
| `catalog.component.spec.ts` | create, auth state |
| `course-browse.component.spec.ts` | create, auth state |

## Project Structure

```
Learn-With-Hamster-App/
├── gateway/                          # API Gateway + Angular frontend
│   └── src/main/webapp/
│       ├── app/
│       │   ├── browse/               # Public catalog browsing
│       │   │   ├── bookmark.service.ts  # Signal-based localStorage bookmark manager
│       │   │   ├── catalog/          # Discipline grid
│       │   │   ├── discipline/       # Discipline detail
│       │   │   ├── course/           # Course detail + curriculum + trophy
│       │   │   └── lesson/           # Lesson viewer + notes + keyboard nav + bookmarks
│       │   ├── my-learning/          # Authenticated dashboard (stats, bookmarks, completed)
│       │   ├── cart/                 # Shopping cart, checkout, confirmation
│       │   ├── entities/             # Admin CRUD + user-lesson-progress service
│       │   ├── home/                 # Landing page
│       │   ├── layouts/navbar/       # Navigation bar
│       │   └── config/              # Icons, routes, authority
│       └── i18n/                     # Translations (en, ar-ly)
├── service/                          # Microservice (domain entities)
│   └── src/main/resources/config/liquibase/
│       ├── fake-data/                # Sample CSVs (dev profile)
│       └── changelog/                # Migration scripts
├── docker/                           # Docker configs
│   └── central-server-config/        # Shared Consul config (JWT)
├── docker-compose.yml                # Infrastructure services
├── app.jdl                           # Master JDL definitions
└── CLAUDE.md                         # AI assistant context
```

## Key Configuration

| File | Purpose |
|------|---------|
| `app.jdl` | Master JDL with app + entity definitions |
| `docker-compose.yml` | Consul, MySQL x2, Elasticsearch |
| `docker/central-server-config/application.yml` | Shared JWT secret |
| `gateway/src/main/webapp/app/app.routes.ts` | Angular route definitions |
| `gateway/src/main/webapp/app/browse/browse.routes.ts` | Catalog browse routes |
| `service/src/main/resources/config/liquibase/master.xml` | Liquibase migrations |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, Bootstrap 5, FontAwesome, ngx-translate |
| Gateway | Spring Boot 3, Spring Cloud Gateway, WebFlux, R2DBC |
| Service | Spring Boot 3, Spring MVC, JPA/Hibernate, Elasticsearch |
| Database | MySQL (prod), H2 (dev) |
| Cache | Hazelcast (service) |
| Discovery | Consul |
| Auth | JWT (shared secret), HttpOnly cookie |
| Build | Maven, webpack |
| Testing | Jest, Cypress, JUnit 5, Testcontainers |

## Swim Lane Diagrams

Detailed flow diagrams showing every class and component touched per use case. Open in [draw.io](https://app.diagrams.net/) or any `.drawio`-compatible editor. Each diagram uses 4 swim lanes (Browser, Angular, Gateway, Service) to trace the full request lifecycle.

| # | File | Use Case | Key Steps |
|---|------|----------|-----------|
| 1 | [`01-app-bootstrap.drawio`](docs/diagrams/01-app-bootstrap.drawio) | App Bootstrap | `index.html` → `main.ts` → `bootstrap.ts` → `AppComponent` → `MainComponent.ngOnInit()` → `GET /api/account` → `NavbarComponent` → route component |
| 2 | [`02-login-flow.drawio`](docs/diagrams/02-login-flow.drawio) | Login Flow | Guarded route → `UserRouteAccessService` → store URL → `LoginComponent` → `POST /api/authenticate` → `DomainUserDetailsService` → BCrypt → JWT creation (HS512) → store token → `GET /api/account` → redirect to stored URL |
| 3 | [`03-browse-catalog.drawio`](docs/diagrams/03-browse-catalog.drawio) | Browse Catalog | Auth check → `disciplineService.query()` → Gateway JWT relay → `DisciplineResource` → `courseService.query()` → client-side cross-reference (program ID matching) → render discipline card grid |
| 4 | [`04-view-discipline.drawio`](docs/diagrams/04-view-discipline.drawio) | View Discipline | 3 parallel API calls: discipline detail + all courses + all resources → filter courses by shared program IDs → filter resources by `discipline.id` → render hero + course cards + resource list |
| 5 | [`05-view-course.drawio`](docs/diagrams/05-view-course.drawio) | View Course | Course detail + lessons + resources → filter lessons by `course.lessons` IDs → expandable curriculum with `Set<number>` toggle → lesson links to `/catalog/lesson/:id` |
| 6 | [`06-view-lesson.drawio`](docs/diagrams/06-view-lesson.drawio) | View Lesson | Lesson detail + resources → filter by `resource.lesson.id` → sort by `resourceWeight` → render with type-specific UI (VIDEO embed / TUTORIAL card / TOOL launch) + notes + bookmark + keyboard nav → auto-record progress via `POST /api/user-lesson-progress/mark` → sidebar shows checkmarks + progress bar |
| 7 | [`07-my-learning.drawio`](docs/diagrams/07-my-learning.drawio) | My Learning | `UserRouteAccessService` guard → redirect to login if anonymous → `AccountService.trackCurrentAccount()` signal → load enrollments + progress → split into in-progress/completed → load bookmarked lessons from `BookmarkService` |
| 8 | [`08-admin-crud.drawio`](docs/diagrams/08-admin-crud.drawio) | Admin CRUD | `ROLE_ADMIN` guard → List (paginated table) → Create (`POST` + MySQL + Elasticsearch index) → Delete (confirmation modal + MySQL + ES remove) → Search (Elasticsearch full-text) |
| 9 | [`09-jwt-relay.drawio`](docs/diagrams/09-jwt-relay.drawio) | JWT Relay Mechanism | Consul shared secret distribution → `AuthInterceptor` adds Bearer token → Gateway `SecurityWebFilterChain` validates → `JWTRelayGatewayFilterFactory` forwards → `StripPrefix=2` → Service validates same secret → error handling (401 → `AuthExpiredInterceptor`) |

## Credits

Based on the [Armory project](https://github.com/ElectronicArmory/Armory) by [Mike Ziray / Electronic Armory](https://www.youtube.com/@ElectronicArmory). Original tutorial series: [YouTube playlist](https://www.youtube.com/watch?v=3zrQIPwEuOs).
