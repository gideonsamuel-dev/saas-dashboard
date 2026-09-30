# Multi-Tenant SaaS Analytics Platform

A multi-tenant SaaS dashboard built with Next.js 15, Prisma, and PostgreSQL (Neon).

## Stack
- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** PostgreSQL (Neon), via Prisma ORM
- **Styling:** Tailwind CSS

## What's Implemented
- **Multi-tenancy:** Organizations as isolated tenants, with users belonging to one or more orgs via `Membership`.
- **RBAC:** Role-based access control with three roles — `ADMIN`, `MANAGER`, `MEMBER` — enforced at the data model level via the `Membership.role` field. A unique constraint on `(userId, organizationId)` prevents duplicate memberships.
- **Server Actions:** Organization creation and member invitation are handled via Next.js Server Actions (`createOrg`, `addMember`), writing directly to Postgres through Prisma with no separate API layer needed.
- **Data model:** `Organization`, `User`, `Membership`, `Subscription`, `UsageEvent` — the `Subscription` and `UsageEvent` models are in place to support billing and usage-based analytics.

## Data Model

## Designed but Not Yet Wired Up
Due to time constraints, the following are modeled in the schema and architecture but not yet fully implemented in the UI/integration layer:

- **Authentication (Clerk):** The `User` model is structured to map to Clerk user IDs; auth middleware and org-scoped session handling are the next step.
- **Stripe metered billing:** The `Subscription` model already includes `stripeCustomerId`, `stripeSubscriptionId`, `status`, and `plan` fields, ready for Stripe webhook integration.
- **Real-time analytics dashboard:** `UsageEvent` is designed to capture usage data (`eventType`, `quantity`, `metadata`) per organization, intended to feed a live chart via Server-Sent Events or WebSockets.

## Running Locally
1. `npm install`
2. Add your Postgres connection string to `.env` as `DATABASE_URL`
3. `npx prisma migrate dev`
4. `npm run dev`