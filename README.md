# Subscriptions API

A subscription plan management system that handles downgrades, proration, billing adjustments, and usage validation with financial calculations.

## Features

Subscription plan management (Basic & Pro)
Mid-cycle downgrade handling with proration
Usage validation against plan limits
Accurate billing adjustments and credits
Edge case handling (same-day downgrade, end-of-cycle, month length differences)

## Technical Stack
Runtime: (Dockerized) Node.js + NestJS
Database: (Dockerized) PostgreSQL (via TypeORM)
Validation: Custom business rules
Date handling: Native JS Date + moment.js

## Project Structure
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

## API Endpoints

### CRUD Users

get users
GET http://localhost:3000/api/v1/users

get user
GET http://localhost:3000/api/v1/users/1

create user
POST http://localhost:3000/api/v1/users/

Body json
{
    "name": "John",
    "email": "john.smith@mail.com"
}

edit user
PATCH http://localhost:3000/api/v1/users/:id

Path Variables
id: 1

Body
{
    "name": "John",
    "email": "john.simonenko@mail.com"
}

delete user
DELETE http://localhost:3000/api/v1/users/:id

Path Variables
id: 1

### Time mocking (for e2e tests)

mock time
POST http://localhost:3000/api/v1/time/

Body
{
  "time": "2025-07-01 11:35Z"
}

get mocked time
GET http://localhost:3000/api/v1/time/

### CRUD Plans

GET
get plans
http://localhost:3000/api/v1/plans


GET
get plan
http://localhost:3000/api/v1/plans/:id


Path Variables
id: 1

create plan
POST http://localhost:3000/api/v1/plans/

Body
{
  "name": "test plan 1",
  "price_per_month": 30,
  "qr_code_limit": 12
}

edit plan
PATCH http://localhost:3000/api/v1/plans/:id

Path Variables
id: 1

Body
{
  "name": "test plan 1",
  "price_per_month": 35,
  "qr_code_limit": 14
}

delete plan
DELETE http://localhost:3000/api/v1/plans/:id

Path Variables
id: 1

### CRUD subscriptions

get subscriptions
GET http://localhost:3000/api/v1/subscriptions

get subscription
GET http://localhost:3000/api/v1/subscriptions/:id

Path Variables
id: 1

create subscription
POST http://localhost:3000/api/v1/subscriptions/

  Required body fields:
  "user_id" - user id
  "plan_id" - plad id

  Optional fields:
  "billing_cycle_start_date" - Start date time for billing cycle. Example: "2025-09-02T20:24:05.988Z",
  "billing_cycle_end_date" - End date time for billing cycle. Example: "2025-10-01T20:24:05.988Z",
  "outstanding_credit" - Credit due
  "current_qrcode_usage" - Current QR Code usage


Body
{
    "user_id": 11,
    "plan_id": 16,
    "plan_start_date": "2025-09-02T20:24:05.988Z",
    "billing_cycle_start_date": "2025-09-02T20:24:05.988Z",
    "billing_cycle_end_date": "2025-10-01T20:24:05.988Z",
    "outstanding_credit": 0,
    "current_qrcode_usage": 0
}

edit subscription (downgrade/upgrade)
PATCH http://localhost:3000/api/v1/subscriptions/:id

  Optional body fields:
  "user_id" - user id
  "plan_id" - plad id
  "billing_cycle_start_date" - Start date time for billing cycle. Example: "2025-09-02T20:24:05.988Z",
  "billing_cycle_end_date" - End date time for billing cycle. Example: "2025-10-01T20:24:05.988Z",
  "outstanding_credit" - Credit due
  "current_qrcode_usage


Path Variables
id: 10

Body
{
    "plan_id": 17
}

delete subscription
DELETE http://localhost:3000/api/v1/subscriptions/:id

Path Variables
id: 10

Get Billing

get billing records
GET http://localhost:3000/api/v1/billing/

get billing record
GET http://localhost:3000/api/v1/billing/:id

Path Variables
id: 3

Tests

e2e API tests for API, subsciptions, billing, proration, downgrade validation
Edge case scenarios included

Run tests:
npm run test:e2e

## Setup
Clone repository
git clone https://github.com/virtax/subscriptions.git
cd subscriptions

To run project you need to setup Docker.

## Build and start project
```
docker compose up --build
```
# Shutdown the project
```
docker compose down
```

API available at: http://localhost:3000

