---
name: generate-assessment-evidence
description: Skill for running end-to-end verification runs, schema-failure simulations, and capturing database/network evidence for the Assessment 3 (receipt parsing) grading checklist.
version: 1.0.0
---

# GENERATE ASSESSMENT EVIDENCE SKILL

## Trigger Conditions

Activate this skill during end-to-end testing, job-pipeline validation runs, or Assessment 3 evidence collection.

## Operational Boundaries

- NEVER manually edit database state to fabricate job records or bypass real parsing/queue processing when collecting evidence.
- NEVER upload real credit-card or PII-bearing documents; use synthetic test receipts.

## Step-by-Step Instructions

1. **Verify Job State Transitions:**
   Produce a database proof of `PENDING → PROCESSING → DONE/FAILED` with attempt counters:

   ```bash
   npx prisma studio
   ```
   or query the `jobs` table directly and capture the snapshot showing `status` and `attempts` columns.

2. **Raw File vs. Parsed JSON Comparison:**
   Upload a sample receipt, wait for `DONE`, then capture a side-by-side view: the uploaded document (Screen 2/3) against the rendered Zod-validated `resultJson` (merchant, date, total, tax, line items) on Screen 3.

3. **Force a Schema Failure:**
   Verify the FAILED path by supplying the force-failure header to `/api/jobs`; confirm the job transitions to `FAILED` and `errorMessage` contains the explicit schema error:

   ```bash
   curl -X POST http://localhost:3000/api/jobs \
     -H "Content-Type: application/json" \
     -H "X-Test-Force-Failure: true" \
     -d '{ "storageKey": "uploads/usr_123/fail_test.png", "fileName": "bad.png", "fileSize": 1024, "mimeType": "image/png" }'
   ```

4. **Storage Key Verification:**
   Prove the `files` table holds only S3 object keys (e.g., `uploads/usr_123/rcpt_99.png`) with no binary representations:

   ```bash
   npx prisma db execute --stdin <<'SQL'
   SELECT id, storage_key, file_name, file_size, mime_type FROM files;
   SQL
   ```

5. **Validate Build & Schema:**
   ```bash
   npx prisma validate
   npm run build
   ```

6. **Document Evidence:** Save each artifact (screenshots, SQL/curl output) into the assessment evidence folder with the job id captured.