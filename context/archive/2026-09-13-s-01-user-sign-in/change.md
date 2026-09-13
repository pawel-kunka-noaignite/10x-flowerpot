---
id: s-01-user-sign-in
title: User Sign-In UI and Access Control
status: archived
created: 2026-09-13
archived_at: 2026-09-13T11:27:00Z
updated: 2026-09-13
prd_refs:
  - US-05
  - FR-001
  - FR-002
dependencies:
  - f-02-auth-swa (completed)
  - f-03-species-seed (completed)
success_criteria:
  - ProtectedRoute wrapper implemented and exported
  - Unauthenticated users redirected to /.auth/login/aad
  - Logout button in header/nav, functional logout to /.auth/logout
  - npm run build passes (full type-check)
  - npm run dev starts and manual auth flow works
validation_notes: |
  SWA 401 redirect is not testable locally without SWA emulator or deployed instance.
  Local: verify redirects are in place and button clicks navigate correctly.
  Live (deployed to SWA): smoke test unauthenticated user gets 401 → login redirect.
---

# S-01: User Sign-In UI and Access Control

This is the user-facing sign-in gate: unauthenticated visitors are redirected to login, authenticated users see their empty app (ready for plant management in S-02).

Depends on F-02 (SWA built-in auth infrastructure), which has already been implemented and archived.

## Story

- **Outcome:** Unauthenticated user trying to reach `/` is redirected to `/.auth/login/aad` (Microsoft Entra ID); after login, they see their private app space.
- **Scope in:** ProtectedRoute wrapper (checks `/.auth/me`), logout button in header/nav
- **Scope out:** profile page, password reset, 2FA, detailed user settings (all deferred as NICE-TO-HAVE)
