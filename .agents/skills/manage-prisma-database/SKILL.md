---
name: manage-prisma-database
description: Skill for maintaining Prisma migrations, schema indexes, unique constraints, and atomic multi-table updates.
version: 1.0.0
---

# MANAGE PRISMA DATABASE SKILL

## Trigger Conditions

Activate this skill when modifying `prisma/schema.prisma` or running database migrations.

## Operational Boundaries

- NEVER instantiate multiple `new PrismaClient()` instances; use the `@/lib/prisma` singleton.
- NEVER alter core model structures outside the approved models defined in DATABASE SCHEMA RULE: `users`, `subscriptions`, `payment_logs` (billing) and `files`, `jobs` (receipt parsing), plus the `PlanInterval`, `SubscriptionStatus`, and `JobStatus` enums.

## Step-by-Step Instructions

1. **Enforce the Canonical Prisma Schema Rules** (see `.agents/rules/DATABASE SCHEMA RULE.md` for the full binding spec). Billing models:

   ```prisma
   model users {
     id           String         @id @default(uuid())
     email        String         @unique
     created_at   DateTime       @default(now())
     updated_at   DateTime       @updatedAt
     subscription subscriptions?
     payment_logs payment_logs[]

     @@index([email])
   }

   model subscriptions {
     id                       String             @id @default(uuid())
     user_id                  String             @unique
     provider_subscription_id String             @unique
     plan_interval            PlanInterval
     status                   SubscriptionStatus
     current_period_start     DateTime
     current_period_end       DateTime
     cancel_at_period_end     Boolean            @default(false)
     cancellation_reason      String?            @db.VarChar(500)
     created_at               DateTime           @default(now())
     updated_at               DateTime           @updatedAt
     user                     users              @relation(fields: [user_id], references: [id], onDelete: Cascade)

     @@index([status])
   }

   model payment_logs {
     id                    String   @id @default(uuid())
     user_id               String
     provider_event_id     String   @unique
     event_type            String
     amount_in_minor_units Int
     currency              String   @default("USD")
     payload_json          Json
     created_at            DateTime @default(now())
     user                  users    @relation(fields: [user_id], references: [id], onDelete: Cascade)

     @@index([user_id])
     @@index([event_type])
   }
   ```

2. **Apply the Assessment 3 Parsing Models** (`JobStatus` enum, `files`, `jobs`) using the `User`/`File`/`Job` definitions with snake_case `@@map` exactly as specified in the DATABASE SCHEMA RULE and `AGENTS.md` §8. Preserve the unique constraint on `File.storageKey` and the `Job` indexes (`[userId, status]`, `[fileId]`).

3. **Validate Schema:** Run `npx prisma validate` to confirm schema validity before committing code.
4. **Run migrations with zero-downtime discipline:** use `npx prisma migrate dev` in development; never hand-edit migration files.