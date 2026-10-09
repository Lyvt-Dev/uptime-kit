<div align="center">

# ⚡ Uptime Kit

**Lightweight, self-hosted uptime monitoring with a clean public status page.**

Monitor your HTTP services, track response times, and get notified when something goes wrong — without a heavy infrastructure stack.

[Getting started](#-quick-start) · [Features](#-features) · [Architecture](#-architecture) · [Roadmap](#-roadmap)

![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?logo=nextdotjs)
![SQLite](https://img.shields.io/badge/SQLite-Drizzle-003B57?logo=sqlite)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/status-MVP-orange)

</div>

---

## ✨ Features

- **HTTP/HTTPS uptime checks** — monitor configurable URLs at individual intervals.
- **Fast failure detection** — 5-second timeout; HTTP 400+ and network failures count as DOWN.
- **Response time history** — track latency and HTTP status for every check.
- **Smart Discord alerts** — notifications on UP → DOWN and DOWN → UP, without repetitive alerts.
- **Public status page** — responsive read-only Next.js interface, no login required.
- **24-hour analytics** — sampled uptime percentage and average response time.
- **Small footprint** — Fastify, Drizzle ORM and SQLite; no Redis or PostgreSQL required.
- **One-command startup** — run the application with Docker Compose.

## 🚀 Quick start

### Requirements

- Docker Engine + Docker Compose

```bash
git clone https://github.com/Lyvt-Dev/uptime-kit.git
cd uptime-kit
cp .env.example .env
```

Edit `.env` to configure your monitor list (and optionally a Discord webhook):

```dotenv
MONITORS_JSON=[{"name":"Website","url":"https://example.com","intervalSeconds":60}]
DISCORD_WEBHOOK_URL=
```

Then launch:

```bash
docker compose up --build
```

| Service | Address |
| --- | --- |
| 🌐 Public status page | http://localhost:3000 |
| 🔌 JSON API | http://localhost:3001/api/status |

> Docker ports are bound to localhost by default. For public hosting, place an HTTPS reverse proxy in front. SQLite data persists in a Docker volume.

## 🏗 Architecture

```text
             ┌─────────────────────┐
  Browser ──▶│ Next.js status page │
             └──────────┬──────────┘
                        │ HTTP (read-only)
             ┌──────────▼──────────┐
             │     Fastify API     │
             │  GET /api/status    │
             └──────────┬──────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
  HTTP monitor worker           SQLite + Drizzle
  • scheduled checks            • monitors
  • latency + status            • heartbeats
  • state transitions                  ▲
         │                             │
         └────────── records ──────────┘
         │
         └────────▶ Discord webhook
```

### Stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js 24, TypeScript, Fastify |
| Database | SQLite, Drizzle ORM, WAL mode |
| Monitoring | Lightweight asynchronous polling |
| Frontend | Next.js App Router, Tailwind CSS |
| Alerts | Discord webhook |
| Deployment | Docker Compose |

## 📡 API

**`GET /api/status`** provides a read-only list of monitored services with current state, latest HTTP code, last latency, and rolling 24-hour availability/average latency.

States:
- **UP:** HTTP response below 400.
- **DOWN:** HTTP 400+, connection error, or timeout.
- **UNKNOWN:** no check completed yet.

The initial UNKNOWN → DOWN observation intentionally sends no alert. Availability is **sample-based**, not duration-weighted; averages include stored checks in the last 24 hours.

## 🧑‍💻 Local development

Requires **Node.js 24**.

Start the backend:

```bash
cd apps/api
npm install
npm run dev
```

In another terminal, run the frontend:

```bash
cd apps/web
npm install
npm run dev
```

Set `DATABASE_PATH`, `MONITORS_JSON`, and `API_URL=http://localhost:3001` as appropriate for your environment.

## 🗺 Roadmap

- [x] HTTP(S) monitoring and heartbeat persistence
- [x] Discord state-change alerts
- [x] Public status page with 24-hour metrics
- [ ] Secure admin dashboard and monitor CRUD
- [ ] Incidents, maintenance windows, webhook retries
- [ ] SSL expiry and TCP/DNS checks
- [ ] Multiple status pages and custom domains
- [ ] Multi-region checks and production observability

## 🔒 Security and limitations

**This is an MVP, not a production-hardened hosted service.**

- Configure only URLs you trust. The current worker **does not protect against DNS rebinding/SSRF**.
- Do not expose monitor configuration or unauthenticated write endpoints publicly.
- Only run one API/worker instance against the SQLite file.
- Webhook delivery is best-effort; failed notifications are logged but not retried.
- Back up your SQLite volume, protect webhook secrets, and consider outbound egress rules before public hosting.

## 🤝 Contributing

Issues, feedback, and pull requests are welcome. Please keep changes focused, typed, and easy to self-host.

---

<div align="center"><sub>Made for developers who want to own their uptime monitoring. ⚡</sub></div>
