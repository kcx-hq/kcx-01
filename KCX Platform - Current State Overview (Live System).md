# KCX Platform - Current State Overview (Live System)

## Purpose
This document describes the current, live KCX platform as it exists today. It is intended to help a new engineer or AI understand the system before any new work is done.

## High-Level Platform Goal
KCX is a live FinOps platform that lets users log in and view cost and usage data through a web dashboard backed by an API and database.

## Current Architecture Overview
- **Frontend (Dashboard UI):** Web application used by end users to view data and interact with the system.
- **Backend (API):** Serves authenticated requests, enforces access control, and returns data to the UI.
- **Database:** Stores the data the platform needs to serve the dashboard.

## Current Data Flow
```
External Data Sources
        |
        v
KCX Backend (API)
        |
        v
KCX Database
        |
        v
KCX Dashboard UI
```

### Data Flow Details
1. Data is received by the KCX backend from existing external sources (already integrated in the live system).
2. The backend stores that data in the KCX database.
3. The dashboard requests data from the backend API.
4. The backend reads from the database and returns results to the UI.

## Backend Responsibilities
**What the backend owns**
- Authentication and authorization
- API endpoints used by the dashboard
- Data access and validation
- Reading and writing data to the database

**What the backend does NOT do**
- UI rendering or client-side state management
- Direct database access by the UI
- Any data presentation logic beyond API responses

## Database Role
- Stores the current data used by the platform.
- Acts as the source of truth for what the dashboard displays.
- The dashboard depends on the backend to read from the database and return data.

## Dashboard Behavior
- Fetches data via authenticated API requests to the backend.
- Displays data returned by the backend as-is.
- Assumes the backend is available and returns data in expected formats.
- Updates on user-initiated actions or standard UI refresh behavior (no push-based updates).

## Separation of Concerns
- **UI:** Presentation and user interaction only.
- **API:** Business logic, security, and data access.
- **Database:** Persistent storage used by the API.

## Exclusions
- No future plans or roadmap content.
- No Kafka or Flink references.
- No detailed ingestion description.
- No code snippets.
- No proposed changes or improvements.
