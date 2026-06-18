# Project API and Functionality Guide

This document describes how the current AI-powered ticketing project works from an API, service, data, and migration perspective. It is intended to help future migration work by making the current runtime behavior explicit.

## 1. System Overview

The project is a Docker Compose based microservice application with four main runtime components:

| Component | Path | Technology | Responsibility |
| --- | --- | --- | --- |
| Frontend | `frontend/` | React 18, Axios | Ticket submission UI and ticket dashboard |
| Ticket Service | `ticket-service/` | Node.js, Express, Sequelize | Ticket CRUD API and PostgreSQL persistence |
| AI Service | `ai-service/` | Node.js, Express, Anthropic SDK, Nodemailer | RAG-based AI response generation, ticket status update, email notification |
| Database | Docker image | PostgreSQL 14 | Stores ticket records |

Default local ports through Docker Compose:

| Component | Container port | Host port | Base URL from host |
| --- | ---: | ---: | --- |
| Frontend | `3000` | `3000` | `http://localhost:3000` |
| Ticket Service | `5000` | `5001` | `http://localhost:5001` |
| AI Service | `6000` | `6001` | `http://localhost:6001` |
| PostgreSQL | `5432` | `5432` | `localhost:5432` |

High-level request flow:

1. User opens the React frontend.
2. User submits a ticket with title, description, and email.
3. Frontend creates the ticket through Ticket Service.
4. Frontend calls AI Service with the new ticket id plus title, description, and user email.
5. AI Service searches its in-memory knowledge base.
6. AI Service sends a Claude request using the matching knowledge base entries as context.
7. AI Service decides whether the ticket is `auto-resolved` or `escalated`.
8. AI Service updates the ticket through Ticket Service.
9. AI Service sends an email notification.
10. Dashboard reads ticket records from Ticket Service and refreshes every 30 seconds.

## 2. Runtime Configuration

### Docker Compose Environment

`docker-compose.yml` wires the services together with these key values:

| Service | Variable | Default/value in compose | Purpose |
| --- | --- | --- | --- |
| `postgres` | `POSTGRES_USER` | `postgres` | DB user |
| `postgres` | `POSTGRES_PASSWORD` | `password` | DB password |
| `postgres` | `POSTGRES_DB` | `ticketdb` | DB name |
| `ticket-service` | `DB_HOST` | `postgres` | Database hostname inside Compose network |
| `ticket-service` | `DB_USER` | `postgres` | Sequelize username |
| `ticket-service` | `DB_PASS` | `password` | Sequelize password |
| `ticket-service` | `DB_NAME` | `ticketdb` | Sequelize database name |
| `ai-service` | `ANTHROPIC_API_KEY` | from host env | Required for Claude calls |
| `ai-service` | `CLAUDE_MODEL` | `claude-sonnet-4-6` | Claude model name |
| `ai-service` | `SMTP_HOST` | from host env | SMTP host |
| `ai-service` | `SMTP_PORT` | from host env | SMTP port |
| `ai-service` | `SMTP_USER` | from host env | SMTP username and email sender |
| `ai-service` | `SMTP_PASS` | from host env | SMTP password/app password |
| `ai-service` | `TICKET_SERVICE_URL` | `http://ticket-service:5000` | Internal Ticket Service URL |
| `frontend` | `REACT_APP_TICKET_API_URL` | `http://localhost:5001` | Browser-facing Ticket Service URL |
| `frontend` | `REACT_APP_AI_API_URL` | `http://localhost:6001` | Browser-facing AI Service URL |

### Service Defaults Outside Docker

Ticket Service defaults:

| Variable | Default |
| --- | --- |
| `PORT` | `5000` |
| `DB_HOST` | `localhost` |
| `DB_USER` | `postgres` |
| `DB_PASS` | `password` |
| `DB_NAME` | `ticketdb` |

AI Service defaults:

| Variable | Default |
| --- | --- |
| `PORT` | `6000` |
| `TICKET_SERVICE_URL` | `http://localhost:5001` |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |

Important: `ANTHROPIC_API_KEY` is mandatory. If it is missing, `ai-service/src/server.js` logs an error and exits the process during startup.

## 3. Ticket Service

Source files:

| File | Purpose |
| --- | --- |
| `ticket-service/src/server.js` | Express app, CORS, JSON middleware, routes, DB startup |
| `ticket-service/src/routes/tickets.js` | Ticket CRUD routes |
| `ticket-service/src/models/index.js` | Sequelize connection and model registration |
| `ticket-service/src/models/ticket.js` | Ticket model definition |

### Middleware and CORS

Ticket Service enables:

- `cors` with allowed origins `http://localhost:3000` and `http://127.0.0.1:3000`
- `credentials: true`
- `express.json()`

All unhandled route errors go to a generic error handler:

```json
{
  "error": "Something went wrong!"
}
```

with HTTP status `500`.

### Database Startup

When run directly, the service:

1. Authenticates Sequelize connection.
2. Calls `sequelize.sync()`.
3. Starts Express on `0.0.0.0`.
4. If startup fails, waits 5 seconds and retries.

Migration note: there are no explicit migration files. Schema creation is currently handled by `sequelize.sync()`.

### Ticket Data Model

Model name: `Ticket`

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | yes | auto-increment | Primary key |
| `title` | string | yes | none | Ticket title |
| `description` | text | yes | none | Ticket detail |
| `status` | enum | no | `open` | Allowed values: `open`, `auto-resolved`, `resolved`, `in-progress`, `escalated` |
| `ai_response` | text | no | `null` | AI generated answer |
| `created_at` | date | no | current time | Explicitly declared snake_case field |
| `updated_at` | date | no | current time | Explicitly declared snake_case field |

Migration notes:

- The model declares `created_at` and `updated_at`, but does not configure Sequelize `timestamps`, `underscored`, or field mappings. Verify the actual generated table before migration because Sequelize may also manage default timestamp fields depending on configuration.
- No user email is stored in the ticket table. The frontend collects email only to pass it to AI Service for notification.
- There are no indexes beyond the primary key in the model definition.

## 4. Ticket Service APIs

Base URL from host: `http://localhost:5001`

Base path inside service: `/tickets`

### `GET /health`

Returns service health.

Response `200`:

```json
{
  "status": "healthy"
}
```

### `GET /tickets`

Returns all tickets sorted by `created_at` descending.

Response `200`:

```json
[
  {
    "id": 1,
    "title": "Password Reset Issue",
    "description": "I cannot reset my password",
    "status": "auto-resolved",
    "ai_response": "AI response text",
    "created_at": "2026-06-18T10:00:00.000Z",
    "updated_at": "2026-06-18T10:01:00.000Z"
  }
]
```

Error behavior:

- Database or unexpected errors return `500` with the generic error payload.

### `GET /tickets/:id`

Returns a single ticket by primary key.

Path parameters:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | integer-like string | yes | Ticket primary key |

Response `200`:

```json
{
  "id": 1,
  "title": "Password Reset Issue",
  "description": "I cannot reset my password",
  "status": "open",
  "ai_response": null,
  "created_at": "2026-06-18T10:00:00.000Z",
  "updated_at": "2026-06-18T10:00:00.000Z"
}
```

Response `404`:

```json
{
  "error": "Ticket not found"
}
```

### `POST /tickets`

Creates a new ticket.

Request body:

```json
{
  "title": "Password Reset Issue",
  "description": "I cannot reset my password"
}
```

Validation:

- `title` is required.
- `description` is required.
- Empty strings are treated as missing because the route uses truthiness checks.

Behavior:

- Creates ticket with `status: "open"`.
- Does not store email.
- Does not call AI Service. AI processing is triggered separately by the frontend.

Response `201`:

```json
{
  "id": 1,
  "title": "Password Reset Issue",
  "description": "I cannot reset my password",
  "status": "open",
  "ai_response": null,
  "created_at": "2026-06-18T10:00:00.000Z",
  "updated_at": "2026-06-18T10:00:00.000Z"
}
```

Response `400`:

```json
{
  "error": "Title and description are required"
}
```

### `PUT /tickets/:id`

Updates a ticket.

Request body supports partial updates:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "resolved",
  "ai_response": "Resolution text"
}
```

Behavior:

- Looks up the ticket by `id`.
- Missing fields keep existing values.
- The code uses `newValue || oldValue`, so empty strings, `null`, or other falsy values cannot be used to clear fields.
- Invalid `status` values are not manually validated in the route. They rely on Sequelize/PostgreSQL enum validation.

Response `200`:

```json
{
  "id": 1,
  "title": "Updated title",
  "description": "Updated description",
  "status": "resolved",
  "ai_response": "Resolution text",
  "created_at": "2026-06-18T10:00:00.000Z",
  "updated_at": "2026-06-18T10:05:00.000Z"
}
```

Response `404`:

```json
{
  "error": "Ticket not found"
}
```

### `DELETE /tickets/:id`

Deletes a ticket.

Behavior:

- Looks up ticket by `id`.
- Destroys the record if found.

Response `204`: empty body.

Response `404`:

```json
{
  "error": "Ticket not found"
}
```

## 5. AI Service

Source files:

| File | Purpose |
| --- | --- |
| `ai-service/src/server.js` | Express app, RAG engine implementation, Anthropic integration, endpoints |
| `ai-service/src/SmartRAGEngine.js` | Separate exported SmartRAGEngine used by tests |
| `ai-service/src/emailService.js` | Nodemailer setup and HTML email templates |

Important migration note: `server.js` defines a local `SmartRAGEngine` class instead of importing `ai-service/src/SmartRAGEngine.js`. These two implementations differ. The runtime implementation in `server.js` includes content relevance scoring and phrase extraction. The exported implementation in `SmartRAGEngine.js` is simpler and is what the SmartRAGEngine tests import.

### Middleware and CORS

AI Service enables:

- `cors` with allowed origins `http://localhost:3000` and `http://127.0.0.1:3000`
- `credentials: true`
- `express.json()`

### AI Provider

The service uses `@anthropic-ai/sdk`:

```js
anthropic.messages.create({
  model: CLAUDE_MODEL,
  max_tokens: 1000,
  temperature: 0.3,
  system: 'You are a helpful IT support assistant specializing in providing accurate, actionable solutions.',
  messages: [{ role: 'user', content: prompt }]
})
```

The response text is extracted from all content blocks where `block.type === "text"`, joined with newlines.

### Knowledge Base and RAG Behavior

Runtime knowledge base storage is in memory only.

At startup, `initializeKnowledgeBase()` adds three sample documents:

1. Password reset instructions.
2. Network connectivity troubleshooting.
3. Hardware request instructions.

Documents added through `/add-knowledge` are also in memory only and are lost on service restart.

Runtime RAG search combines:

| Strategy | Behavior |
| --- | --- |
| Keyword matching | Extracts non-stopword keywords and gives exact keyword matches higher score |
| Semantic key matching | Builds a simple key from first longer words and compares overlap |
| Content relevance | Adds score for exact words, partial words, and phrase matches |

Document shape inside memory:

```json
{
  "id": "doc-1710000000000",
  "content": "Knowledge article text",
  "metadata": {
    "category": "authentication",
    "priority": "high"
  },
  "keywords": ["knowledge", "article", "text"],
  "timestamp": "2026-06-18T10:00:00.000Z"
}
```

Migration notes:

- Knowledge base is not persisted.
- Document ids are generated with `Date.now()`, so collisions are possible if multiple documents are added in the same millisecond.
- There are no embeddings or vector database despite the RAG naming. Retrieval is custom text scoring.

## 6. AI Service APIs

Base URL from host: `http://localhost:6001`

### `GET /health`

Returns service health and RAG metadata.

Response `200`:

```json
{
  "status": "healthy",
  "aiProvider": "anthropic",
  "model": "claude-sonnet-4-6",
  "ragEngine": "initialized",
  "totalDocuments": 3,
  "searchStrategies": ["keyword", "semantic", "content-relevance"]
}
```

### `POST /process-ticket`

Generates an AI response for a ticket, updates the ticket through Ticket Service, and sends an email notification.

Request body:

```json
{
  "ticketId": 1,
  "title": "Password Reset Issue",
  "description": "I cannot reset my password",
  "userEmail": "user@example.com"
}
```

Fields:

| Field | Required by code | Default | Purpose |
| --- | --- | --- | --- |
| `ticketId` | not validated | none | Used to update Ticket Service via `PUT /tickets/:id` |
| `title` | not validated | none | Included in search query and Claude prompt |
| `description` | not validated | none | Included in search query and Claude prompt |
| `userEmail` | no | `user@example.com` | Recipient for email notification |

Behavior:

1. Builds search query as `${title} ${description}`.
2. Searches the in-memory knowledge base with limit `3`.
3. Builds a Claude prompt with retrieved knowledge entries and ticket data.
4. Calls Anthropic Messages API.
5. Extracts text response.
6. Checks `/escalat/i` against the AI response.
7. Sets status:
   - `escalated` if the AI response contains "escalat" in any casing.
   - `auto-resolved` otherwise.
8. Calls Ticket Service:

```http
PUT {TICKET_SERVICE_URL}/tickets/{ticketId}
Content-Type: application/json

{
  "status": "auto-resolved",
  "ai_response": "AI response text"
}
```

9. Sends email:
   - `sendHumanEscalationEmail()` if escalated.
   - `sendAIResponseEmail()` otherwise.

Response `200`:

```json
{
  "ai_response": "AI response text",
  "status": "auto-resolved",
  "retrieved_documents": 2,
  "relevant_context": [
    "To reset your password, visit the login page and click 'Forgot Password'."
  ],
  "email_sent": true
}
```

Error behavior:

- Anthropic or unexpected processing errors return `500`.
- Ticket update errors are logged but do not fail the API response.
- Email errors are logged but do not fail the API response.
- `email_sent` is always returned as `true` on success path, even if email sending failed.

Migration notes:

- AI Service owns the workflow orchestration, but Ticket Service owns persistence.
- The API is not idempotent because it can send email each time it is called.
- There is no request validation for missing `ticketId`, `title`, or `description`.
- The escalation decision is based on generated text, not a structured model output.

### `POST /add-knowledge`

Adds a knowledge base entry to the in-memory RAG engine.

Request body:

```json
{
  "content": "VPN setup instructions...",
  "category": "network",
  "priority": "medium"
}
```

Fields:

| Field | Required | Default | Purpose |
| --- | --- | --- | --- |
| `content` | yes | none | Knowledge article text |
| `category` | no | `general` | Stored in metadata |
| `priority` | no | `medium` | Stored in metadata |

Response `200`:

```json
{
  "message": "Knowledge base entry added successfully",
  "total_documents": 4
}
```

Response `400`:

```json
{
  "error": "Content is required"
}
```

Migration note: this endpoint does not persist content to a database or file.

### `POST /search-knowledge`

Searches the in-memory knowledge base.

Request body:

```json
{
  "query": "forgot password",
  "limit": 3
}
```

Fields:

| Field | Required | Default | Purpose |
| --- | --- | --- | --- |
| `query` | yes | none | Search text |
| `limit` | no | `3` | Maximum number of returned documents |

Response `200`:

```json
{
  "query": "forgot password",
  "results": [
    {
      "content": "To reset your password, visit the login page and click 'Forgot Password'.",
      "metadata": {
        "category": "authentication",
        "priority": "high"
      },
      "similarity_score": 4.5,
      "keywords": ["reset", "password", "visit", "login", "page"]
    }
  ]
}
```

Response `400`:

```json
{
  "error": "Query is required"
}
```

## 7. Email Functionality

Source: `ai-service/src/emailService.js`

The email service uses Nodemailer with SMTP settings from environment variables.

Transport defaults:

```js
{
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}
```

### AI Response Email

Method: `sendAIResponseEmail(userEmail, ticketData, aiResponse)`

Subject:

```text
Ticket #{id} - AI Response: {title}
```

Template includes:

- Ticket id.
- Ticket title.
- Ticket description.
- Status text `Auto-Resolved`.
- AI response rendered as HTML with newline-to-`<br>` conversion.

### Human Escalation Email

Method: `sendHumanEscalationEmail(userEmail, ticketData)`

Subject:

```text
Ticket #{id} - Escalated to Human Support: {title}
```

Template includes:

- Ticket id.
- Ticket title.
- Ticket description.
- Status text `Escalated to Human`.
- Message that a human support representative will review the case within 24 hours.

Migration notes:

- Email HTML templates interpolate ticket and AI response values directly into HTML strings.
- The service can be constructed without SMTP env vars, but sending will fail if credentials are not valid.
- `SMTP_PORT` is read from env as a string; Nodemailer accepts this in common cases, but a migration may choose to parse it to a number.

## 8. Frontend Functionality

Source files:

| File | Purpose |
| --- | --- |
| `frontend/src/App.js` | Main UI, ticket submission, navigation between form and dashboard |
| `frontend/src/Dashboard.js` | Ticket listing, stats, refresh, delete |

### API URL Behavior

`App.js` reads:

```js
const TICKET_API_URL = process.env.REACT_APP_TICKET_API_URL || 'http://localhost:5001';
const AI_API_URL = process.env.REACT_APP_AI_API_URL || 'http://localhost:6001';
```

However, submission currently uses hardcoded constants:

```js
const TICKET_URL = 'http://localhost:5001';
const AI_URL = 'http://localhost:6001';
```

`Dashboard.js` uses `REACT_APP_TICKET_API_URL` or `http://localhost:5001`.

Migration note: before changing hostnames, environments, or ports, remove or update the hardcoded URLs in `App.js`; otherwise form submission will ignore `REACT_APP_*` values.

### Submit Ticket Flow

Form fields:

- `title`
- `email`
- `description`

Client-side validation:

- All three fields must be non-empty after trimming.
- Invalid/missing values show a browser alert.

On submit:

1. Set loading state.
2. Clear previous status message.
3. `POST http://localhost:5001/tickets` with:

```json
{
  "title": "User title",
  "description": "User description"
}
```

4. Extract `ticketResponse.data.id`.
5. Wait 1 second to show loading state.
6. `POST http://localhost:6001/process-ticket` with:

```json
{
  "title": "User title",
  "description": "User description",
  "userEmail": "user@example.com",
  "ticketId": 1
}
```

7. If AI response status is `escalated`, show escalation message and a human support button.
8. Otherwise show success message.

Timeouts:

- Ticket creation request: 10 seconds.
- AI processing request: 15 seconds.

Error handling:

- Network errors show server connection alert.
- Timeout errors show timeout alert.
- HTTP response errors show `Server error ({status})`.

Migration notes:

- The frontend is the orchestrator of "create ticket then process ticket." If a migration moves orchestration to the backend, update this flow.
- If ticket creation succeeds but AI processing fails, the ticket remains `open`.
- The "Escalate to Human Support" button only shows an alert and resets local form state. It does not call any API.

### Dashboard Flow

On mount:

1. Calls `GET {TICKET_API_URL}/tickets`.
2. Stores returned tickets in state.
3. Starts a 30-second interval to refresh tickets.
4. Clears the interval when unmounted.

Displayed dashboard stats:

- Total tickets.
- Count where `status === "auto-resolved"`.
- Count where `status === "escalated"`.
- Count where `status === "open"`.

Delete flow:

1. User clicks delete.
2. Browser confirmation appears.
3. If confirmed, calls `DELETE {TICKET_API_URL}/tickets/{id}`.
4. Removes the ticket from local state after successful delete.

Status display mapping:

| Status | Color | Icon |
| --- | --- | --- |
| `auto-resolved` | `#28a745` | robot emoji |
| `escalated` | `#ffc107` | warning emoji |
| `open` | `#007bff` | note emoji |
| any other value | `#6c757d` | question emoji |

## 9. End-to-End Functional Scenarios

### Scenario A: Auto-Resolved Ticket

1. User submits a password reset or network issue.
2. Ticket Service creates a ticket with `status = open`.
3. AI Service finds relevant knowledge base entries.
4. Claude returns a response without escalation wording.
5. AI Service updates ticket to `auto-resolved` and stores `ai_response`.
6. AI Service sends an AI response email.
7. Dashboard shows the ticket under Auto-Resolved count.

### Scenario B: Escalated Ticket

1. User submits an issue that Claude says should be escalated.
2. Ticket Service creates a ticket with `status = open`.
3. AI Service response contains a word matching `/escalat/i`.
4. AI Service updates ticket to `escalated`.
5. AI Service sends a human escalation email.
6. Frontend shows the human support section.
7. Dashboard shows the ticket under Escalated count.

### Scenario C: AI Processing Fails After Ticket Creation

1. Ticket creation succeeds.
2. AI Service request fails due to timeout, missing API key, provider error, or network issue.
3. Frontend shows an error alert.
4. Ticket remains in database with `status = open`.
5. No AI response is stored.

### Scenario D: Ticket Update Fails Inside AI Service

1. AI Service successfully gets Claude response.
2. AI Service fails to update Ticket Service.
3. AI Service logs the database update error.
4. AI Service still attempts email.
5. AI Service still returns success to frontend if no later fatal error occurs.
6. Ticket may remain `open` even though the user sees a processed message.

## 10. Testing and Quality Gates

Per-service scripts:

| Service | Test command | Lint command |
| --- | --- | --- |
| `ticket-service` | `npm test` | `npm run lint` |
| `ai-service` | `npm test` | `npm run lint` |
| `frontend` | `npm test` | `npm run lint` |

Ticket Service tests cover:

- Listing tickets.
- Creating tickets.
- Required field validation.
- Fetching one ticket.
- Updating tickets.
- Deleting tickets.
- Database error handling through mocked models.

AI Service tests cover:

- SmartRAGEngine behavior through `ai-service/src/SmartRAGEngine.js`.
- Email template generation.
- Email service construction.

Frontend tests cover:

- Form rendering and submission behavior.
- Error states.
- Dashboard loading, listing, refresh, and delete behavior.

Migration note: tests for SmartRAGEngine do not exercise the exact runtime class inside `ai-service/src/server.js`.

## 11. Migration Checklist

Use this checklist when moving the project to a new architecture, cloud, framework, or database.

### API Compatibility

- Preserve Ticket Service endpoint paths if frontend compatibility is required:
  - `GET /health`
  - `GET /tickets`
  - `GET /tickets/:id`
  - `POST /tickets`
  - `PUT /tickets/:id`
  - `DELETE /tickets/:id`
- Preserve AI Service endpoint paths if frontend compatibility is required:
  - `GET /health`
  - `POST /process-ticket`
  - `POST /add-knowledge`
  - `POST /search-knowledge`
- Keep response field names snake_case where current clients expect them:
  - `ai_response`
  - `created_at`
  - `updated_at`
  - `retrieved_documents`
  - `relevant_context`
  - `email_sent`

### Data Migration

- Export and import ticket records from PostgreSQL.
- Verify actual table columns generated by Sequelize before migration.
- Preserve enum values:
  - `open`
  - `auto-resolved`
  - `resolved`
  - `in-progress`
  - `escalated`
- Decide whether `email` should become a persisted ticket field. It is currently not persisted.
- Decide whether to replace `sequelize.sync()` with explicit schema migration files.

### AI and Knowledge Base Migration

- Decide whether to keep the in-memory RAG engine or move knowledge base content to durable storage.
- If keeping current behavior, seed the three startup knowledge documents.
- If changing retrieval, maintain similar response fields for `/search-knowledge`.
- Unify the duplicate SmartRAGEngine implementations before major refactoring.
- Consider replacing text-based escalation detection with structured Claude output.

### Email Migration

- Preserve both email templates or replace them with equivalent template files.
- Ensure SMTP credentials are configured in the target environment.
- Decide whether failed email sends should be reflected in `email_sent`.
- Sanitize or escape interpolated HTML if user-generated content remains in templates.

### Frontend Migration

- Remove hardcoded `TICKET_URL` and `AI_URL` from `frontend/src/App.js`.
- Ensure browser-facing URLs differ from container-internal URLs where needed.
- If moving orchestration server-side, update submit flow to call one backend endpoint instead of two.
- Keep dashboard refresh behavior if operators rely on near-real-time status updates.

### Reliability Improvements To Consider During Migration

- Add request validation for `/process-ticket`.
- Make AI processing idempotent or protect against duplicate emails.
- Return accurate `email_sent` status.
- Fail or retry when Ticket Service update fails.
- Add persistent storage for knowledge base documents.
- Add authentication and authorization before production use.
- Add OpenAPI documentation for all service endpoints.
- Add DB migrations instead of relying on `sequelize.sync()`.
- Add health checks that verify dependency readiness, not just process health.

## 12. Known Current Behavior That May Surprise Migrators

- `POST /tickets` ignores email even though the frontend requires email.
- AI processing is not automatically triggered by Ticket Service.
- The frontend, not the backend, chains ticket creation and AI processing.
- `ai-service/src/server.js` exits if `ANTHROPIC_API_KEY` is missing.
- AI Service returns success even if Ticket Service update fails.
- AI Service returns `email_sent: true` even if email sending fails.
- Knowledge base entries added by API disappear on restart.
- `App.js` defines environment URL variables but submit flow uses hardcoded URLs.
- Runtime RAG class and tested RAG class are different implementations.
- The Ticket Service update route cannot clear fields because it uses truthiness fallback logic.
