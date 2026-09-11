# Smart Legal Metrology

AI-assisted Legal Metrology inspection system for pre-packaged commodities.

## Architecture

```
[Mobile (Flutter)] ──┐
                     ├──► [API Gateway (FastAPI/Express)] ──► [RabbitMQ] ──► [OCR Worker (Python/OpenCV)]
[Web Console (React)]┘                 │                                            │
                                       ▼                                            ▼
                              [PostgreSQL + PostGIS]                      [Rules Engine (JSON)]
                                       │                                            │
                                       ▼                                            ▼
                              [MinIO / S3 Storage] ◄────────────────────── [PDF Report Generator]
```

## Repository Structure

```
.
├── apps/
│   ├── mobile/         # Flutter Field Officer app (M01-M08)
│   └── web/            # React/Vite Admin & Supervisor console (W01-W05)
├── packages/
│   └── shared/         # Shared TypeScript domain contracts & constants
├── services/
│   ├── api/            # REST API service (Express/TypeScript)
│   ├── ocr-worker/     # CV/OCR processing worker (Python/OpenCV/Tesseract)
│   └── rules-engine/   # Deterministic legal metrology rules evaluator
├── data/
│   ├── rules/          # Versioned Legal Metrology rule configurations (JSON)
│   └── seeds/          # Initial seed data (users, sample products)
├── docs/               # Architecture, API specs, and domain documentation
├── docker-compose.yml  # Local development infrastructure (Postgres, Redis, RabbitMQ, MinIO)
└── .env.example        # Environment variable template
```

## Quick Start

### 1. Start Infrastructure
```bash
docker compose up -d
```

### 2. Install & Build Shared Packages
```bash
npm install
npm run build
```

### 3. Run API
```bash
cd services/api
npm run dev
```

### 4. Run Mobile App
```bash
cd apps/mobile
flutter pub get
flutter run
```

## Inspection Status Workflow

```
[DRAFT] ──► [PENDING_UPLOAD] ──► [QUEUED] ──► [PROCESSING] ──► [REVIEW_REQUIRED] ──► [COMPLETED] ──► [SYNCED]
   ▲              │                                │                                    ▲
   └──────────────┴────────────────────────────────┴────────────────────────────────────┘
```

## Non-Negotiable Guardrails

1. **Original Evidence:** Never overwrite original evidence images.
2. **Deterministic Decisions:** Never use an LLM as the final legal decision-maker.
3. **Physical Measurements:** Never fabricate font-size measurements; flag `REVIEW_REQUIRED` without depth calibration.
4. **No Hard-Coded Rules:** Legal thresholds must come from versioned rule JSON.
5. **Idempotent Sync:** Mobile offline sync must use client UUIDs to prevent duplicate inspections.
6. **Backend RBAC:** Role-based access control must be enforced on the backend.
7. **Dual Visual Encoding:** Critical statuses must use text/icon + color (never color alone).
