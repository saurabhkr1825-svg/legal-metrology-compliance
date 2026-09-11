# System Architecture — Smart Legal Metrology

## 1. System Overview

The Smart Legal Metrology system is an AI-assisted inspection and compliance platform designed for pre-packaged commodities under Legal Metrology regulations. The platform assists field officers in capturing product packaging evidence, extracting mandatory declarations via Computer Vision and OCR, evaluating declarations against versioned compliance rules, and generating official inspection reports.

The human officer remains the final legal authority in all compliance determinations.

---

## 2. High-Level Architecture

```
┌────────────────────────────────┐       ┌────────────────────────────────┐
│      Mobile Client (Flutter)   │       │       Web Console (React)      │
│  - Field Officer App (M01-M08) │       │  - Supervisor / Admin (W01-W05)│
│  - Local SQLite Persistence    │       │  - Inspection Oversight        │
│  - Idempotent Sync Client      │       │  - Rule & User Management      │
└───────────────┬────────────────┘       └───────────────┬────────────────┘
                │                                        │
                └───────────────────┬────────────────────┘
                                    │ HTTPS (REST + JWT)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API Gateway & Backend                         │
│  - Express / TypeScript REST API                                        │
│  - JWT Authentication & Server-Enforced RBAC                            │
│  - Request Validation & Idempotent Inspection Ingestion                 │
│  - State Machine Transition Enforcement                                 │
│  - Audit Trail Generation                                               │
└───────────────┬───────────────────┬────────────────────┬────────────────┘
                │                   │                    │
                ▼                   ▼                    ▼
┌─────────────────────────┐ ┌───────────────┐ ┌───────────────────────────┐
│   PostgreSQL + PostGIS  │ │     Redis     │ │ Message Queue (RabbitMQ)  │
│  - Users & Roles        │ │  - Session    │ │  - Ingestion Queue        │
│  - Inspections          │ │  - Cache      │ │  - Processing Pipeline    │
│  - Declarations         │ │  - Rate Limit │ │  - Report Generation      │
│  - Violations & Rules   │ └───────────────┘ └─────────────┬─────────────┘
│  - Audit Logs (Append)  │                                 │
└─────────────────────────┘                                 ▼
                │                           ┌─────────────────────────────┐
                │                           │     CV & OCR Workers        │
                │                           │  - OpenCV Preprocessing     │
                │                           │  - Tesseract / Vision OCR   │
                │                           │  - Spatial Extraction       │
                │                           └───────────────┬─────────────┘
                ▼                                           │
┌─────────────────────────┐                                 ▼
│ Encrypted Object Store  │ ◄───────────────────────┌─────────────────────┐
│  - Immutable Evidence   │                         │    Rules Engine     │
│  - Preprocessed Images  │                         │  - Versioned Rules  │
│  - Generated PDF Reports│                         │  - Deterministic    │
└─────────────────────────┘                         │  - PASS/FAIL/REVIEW │
                                                    └─────────────────────┘
```

---

## 3. Core Domain Entities & Relationships

- **User:** System actor (`FIELD_OFFICER`, `SUPERVISOR`, `ADMIN`) with encrypted password hash and active status.
- **Inspection:** Central unit of work identified by a server `id` (UUID) and a client-generated `clientUuid` (idempotency key). Contains immutable evidence image reference, raw OCR data, structured declaration, reviewed declaration, and violation list.
- **Declaration:** Key-value pairs representing mandatory label declarations (Manufacturer Name/Address, Packer/Importer, Commodity Name, Net Quantity, MRP, Manufacture Date, Best Before/Use By, Consumer Care Details). Each field tracks value, confidence score, and source (`ocr`, `manual`, `corrected`).
- **Rule:** Deterministic, versioned compliance rule with unique `ruleId`, `version`, category, conditions, and severity level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Violation:** Record generated when a declaration violates a rule condition. Contains `ruleId`, `ruleVersion`, field reference, expected vs. actual values, and explanation.
- **AuditLog:** Append-only record of all security and compliance actions (login, inspection creation, status change, review submission, rule update).
- **Report:** Official inspection certificate in PDF format referencing immutable evidence images and compliance findings.

---

## 4. Inspection State Machine

The inspection lifecycle follows strict, validated state transitions:

```
┌─────────┐       ┌────────────────┐       ┌────────┐       ┌────────────┐
│  DRAFT  ├──────►│ PENDING_UPLOAD ├──────►│ QUEUED ├──────►│ PROCESSING │
└─────────┘       └────────────────┘       └────────┘       └─────┬──────┘
                                                                  │
                                      ┌───────────────────────────┴──────────┐
                                      ▼                                      ▼
                           ┌───────────────────┐                   ┌───────────────────┐
                           │  REVIEW_REQUIRED  │                   │     COMPLETED     │
                           └─────────┬─────────┘                   └─────────┬─────────┘
                                     │                                       │
                                     └───────────────────────────────────────►
                                                                             │
                                                                             ▼
                                                                   ┌───────────────────┐
                                                                   │      SYNCED       │
                                                                   └───────────────────┘
```

- `DRAFT`: Local capture on mobile device.
- `PENDING_UPLOAD`: Image and metadata prepared for upload.
- `QUEUED`: Accepted by backend API, queued for processing.
- `PROCESSING`: CV preprocessing and OCR worker active.
- `REVIEW_REQUIRED`: Low-confidence fields or unmeasured dimensions flagged for human officer review.
- `COMPLETED`: Officer has reviewed, corrected, and confirmed all fields.
- `SYNCED`: Official PDF report generated and archived; terminal state.

---

## 5. Security & Access Control Model

1. **Authentication:**
   - Stateless JWT tokens for API authorization (short-lived access tokens, secure refresh tokens).
   - Password hashing using modern bcrypt with configurable salt rounds.
   - Account status verification on every authenticated request.

2. **Server-Enforced RBAC:**
   - `FIELD_OFFICER`: Can create inspections, view own inspections, submit reviews.
   - `SUPERVISOR`: Can view regional inspections, inspect violation trends, generate batch reports.
   - `ADMIN`: Full administrative control (user management, rule configuration, audit log inspection).

3. **Data Integrity & Evidence Immutability:**
   - Original evidence images are uploaded directly to object storage and marked immutable.
   - Preprocessing outputs and officer corrections are stored as separate attributes.
   - Audit logs are append-only; updates and deletions are restricted at the database level.

---

## 6. Offline-First & Synchronization Strategy

- **Mobile Local Storage:** SQLite database on device stores draft inspections, evidence file paths, and sync queue.
- **Idempotency:** Client generates a UUID (`clientUuid`) before upload. If network drops and the client retries, the server recognizes the `clientUuid` and returns the existing inspection record without creating a duplicate.
- **Graceful Degradation:** When offline, inspections are saved locally in `DRAFT` / `PENDING_UPLOAD` status and automatically synchronized when connectivity is restored.

---

## 7. Storage Model

- **Relational Data (PostgreSQL + PostGIS):** User accounts, inspection metadata, extracted declarations, evaluated violations, audit trails, and rule definitions.
- **Object Storage (S3 / MinIO):** Original evidence images, preprocessed images, and generated PDF reports.
- **Client Cache (SQLite):** Active officer draft inspections and sync queue state.
