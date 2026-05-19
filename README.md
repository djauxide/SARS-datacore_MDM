# SARS DataCore MDM

Commissioner-level Master Data Management and AI governance platform for SARS DataCore.

This repository contains a production-ready Next.js scaffold for the SARS DataCore MDM platform, including a server-backed executive command dashboard, MDM entity hub APIs, deterministic AI intelligence, optional live Claude integration, governance policy checks, anomaly analysis, compliance audit evidence, and procurement-ready reporting context.

## Current Build

- **Core Platform:** MDM Entity Hub, Data Quality & Lineage, AI Governance Engine, Compliance & Audit, RBAC Matrix, and Data Catalogue.
- **AI Intelligence Layer:** Governance copilot, 4,218-rule policy engine, anomaly drill-downs, stewardship recommendations, and implementation roadmap context.
- **Executive Intelligence:** Command dashboard, 96/100 GOLD trust score, vendor scorecard, NLP query engine, and live evidence console.
- **Record Scope:** 48.2M master records across taxpayer, vendor, employee, customs, case, and asset domains.
- **Procurement Context:** SARS/ICT/MDM/2025-001 with R480M implementation scope.

## Application

The app lives in:

```bash
nexus-broadcast/
```

Primary SARS route:

```text
/sars-mdm
```

Backend API routes:

```text
/api/sars-mdm/system
/api/sars-mdm/entity-hub
/api/sars-mdm/copilot
/api/sars-mdm/nlp
/api/sars-mdm/policy
/api/sars-mdm/anomalies
/api/sars-mdm/audit
```

## Local Development

```bash
cd nexus-broadcast
npm install
npm run dev
```

Open:

```text
http://localhost:3000/sars-mdm
```

## Production Build

```bash
cd nexus-broadcast
npm run build
npm run start
```

## Claude Integration

The AI Copilot and NLP Query Engine are wired server-side. Without a Claude key, the platform runs in deterministic intelligence mode. To enable live Claude responses, set one of:

```bash
ANTHROPIC_API_KEY=your_key_here
CLAUDE_API_KEY=your_key_here
```

Optional model override:

```bash
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

The browser never receives the API key; all Claude calls are proxied through server-side Next.js route handlers.

## Data Model Highlights

- 48.2M total master records
- 4,218 active governance policy rules
- 96/100 GOLD platform trust grade
- POPIA, TAA, ISO 27001, and NIST AI RMF compliance scoring
- Vendor scorecard covering Informatica, IBM, Ataccama, Reltio, and Custom DataCore
- Deterministic fallback intelligence for offline and demo environments

## Verification

The current implementation has been verified with:

```bash
cmd /c node_modules\.bin\tsc --noEmit
cmd /c npm run build
```

Runtime checks were also performed against:

```text
GET  /sars-mdm
POST /api/sars-mdm/nlp
POST /api/sars-mdm/policy
POST /api/sars-mdm/anomalies
```

## Repository Status

Latest SARS DataCore commits:

- `736eb69` Add SARS DataCore backend intelligence APIs
- `6d32603` Add SARS MDM command dashboard

## Deployment Target

The project is ready for deployment to a Docker/VPS/Cloud VM or a managed Next.js host. For production, configure:

- Node.js runtime
- Environment variables for Claude if live AI is required
- HTTPS reverse proxy
- Persistent database layer if moving beyond the included JSON/Postgres-compatible state pattern
- CI build step using `npm run build`

