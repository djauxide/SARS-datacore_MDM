# Nexus Broadcast Orchestrate

**Hybrid Cloud-to-Ground Broadcast Orchestration Platform**

A unified broadcast orchestration platform combining the best of GV AMPP, EVS Neuron/Cerebrum, and NEP Platform — built for Africa-first deployments, globally competitive.

---

## What it does

- **Signal Flow Orchestration** — Visual hybrid production chain from SDI sources through IP fabric to cloud outputs
- **SMPTE Compliance** — ST 2110-20/30/40, ST 2022-7 hitless redundancy, PTP IEEE 1588, NMOS IS-04/05
- **Device Control** — Hardware and cloud devices via WebSocket, REST, RS-422, NDI, SRT, AES67
- **Multiviewer** — Configurable 2×1 to 4×4 grid with ON AIR/PREVIEW states, scopes, meters
- **Automation Engine** — Pre-built workflows: auto-failover, cloud spin-up, scheduled recording, FAST channel launch
- **Plug & Play** — Add any device in seconds. Auto-discovers via NMOS IS-04
- **WebSocket Native** — Real-time bidirectional control of hardware and cloud nodes

---

## Standards Compliance

| Standard | Implementation |
|----------|---------------|
| SMPTE ST 2110-20 | Uncompressed video over IP |
| SMPTE ST 2110-30 | AES67 audio over IP |
| SMPTE ST 2110-40 | Ancillary data over IP |
| SMPTE ST 2022-7 | Hitless redundancy (dual path) |
| SMPTE ST 2110-22 | JPEG XS compressed video |
| AMWA NMOS IS-04 | Device discovery and registration |
| AMWA NMOS IS-05 | Device connection management |
| IEEE 1588 PTP | Precision Time Protocol sync |
| AES67 | Audio over IP interoperability |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## Roadmap

### Phase 1 — Current (UI/UX)
- [x] Signal flow visualization
- [x] Multiviewer with scopes
- [x] Device management UI
- [x] Automation workflow engine
- [x] SMPTE compliance panel
- [x] Transport controls

### Phase 2 — WebSocket Integration
- [ ] Real WebSocket server (Node.js)
- [ ] Hardware device adapters (SDI routers, encoders)
- [ ] NMOS IS-04 registry server
- [ ] NMOS IS-05 connection API
- [ ] PTP status polling

### Phase 3 — Cloud Orchestration
- [ ] AWS/Azure cloud node spin-up API
- [ ] JPEG XS cloud encode management
- [ ] MAM integration (asset management)
- [ ] Multi-site production support
- [ ] FAST channel playout automation

### Phase 4 — AI Features
- [ ] AI signal monitoring (anomaly detection)
- [ ] Automated QC (loudness, format compliance)
- [ ] Intelligent failover prediction
- [ ] Content tagging for MAM

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  NEXUS ORCHESTRATE                   │
│                   (This Platform)                    │
└──────────┬──────────────────────────┬───────────────┘
           │ WebSocket / REST          │ NMOS IS-05
    ┌──────▼──────┐            ┌───────▼───────┐
    │  ON-PREMISE │            │  CLOUD NODES  │
    │  HARDWARE   │            │  AWS / Azure  │
    │             │            │               │
    │ SDI Routers │◄──ST 2110──► JPEG XS Enc  │
    │ Encoders    │            │ Cloud Playout │
    │ PTP GM      │            │ MAM / Archive │
    │ Audio Mixers│            │ OTT Streaming │
    └─────────────┘            └───────────────┘
```

---

Built by Nexus Broadcast · Africa-first · Globally compliant
