---
starter_id: vite-react
package_manager: npm
project_name: flowerpot
hints:
  language_family: js
  team_size: solo
  deployment_target: azure-static-web-apps
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: custom
  quality_override: false
  self_check_answers:
    typed: true
    from_official_starter: true
    conventions: true
    docs_current: true
    can_judge_agent: true
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

Flowerpot is a solo, web-app MVP built end-to-end in TypeScript so one language, one toolchain, and shared domain types (`Plant`, `CareTask`, DTOs) span the whole app — a deliberate simplification over the earlier C#/JS split. The frontend is a Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack SPA delivered as an installable PWA; the backend is Azure Functions on the Node.js v4 programming model, also TypeScript, with Bicep/Terraform IaC on Azure. Everything clears the four agent-friendly gates (typed, convention-based, popular-in-training, well-documented) — and a single `js` language family maximizes training-data familiarity for the React/TanStack ecosystem — so `quality_override` is false and the five-point self-check is clean. `starter_id: vite-react` records the frontend (the user-facing surface, bootstrapper-verified); the Azure Functions API is scaffolded alongside it via official CLIs (`npm create vite` + `func` Core Tools with the TS v4 template) in the same repo, sharing a local types package. That extra manual backend step is why confidence is `first-class` rather than `verified`. Auth is in scope (per-user plants); payments, realtime, AI, and background jobs are out. CI/CD is GitHub Actions with auto-deploy-on-merge; deployment targets Azure Static Web Apps (static SPA + integrated Functions API, with built-in auth), finalized in M1L5.
