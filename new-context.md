# Multi-Tenant Public Review URL — Implementation Guide

## Objective

Create a robust, secure, and maintainable system that automatically generates and manages tenant-specific public review URLs for a multi-tenant React + Vite web app using Supabase (Auth, DB, RLS, Edge Functions). The final result should allow each tenant to:

- Provide their business name and Google review link in their tenant settings.
- Generate a clean, friendly public review URL (slug-based) after settings are saved.
- Share that URL publicly so anyone can submit a review without signing in.
- Route reviewers depending on rating (≥4 → Google Reviews; ≤3 → internal feedback flow → thank-you).

This document explains what we are doing, why, and exactly how a developer should implement the solution. It is written for a junior developer and intended to be shared with AI-assisted tooling (Cursor) for context-aware development.

---

# Overview — System Components (plain language)

1. **Master Dashboard (Super Admin)**
   - Creates tenant records.
   - Assigns users to tenant workspaces.
   - Controls top-level provisioning and user invitations.

2. **Tenant Workspace**
   - Users assigned to a tenant log in and manage tenant settings (business name, Google review URL, branding).
   - The tenant must supply required system settings before their public review URL is generated.

3. **Public Review Funnel**
   - A public-facing route where anyone (anon) can leave a rating and optional feedback.
   - Based on rating, the user is redirected to the tenant's Google Review page or to an internal feedback flow.

4. **Supabase**
   - Hosts the database tables, authentication, row-level security (RLS), and Edge Functions.
   - An Edge Function will be used to generate friendly slugs and set the tenant’s public review URL.

5. **React + Vite Frontend**
   - Tenant dashboard pages (settings, reviews list).
   - Public pages (review submission, feedback, thank-you).

---

# Why use an Edge Function for URL generation?

- Centralizes URL generation logic in one trusted place.
- Allows slug creation, uniqueness checks, and safe updates using the Supabase service role (server-side capability).
- Avoids leaking service-role credentials to the client.
- Easier to change URL format later without touching frontend.

---

# Step-by-step Tasks (for the junior dev)

> Before you begin: **BACKUP** the existing database schema and data. Export your current SQL and a data dump. Keep this backup safe — you will be deleting elements and migrating.

## 1. Cleanup (start fresh)

Purpose: remove any old or conflicting tables, policies, functions, and client code paths that do not align with this guide.

What to do:
- Export (backup) the current database schema and data first.
- Identify and list any existing tables and RLS policies related to tenants, tenant users, reviews, or old review URLs.
- Delete or archive old functions and serverless handlers that attempted URL generation if they use a different approach.
- If there are frontend routes or components that assume a different URL pattern, remove or flag them to be replaced.

Delete candidates to inspect (common names — confirm before deleting):
- `tenants`
- `tenant_users` or `tenant_members`
- `reviews`
- any `review_url` columns derived by database computed columns
- old edge functions / serverless functions named like `generate_tenant_url` or `create_review_url`

**Important:** Do not delete anything without confirming backups. If unsure, export the table data to a CSV or JSON and store it in a project archive before removing.

## 2. Recreate the canonical schema (conceptual, db fields explained)

Create the following entities and ensure fields exist as described. This is a conceptual description — the exact SQL will be handled by our infra owner or using migration tooling.

- **Tenants** — each tenant record must contain:
  - unique id
  - reference to the creator (created_by user id)
  - business name (required)
  - google review url (required)
  - review_url (the slug-based, public URL — empty initially, filled by Edge Function)
  - slug (optional field for the friendly path; unique)
  - branding/settings (optional JSON for logo/colors)

- **Tenant Users (tenant_users)** — a mapping table that links users to a tenant and stores their role (owner/admin/staff).

- **Reviews** — stores all public reviews submitted for a tenant. Fields:
  - unique id
  - tenant_id (reference to tenant)
  - reviewer name (optional)
  - rating (1–5)
  - feedback (text, optional)
  - created_at timestamp

Make sure referential integrity is set up, and indexes exist on commonly queried fields (tenant_id, slug).

## 3. Row Level Security (RLS) — rules and rationale (high level)

Purpose: absolutely prevent cross-tenant data leaks. RLS ensures that authenticated tenant users only see or modify records belonging to their tenant.

Required policies (describe desired behavior):

- **Tenants table:**
  - Tenant users can read their tenant record only if they belong to that tenant.
  - Only tenant `owner` role can update tenant settings.

- **Tenant Users table:**
  - Authenticated users can see membership records relevant to them (so they can view who else is in their tenant workspace).

- **Reviews table:**
  - Allow anonymous inserts from the public (so review submitters do not need to sign in). But the insert should only be allowed when a valid tenant_id or slug is provided — the policy must enforce that the tenant reference is not null and corresponds to an existing tenant.
  - Tenant users (authenticated) can read reviews only for their tenant.

**Note for implementer:** configure RLS carefully and test with multiple accounts. Attempt cross-tenant reads and ensure they fail.

## 4. Edge Function: generate-review-url (conceptual)

Purpose: When a tenant completes required settings, call a secure server-side function to create a friendly slug and set the tenant’s `review_url`.

Function responsibilities (plain text):
- Accept a request containing the tenant identifier (e.g., tenant id).
- Fetch the tenant record and verify that `business_name` and `google_review_url` are present.
- Generate a user-friendly slug from the business name (use lowercase, replace non-alphanumeric characters with hyphens, trim duplicate hyphens, remove leading/trailing hyphens).
- Check for slug uniqueness across tenants. If the slug already exists, generate an alternate (for example append `-1`, `-2`, etc. until unique). Return the final chosen slug.
- Compose the full review URL using a base domain environment variable and the slug (e.g., `https://yourapp.com/review/<slug>`).
- Update the tenant record with both `slug` and `review_url` using the service role credentials (server-side only).
- Return the review_url to the caller.

Security notes:
- The Edge Function must run with the Supabase service role key (server-side credential). Never expose this key in client code.
- Validate input and authorization: only trusted callers (authenticated token from tenant user or master API) should trigger this endpoint.

## 5. How the master dashboard should provision a tenant

- Master admin creates a tenant record with minimal information (created_by, placeholder name optional).
- Master assigns one or more users to the tenant via the tenant_users mapping.
- Master sends invite links to users to join the tenant workspace.

**Do not generate the public review URL at provision time.** Wait until the tenant admin logs in and fills required setup fields.

## 6. Tenant first-login flow (what the frontend must enforce)

- When a user logs into the tenant workspace, check the tenant’s record for the presence of `business_name` and `google_review_url`.
- If either field is missing, redirect the user to a **System Settings** form and require completion before allowing access to other tenant features.
- After the user saves the settings, call the Edge Function to generate a slug and the final public `review_url`.
- Display the generated `review_url` prominently in the tenant dashboard and offer a copy-to-clipboard action.

**UX note:** clearly communicate that the public link will only work after settings are saved and the URL generated.

## 7. Public review funnel (frontend behavior — high level)

- Public page path: the public route must use the tenant `slug` (not the UUID) to keep URLs readable and shareable.
- On page load, fetch the tenant by the slug. If not found, show a friendly 404.
- Show the business name and any branding available.
- Require minimal information for the reviewer: rating (1–5), optional name, optional short feedback.
- On submit:
  - Insert the review into the `reviews` table using the Supabase `anon` public key (the insert should be allowed by RLS policy).
  - The insert response must return the review id (or the frontend should capture the created review’s id).
  - If the rating is greater than or equal to 4:
    - Redirect the user to the tenant’s `google_review_url` (open in same tab or new tab per UX decision).
  - If the rating is 3 or lower:
    - Redirect the user to an internal `/feedback` page and provide the `review_id` (as a URL param or by retaining state). The feedback page should allow the reviewer to expand or amend their feedback and then submit.
    - On feedback submit, update the existing review record with the detailed feedback (using the saved `review_id`). After saving, redirect to a thank-you page.

**Important implementation detail:** prefer returning the inserted review id on insert and passing that id into the feedback flow rather than relying on heuristics like "update the latest review for the tenant". This avoids race conditions and prevents accidental updates to the wrong record.

## 8. Tenant dashboard features (what to show and how to secure it)

- Show the tenant’s `review_url`, slug, and a QR code option (optional enhancement).
- Show review metrics: number of reviews, average rating, recent reviews.
- Allow the tenant owner to edit business name / google url (edits should re-run the Edge Function if slug needs to change — see notes below).
- Ensure dashboard requests use the authenticated user session and that RLS only returns reviews for the tenant the user is assigned to.

## 9. Handling edits to business name or slug

- If a tenant owner changes the business name or requests a new slug:
  - Either run the Edge Function to recompute a new slug and set a new `review_url`, or allow a manual slug override in the tenant settings (but validate uniqueness).
  - Consider keeping old slugs active for a grace period and/or create redirect logic from old slugs to the new slug. Plan this ahead if slugs are customer-facing and widely shared.

## 10. Security and anti-abuse

- **Service role key:** only used server-side (Edge Function) — never in frontend bundles.
- **RLS strictness:** test RLS thoroughly. The public insert policy should be narrow and only allow insert with a valid tenant reference.
- **Spam prevention:** add CAPTCHAs or rate-limiting on public review submission endpoints. Consider a low friction CAPTCHA experience for reviewers (e.g., invisible CAPTCHA or a one-click verification) to preserve conversion.
- **Validation:** validate google review URLs server-side (basic sanity checks) to avoid garbage or script-injected links.
- **Monitoring & logging:** log Edge Function calls and failures; track 4xx/5xx and slug generation conflicts.

## 11. Testing & QA checklist (what you must verify)

Before marking the task done, confirm the following with manual tests and automated tests where possible:

- [ ] Backup exists and was tested for restore.
- [ ] Deleted old tables / policies were archived and removed.
- [ ] New schema exists and indexes on tenant_id and slug are present.
- [ ] RLS policies block cross-tenant data access; attempt with two separate tenant accounts and verify isolation.
- [ ] Edge Function correctly generates unique slugs, including handling duplicates.
- [ ] After tenant settings save, the tenant `review_url` is generated and visible in the tenant dashboard.
- [ ] Public review URL (slug-based) loads and displays tenant info.
- [ ] A review insert returns the ID reliably; verify review record saved with correct tenant_id.
- [ ] Rating >= 4 redirects to the tenant google review link.
- [ ] Rating <= 3 redirects to feedback flow with review_id and updates the correct review record on feedback.
- [ ] Re-running the slug generation logic for a tenant who already has a slug behaves predictably (either idempotent or creates an intended change).
- [ ] Ensure the service role key is not present in any frontend bundle.

## 12. Deployment checklist (what environment/config is required)

- Environment variables (server-side only):
  - Base domain (used to compose review URLs)
  - SUPABASE_URL (project URL)
  - SUPABASE_SERVICE_ROLE_KEY (secure, server-only)

- Deploy Edge Function to the Supabase Functions space and make sure it is accessible only to authorized callers.
- Apply DB migrations in staging, test flows, then apply to production after verification.

## 13. Rollback and recovery plan

- If anything looks wrong after deploy:
  - Revert schema changes using the DB backup.
  - Restore previous tenant rows if necessary from the exported backup.
  - Revert or disable the Edge Function until fixes are applied.

## 14. Cursor (AI-assisted) integration guidance

When sharing this task with Cursor or another AI-assisted tool, provide the following context payload so the agent can operate context-aware and safely:

- Tenant context keys: `tenant_id`, `slug`, `business_name`, `google_review_url`, `owner_user_id`
- Operation context: `action` (e.g., `generate_slug`, `apply_settings`, `create_tenant`, `assign_user`, `insert_review`), `caller` (master-dashboard | tenant-user | edge-function`)
- Allowed trust levels: edge-function calls must be performed by the service role agent. Cursor should never be given the service role key directly. Instead, Cursor can request the backend to call the server-side function.

Suggested Cursor responsibilities (examples):
- Validate tenant settings completeness during first login and prompt the developer to call the Edge Function.
- When asked to generate slugs, query the tenants table for uniqueness candidates and propose a list of available slugs.
- Assist with QA by running the RLS test checklist (simulate queries and verify expected access denial or grant).

## 15. Acceptance criteria (how we know it’s done)

- Each tenant can generate and see a friendly `review_url` after saving required settings.
- Public slugs resolve to a working review page for the correct tenant.
- Reviews submitted anonymously are stored under the correct tenant without leaking to other tenants.
- Redirect flow works correctly for high and low ratings.
- Tenant dashboard only returns reviews for that tenant.
- No service-role secrets are exposed in client code.

---

# Handover notes for the implementer

- Work iteratively on a staging environment. Verify each step before applying to production.
- Keep backups and change logs for every destructive operation.
- If anything in the running system diverges from this plan, pause and ask for guidance rather than making ad-hoc changes.

---

If you want, I can next produce either:
- A single migration file (SQL) that creates the new schema and policies; or
- A code-based Edge Function template and example frontend call flow.

Tell me which one you want and I will generate it.
