# Implementation Plan: S-01 User Sign-In UI and Access Control

## Overview

**Goal:** Build the sign-in gate UI and protect the app so unauthenticated users cannot access plant/task views. Authenticated users land on a protected dashboard (currently empty; S-02 will add plants to it).

**Auth Foundation (F-02, complete):**
- SWA built-in auth via `/.auth/login/aad` (Microsoft Entra ID) and `/.auth/logout`
- `staticwebapp.config.json` routes `/api/*` (except health, species) to require `authenticated` role; unauthenticated → 401 redirect to login
- F-02 already implemented: header parsing in `api/src/lib/auth.ts`, utilities for userId extraction
- Frontend does not yet check auth state or guard routes

**S-01 adds:**
1. **useAuth** hook: fetches `/.auth/me`, exposes `user` (name, email, id) and `loading` state
2. **ProtectedRoute** wrapper: guards routes; unauthenticated users redirected to `/.auth/login/aad`
3. **Header/Nav with logout button:** accessible on protected pages; logout points to `/.auth/logout`
4. **Root layout:** ProtectedRoute wraps the main app, ensures all content is guarded
5. **Success page:** minimal authenticated landing (empty state; S-02 replaces with plant dashboard)

## Architecture

### Hook: `frontend/src/lib/useAuth.ts`

Fetches `/.auth/me` on component mount; returns:

```typescript
interface UseAuthReturn {
  user: { id?: string; email?: string; name?: string } | null;
  loading: boolean;
  error: Error | null;
}
```

**Behavior:**
- On mount: `GET /.auth/me`
- If 200: parse response, cache in React state
- If 401 or fetch fails: `user = null`
- Loading flag true until fetch completes (prevents flash of redirect)

**Testing:** Co-located `useAuth.test.ts` mocks fetch, checks hook states (loading, user, error)

### Component: `frontend/src/components/ProtectedRoute.tsx`

Higher-order component guarding child routes:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    // Show minimal loading state or blank screen
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect unauthenticated users to SWA login endpoint
    window.location.href = '/.auth/login/aad';
    return null;
  }

  return <>{children}</>;
}
```

**Behavior:**
- Waits for `useAuth` hook to resolve
- If unauthenticated (user = null), redirects to `/.auth/login/aad`
- If authenticated, renders children
- No client-side route library needed; simple component wrapper

### Component: `frontend/src/components/Header.tsx`

Navigation bar with logout button:

```typescript
export function Header() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/.auth/logout';
  };

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <h1>Flowerpot</h1>
      <div>
        {user && (
          <>
            <span>{user.name || user.email || 'User'}</span>
            <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>
              Log Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
```

**Behavior:**
- Displays user's name/email (from useAuth)
- Logout button redirects to `/.auth/logout`
- Only shown inside ProtectedRoute (always authenticated)

### Component: `frontend/src/components/Dashboard.tsx`

Authenticated landing page (empty state for now):

```typescript
export function Dashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome to Flowerpot</h2>
      <p>Your plant care dashboard is ready. (S-02: Add plants here)</p>
      {/* S-02 replaces this with plant list and care tasks */}
    </div>
  );
}
```

### Modified: `frontend/src/App.tsx`

Replace the current placeholder with ProtectedRoute + Header + Dashboard:

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <ProtectedRoute>
      <Header />
      <Dashboard />
    </ProtectedRoute>
  );
}
```

**Result:** All content now requires authentication. Unauthenticated users hit ProtectedRoute, redirect to login, and never see the app.

## File Structure

```
frontend/src/
├── components/
│   ├── Header.tsx          (new)
│   ├── Header.test.ts      (new, mocks useAuth)
│   ├── ProtectedRoute.tsx  (new)
│   ├── ProtectedRoute.test.ts (new, mocks useAuth)
│   └── Dashboard.tsx       (new)
├── lib/
│   ├── useAuth.ts          (new, fetches /.auth/me)
│   └── useAuth.test.ts     (new, mocks fetch)
├── App.tsx                 (modified: wrap in ProtectedRoute)
├── App.css                 (unchanged for now)
├── main.tsx                (unchanged)
└── index.css               (unchanged)
```

## Implementation Steps

### Step 1: Create `useAuth` hook
- File: `frontend/src/lib/useAuth.ts`
- Fetch `/.auth/me` on mount
- Parse response (extract user id, email, name)
- Handle errors gracefully (401 → user = null)
- Expose `{ user, loading, error }`
- Add co-located `useAuth.test.ts` with mocked fetch

### Step 2: Create ProtectedRoute component
- File: `frontend/src/components/ProtectedRoute.tsx`
- Use `useAuth` hook
- Show loading state while fetching
- Redirect unauthenticated users to `/.auth/login/aad`
- Render children if authenticated
- Add co-located `ProtectedRoute.test.ts` with mocked useAuth

### Step 3: Create Header component
- File: `frontend/src/components/Header.tsx`
- Display user name/email from `useAuth`
- Logout button → `window.location.href = '/.auth/logout'`
- Add co-located `Header.test.ts` (mocks useAuth, checks logout behavior)

### Step 4: Create Dashboard component
- File: `frontend/src/components/Dashboard.tsx`
- Minimal empty state message ("Welcome to Flowerpot, your dashboard is ready")
- Note: S-02 will replace this with plant list + care tasks

### Step 5: Modify App.tsx
- Remove placeholder content
- Import ProtectedRoute, Header, Dashboard
- Wrap all content: `<ProtectedRoute><Header /><Dashboard /></ProtectedRoute>`
- Run `tsc -b` to type-check

### Step 6: Verify build and dev
- `npm run build` (full type-check)
- `npm run dev` (frontend dev server)
- Manual test: Open app unauthenticated → should redirect to login
- If already authenticated (local cookie): should see header + dashboard + logout button

## Testing Strategy

### Unit Tests (co-located)
- **useAuth.test.ts:** mock fetch, verify hook states (loading, user, error for 401 vs 200)
- **ProtectedRoute.test.ts:** mock useAuth hook, verify loading state shown, redirect for unauthenticated, children rendered for authenticated
- **Header.test.ts:** mock useAuth, verify user name displayed, logout button calls location.href

### Manual Testing (local dev)
1. **Unauthenticated flow:**
   - `npm run dev`
   - Open browser → should be redirected to `/.auth/login/aad` (may show SWA auth page or be blocked in dev)
   - Verify `window.location.href` is set correctly in ProtectedRoute

2. **Authenticated flow (if running behind SWA locally or post-deployment):**
   - Sign in via SWA UI
   - App loads → Header + Dashboard visible
   - User name/email shown in header
   - Logout button → clicks redirect to `/.auth/logout` (SWA handles logout, redirects to login)
   - Refresh → re-checks auth state via `/.auth/me`

### Live Smoke Test (on deployed SWA instance)
- Unauthenticated user navigates to app URL
- SWA routing rule catches 401, redirects to login
- After login, user sees authenticated app (header + dashboard + logout button)
- Logout button works (redirects to `/.auth/logout`, then login page)

## Integration with F-02

F-02 (auth-swa) established:
- `staticwebapp.config.json` routes `/api/*` to require `authenticated` role
- `api/src/lib/auth.ts` has `getUserId()` for parsing `x-ms-client-principal` header

**S-01 does not depend on API changes:**
- Frontend-only: checks auth state via `/.auth/me` (SWA built-in endpoint)
- No new API functions needed for sign-in UI
- API isolation (FR-002) already enforced by `staticwebapp.config.json`; S-01 adds frontend guard

## Success Criteria Verification

| Criterion | How to verify |
|-----------|---------------|
| ProtectedRoute exported | `import { ProtectedRoute } from './components/ProtectedRoute'` works |
| Unauthenticated → redirect to `/.auth/login/aad` | Open app without auth; inspect `window.location.href` or browser URL |
| Logout button functional | Header button visible; click → `window.location.href = '/.auth/logout'` |
| `npm run build` passes | Run build, no type errors |
| `npm run dev` runs | Dev server starts; manual auth flow testable |
| Manual auth test | Unauthenticated redirects; authenticated shows header + dashboard + logout |
| (Optional) Live SWA smoke test | Deployed instance: 401 redirects, auth flow works |

## Known Constraints & Tradeoffs

1. **No client-side router (React Router):** ProtectedRoute is a simple wrapper; if S-02+ needs multiple protected pages (e.g., plant detail, settings), consider adding React Router or a route guard middleware. For now, single-page ProtectedRoute is sufficient.

2. **SWA auth emulation not available locally:** `/.auth/me` and `/.auth/login/aad` are SWA-specific endpoints. In local dev, these may not exist or may fail. Workarounds:
   - Use Azure Functions Core Tools + SWA CLI to emulate SWA locally (complex)
   - Test on deployed SWA instance (simplest for MVP)
   - Mock `/.auth/me` in dev mode (add Vitest setup for unit tests)

3. **Loading state:** While fetching `/.auth/me`, show a simple "Loading..." div. Production may replace with a spinner or skeleton. For S-01, minimal is fine.

4. **Session persistence:** Relies on browser cookies set by SWA; no explicit token refresh. SWA handles cookie lifecycle; app assumes it persists across page loads (standard for SWA auth).

## Rollback Plan

If S-01 has critical issues before S-02:
- Revert `App.tsx`, remove ProtectedRoute wrapper
- Keep `useAuth` and Header/ProtectedRoute as unused exports (safe dead code)
- App returns to unguarded placeholder
- No data loss; no API changes to revert

## Handoff to S-02

S-02 (add-plant-schedule) depends on S-01 for:
- User identity available via `useAuth` (user ID for API calls)
- Protected dashboard layout (Header + main content area)
- Logout functionality (no changes needed)

S-02 will:
- Replace Dashboard's empty state with plant list + care tasks
- Add form to create new plant (gatunek, nickname, light, last-watered date)
- Call API endpoints (F-01: create plant, read plant list) with user ID scoped by F-02 auth

No breaking changes expected from S-01 to S-02; S-01 is a clean guard layer.

## Open Questions

1. **Loading state styling:** Should loading div have a spinner/skeleton, or is bare "Loading..." acceptable for MVP? → Accept bare text for MVP; refine in post-release polish.

2. **Mobile responsiveness:** Header layout OK on mobile, or needs adjustment? → Use flexbox + responsive padding for MVP; polish in post-release.

3. **Error messaging:** If `/.auth/me` fails (network error), should app show error or silently redirect to login? → Silently redirect (safety-first for auth); log error for debugging.

4. **Auth state refresh:** Should app periodically re-check `/.auth/me`, or only on mount? → On mount only; SWA session handled by cookies. Re-check on visibility change if added later.

## References

- **PRD:** `context/foundation/prd.md` (US-05, FR-001, FR-002, Access Control)
- **Roadmap:** `context/foundation/roadmap.md` (S-01 slice)
- **F-02 completed:** `context/archive/2026-09-13-auth-swa/` (SWA auth setup, `staticwebapp.config.json`, `api/src/lib/auth.ts`)
- **Tech stack:** Vite + React 19 + TS, no client-side router yet
- **Lessons:** `context/foundation/lessons.md` (import `@flowerpot/shared` types-only in API; not relevant to frontend-only S-01)
