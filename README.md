# Smart Legal Metrology

AI-assisted inspection system for pre-packaged commodity compliance with Legal Metrology regulations.

## Overview

This system enables field officers to capture product label images, extract declaration information using OCR, evaluate compliance against legal metrology rules, and generate inspection reports. The system supports offline-first mobile workflows with synchronized backend processing.

## Key Capabilities

- **Mobile Inspection App:** Capture product images, review extracted declarations, and submit inspections offline-first
- **OCR & Computer Vision:** Automated extraction of manufacturer details, quantities, pricing, dates, and contact information from product labels
- **Rules-Based Compliance:** Deterministic evaluation against versioned legal metrology regulations
- **Human Review Workflow:** Flag low-confidence extractions for officer review and correction
- **Web Console:** Supervisor and admin dashboards for inspection oversight, violation tracking, and rule management
- **PDF Report Generation:** Official inspection reports with evidence images and compliance findings

## Architecture

```
Mobile App (Flutter)  ──┐
                        ├──► REST API (Express/TypeScript) ──► Message Queue (RabbitMQ) ──► OCR Worker (Python/OpenCV/Tesseract)
Web Console (React) ────┘              │                                                              │
                                       ▼                                                              ▼
                            PostgreSQL + PostGIS                                              Rules Engine (JSON)
                                       │                                                              │
                                       ▼                                                              ▼
                              Object Storage (MinIO/S3) ◄────────────────────────────────  PDF Report Generator
```

## Repository Structure

```
.
├── apps/
│   ├── mobile/         # Flutter mobile app for field officers
│   └── web/            # React web console for supervisors and admins
├── packages/
│   └── shared/         # Shared TypeScript domain contracts and constants
├── services/
│   ├── api/            # REST API service (Express/TypeScript)
│   ├── ocr-worker/     # Computer vision and OCR processing worker (Python)
│   └── rules-engine/   # Compliance rules evaluation service
├── data/
│   ├── rules/          # Versioned legal metrology rule configurations
│   └── seeds/          # Development seed data (users, sample data)
└── docker-compose.yml  # Local development infrastructure
```

## Prerequisites

- **Node.js** 20+ and npm
- **Flutter** 3.4+
- **Python** 3.10+
- **Docker** and Docker Compose
- **PostgreSQL** 16+ with PostGIS extension (via Docker or managed service)

## Getting Started

### 1. Clone and Configure

```bash
git clone https://github.com/saurabhkr1825-svg/legal-metrology-compliance.git
cd legal-metrology-compliance
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start Infrastructure

Start PostgreSQL, Redis, RabbitMQ, and MinIO using Docker Compose:

```bash
docker compose up -d
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build Shared Packages

```bash
npm run build
```

### 5. Run the API

```bash
cd services/api
npm run dev
```

The API will be available at `http://localhost:3000`.

### 6. Run the Mobile App

```bash
cd apps/mobile
flutter pub get
flutter run
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

- **Database:** PostgreSQL connection string
- **Redis:** Cache URL
- **RabbitMQ:** Message queue URL
- **Object Storage:** MinIO or S3-compatible storage credentials
- **JWT Secret:** Authentication secret (generate a secure random value)
- **OCR Engine:** `tesseract` (local) or cloud Vision API credentials

## Running Tests

```bash
# Run all tests
npm test

# Run API tests only
cd services/api
npm test
```

## Development Commands

```bash
# Type checking
npm run typecheck

# Build all packages
npm run build

# Start infrastructure
npm run docker:up

# Stop infrastructure
npm run docker:down
```

## Database Setup

The application uses PostgreSQL with PostGIS for geospatial support. For local development, Docker Compose automatically provisions the database. For production deployment, use a managed PostgreSQL service with PostGIS enabled.

Database migrations will be applied automatically on application startup (implementation pending).

## Inspection Workflow

```
DRAFT → PENDING_UPLOAD → QUEUED → PROCESSING → REVIEW_REQUIRED → COMPLETED → SYNCED
```

1. **DRAFT:** Officer captures image locally
2. **PENDING_UPLOAD:** Image ready for sync when online
3. **QUEUED:** Uploaded to backend, awaiting OCR processing
4. **PROCESSING:** OCR and extraction in progress
5. **REVIEW_REQUIRED:** Low-confidence fields require officer review
6. **COMPLETED:** Officer has reviewed and submitted
7. **SYNCED:** Report generated and finalized

## Design Principles

- **Offline-First Mobile:** Inspections are saved locally and synchronized when connectivity is available
- **Evidence Integrity:** Original images are immutable; corrections are stored separately with audit trails
- **Deterministic Compliance:** Legal decisions are based on versioned rules, not AI/LLM judgments
- **Human-in-the-Loop:** Low-confidence OCR results are flagged for manual review
- **Backend Security:** All authorization is enforced server-side

## License

Proprietary - All rights reserved
