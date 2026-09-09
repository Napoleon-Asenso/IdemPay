---
trigger: glob
---

# DATABASE SCHEMA RULE (.agents/rules/database-schema.md)

## 1. Schema Immutability & Model Integrity

- ALL database access MUST be managed strictly through Prisma ORM targeting PostgreSQL.
- Schema additions outside the approved model set are STRICTLY FORBIDDEN.
- Approved models: `users`, `subscriptions`, `payment_logs` (Assessment 2: Payment & Subscription Slice) and `files`, `jobs` (Assessment 3: Receipt & Document Parsing Pipeline), plus the `PlanInterval`, `SubscriptionStatus`, and `JobStatus` enums.
- The canonical `files`, `jobs`, and `JobStatus` definitions below are binding for Assessment 3 and MUST match `prisma/schema.prisma`.

## 2. Table & Field Specifications

### `users` Model (shared)

- Fields: `id` (String, UUID), `email` (String, Unique), `created_at` (DateTime, default now).
- Relations: `files[]` and `jobs[]` for Assessment 3; `subscription?` and `payment_logs[]` when billing models are present (Assessment 2).
- MUST include a unique index on `email` (Prisma: `@unique`).

### Assessment 2 — Billing Models

- **`subscriptions` Model**:
  - Fields: `id` (String, UUID), `user_id` (String, Unique), `provider_subscription_id` (String, Unique), `plan_interval` (`PlanInterval` enum: `monthly` | `yearly`), `status` (`SubscriptionStatus` enum: `active` | `canceled` | `past_due` | `unpaid` | `incomplete`), `current_period_start` (DateTime), `current_period_end` (DateTime), `cancel_at_period_end` (Boolean, default: `false`), `cancellation_reason` (String?, VarChar 500), `created_at` (DateTime), `updated_at` (DateTime).
  - Relation: Foreign key on `user_id` referencing `users(id)` with `onDelete: Cascade`.
- **`payment_logs` Model**:
  - Fields: `id` (String, UUID), `user_id` (String), `provider_event_id` (String, Unique), `event_type` (String), `amount_in_minor_units` (Int), `currency` (String, default: "USD"), `payload_json` (Json), `created_at` (DateTime).
  - Relation: Foreign key on `user_id` referencing `users(id)` with `onDelete: Cascade`.

### Assessment 3 — Parsing Models (`files`, `jobs`, `JobStatus`)

```prisma
enum JobStatus {
  PENDING
  PROCESSING
  DONE
  FAILED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  files     File[]
  jobs      Job[]

  @@map("users")
}

model File {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  storageKey String   @unique @map("storage_key")
  fileName   String   @map("file_name")
  fileSize   Int      @map("file_size")
  mimeType   String   @map("mime_type")
  createdAt  DateTime @default(now()) @map("created_at")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobs       Job[]

  @@index([userId])
  @@map("files")
}

model Job {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  fileId       String    @map("file_id")
  status       JobStatus @default(PENDING)
  attempts     Int       @default(0)
  errorMessage String?   @map("error_message")
  resultJson   Json?     @map("result_json")
  summaryText  String?   @map("summary_text")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  file         File      @relation(fields: [fileId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@index([fileId])
  @@map("jobs")
}
```

## 3. Database Singleton & Transactions

- ALWAYS import the Prisma client singleton from `@/lib/prisma`. NEVER instantiate `new PrismaClient()` directly inside route handlers.
- ALL write operations inside webhooks or multi-table operations (billing or job creation) MUST be executed within a `prisma.$transaction([])` block.