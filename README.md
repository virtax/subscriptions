# Subscriptions API

A subscription plan management system that handles downgrades, proration, billing adjustments, and usage validation with financial calculations.

## Features

- Subscription plan management (Basic & Pro)
- Mid-cycle downgrade handling with proration
- Usage validation against plan limits
- Accurate billing adjustments and credits
- Edge case handling (same-day downgrade, end-of-cycle, month length differences)

## Technical Stack
Runtime: (Dockerized) Node.js + NestJS
Database: (Dockerized) PostgreSQL (via TypeORM)
Validation: Custom business rules
Date handling: Native JS Date + moment.js


## Setup
Clone repository
```bash
git clone https://github.com/virtax/subscriptions.git
cd subscriptions
```

Copy .env.example to .env
```bash
cp .env.example .env
```

## Build and start project
To run project you need to setup Docker.
```bash
docker compose up --build
```

## Shutdown the project
```bash
docker compose down
```

## Tests

e2e API tests for API, subsciptions, billing, proration, downgrade validation.
Edge case scenarios included.

Run tests:
```bash
❯ npm run test:e2e

> subscriptions@0.0.1 test:e2e
> jest --config ./test/jest-e2e.json

 PASS  test/app.e2e-spec.ts
 PASS  test/user.e2e-spec.ts
 PASS  test/plan.e2e-spec.ts
 PASS  test/billing.e2e-spec.ts
 PASS  test/subscription.e2e-spec.ts

Test Suites: 1 skipped, 5 passed, 5 of 6 total
Tests:       10 skipped, 10 passed, 20 total
Snapshots:   0 total
Time:        3.646 s
Ran all test suites.
```

## Project
```
src/
  ├── common/        # Shared utilities
  ├── database/      # Database setup
  ├── subscriptions/ # Subscriptions and plans module (include downgrade logic)
  ├── billing/       # Billing records module
  ├── users/         # Users module
  ├── time/          # Time mocking module (for tests)
  ├── app.module.ts  # NestJS root module
  └── main.ts        # App bootstrap

test/                           # e2e tests
  ├── common/                   # Test methods to call API
  ├── app.e2e-spec.ts           # App home page test
  ├── billing.e2e-spec.ts       # Billing records tests
  ├── plan.e2e-spec.ts          # Plans tests
  ├── subscription.e2e-spec.ts  # Subscriptions tests
  ├── time.e2e-spec.ts          # Datetime mocking tests
  ├── user.e2e-spec.ts          # Users tests
```

## API Endpoints

API available at: http://localhost:3000

### CRUD Users

#### Get users
GET http://localhost:3000/api/v1/users

#### Get user
GET http://localhost:3000/api/v1/users/1

#### Create user
POST http://localhost:3000/api/v1/users/

Body
```json
{
    "name": "John",
    "email": "john.smith@mail.com"
}
```

#### Edit user
PATCH http://localhost:3000/api/v1/users/:id

Path Variables
id: 1

Body
```json
{
    "name": "John",
    "email": "john.simonenko@mail.com"
}
```

#### Delete user
DELETE http://localhost:3000/api/v1/users/:id

Path Variables
id: 1

### Time mocking (for e2e tests)

#### Mock time
POST http://localhost:3000/api/v1/time/

Body
```json
{
  "time": "2025-07-01 11:35Z"
}
```

#### Get mocked time
GET http://localhost:3000/api/v1/time/

### CRUD Plans

#### Get plans
GET http://localhost:3000/api/v1/plans

#### Get plan
GET http://localhost:3000/api/v1/plans/:id

Path Variables
id: 1

#### Create plan
POST http://localhost:3000/api/v1/plans/

Body
```json
{
  "name": "test plan 1",
  "price_per_month": 30,
  "qr_code_limit": 12
}
```

#### Edit plan
PATCH http://localhost:3000/api/v1/plans/:id

Path Variables
id: 1

Body
```json
{
  "name": "test plan 1",
  "price_per_month": 35,
  "qr_code_limit": 14
}
```

#### Delete plan
DELETE http://localhost:3000/api/v1/plans/:id

Path Variables
id: 1

### CRUD subscriptions

#### Get subscriptions
GET http://localhost:3000/api/v1/subscriptions

#### Get subscription
GET http://localhost:3000/api/v1/subscriptions/:id

Path Variables
id: 1

#### Create subscription
POST http://localhost:3000/api/v1/subscriptions/

```
  Required body fields:
  "user_id" - user id
  "plan_id" - plan id

  Optional fields:
  "billing_cycle_start_date" - Start date time for billing cycle. Example: "2025-09-02T20:24:05.988Z",
  "billing_cycle_end_date" - End date time for billing cycle. Example: "2025-10-01T20:24:05.988Z",
  "outstanding_credit" - Credit due
  "current_qrcode_usage" - Current QR Code usage
```

Body
```json
{
    "user_id": 11,
    "plan_id": 16,
    "plan_start_date": "2025-09-02T20:24:05.988Z",
    "billing_cycle_start_date": "2025-09-02T20:24:05.988Z",
    "billing_cycle_end_date": "2025-10-01T20:24:05.988Z",
    "outstanding_credit": 0,
    "current_qrcode_usage": 0
}
```

#### Edit subscription (downgrade/upgrade)
PATCH http://localhost:3000/api/v1/subscriptions/:id

```
  Optional body fields:
  "user_id" - user id
  "plan_id" - plad id
  "billing_cycle_start_date" - Start date time for billing cycle. Example: "2025-09-02T20:24:05.988Z",
  "billing_cycle_end_date" - End date time for billing cycle. Example: "2025-10-01T20:24:05.988Z",
  "outstanding_credit" - Credit due
  "current_qrcode_usage
```

Path Variables
id: 10

Body
```json
{
    "plan_id": 17
}
```

#### Delete subscription
DELETE http://localhost:3000/api/v1/subscriptions/:id

Path Variables
id: 10

### Get Billing

#### Get billing records
GET http://localhost:3000/api/v1/billing/

#### Get billing record
GET http://localhost:3000/api/v1/billing/:id

Path Variables
id: 3
