# OmniDoc-AI Deployment Configuration Guide

This directory houses all cloud and local deployment manifests, infrastructure definitions, and environment templates.

---

## 📁 Directory Structure

| File | Purpose | Target Environment |
|---|---|---|
| `docker-compose.yml` | Full-stack multi-container local & VM orchestration | Local Docker / VPS |
| `render.yaml` | Infrastructure-as-Code Blueprint for FastAPI Backend | Render.com Docker Web Service |
| `neon.ts` | Serverless PostgreSQL branching policy & config | Neon Database |
| `.neon` | Linked Neon Project & Branch metadata | Neon CLI |

---

## 🚀 Deployment Platforms Overview

### 1. Frontend (Next.js 14)
- **Host**: [Vercel](https://vercel.com)
- **Live URL**: [https://omnidoc-frontend-mauve.vercel.app](https://omnidoc-frontend-mauve.vercel.app)
- **Root Directory**: `Frontend`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: `https://omnidoc-ai-backend-9oin.onrender.com/api/v1`
  - `NEXT_PUBLIC_BACKEND_URL`: `https://omnidoc-ai-backend-9oin.onrender.com`
  - `DATABASE_URL`: Neon pooled connection string

### 2. Backend (FastAPI + OCR)
- **Host**: [Render](https://render.com)
- **Live Docs**: [https://omnidoc-ai-backend-9oin.onrender.com/docs](https://omnidoc-ai-backend-9oin.onrender.com/docs)
- **Runtime**: Docker (`Backend/Dockerfile`)
- **Health Check**: `/docs` or `/health`
- **Environment Variables**:
  - `DATABASE_URL`: Neon pooled connection string
  - `LLM_PROVIDER`: `gemini`
  - `CORS_ORIGINS`: `https://omnidoc-frontend-mauve.vercel.app,http://localhost:3000`

### 3. Database (Serverless PostgreSQL 18)
- **Host**: [Neon.tech](https://neon.tech)
- **Region**: AWS eu-west-2
- **Pooler**: Enabled (PgBouncer) for high-concurrency serverless connections

### 4. Always-Warm Keep-Alive Automation
- **Host**: GitHub Actions (`.github/workflows/keep_alive.yml`)
- **Schedule**: Every 10 minutes (`*/10 * * * *`)
- **Target**: `https://omnidoc-ai-backend-9oin.onrender.com/health`
- **Benefit**: Eliminates Render free-tier cold starts.

---

## 🐳 Running with Docker Compose

To launch the entire stack locally with PostgreSQL, FastAPI backend, and Next.js frontend:

```bash
docker compose -f deployment/docker-compose.yml up --build
```
