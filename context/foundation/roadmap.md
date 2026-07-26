---
project: "Flowerpot"
version: 1
status: draft
created: 2026-07-26
updated: 2026-07-26
prd_version: 1
main_goal: speed
top_blocker: decisions
---

# Roadmap: Flowerpot

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

Flowerpot planuje pielęgnację roślin domowych jako per-roślinny harmonogram, nie płaską listę zadań. Dla każdej rośliny liczy interwały podlewania/nawożenia/przycinania z gatunku, pory roku i nasłonecznienia, a po każdym odhaczeniu lub przeoczeniu zadania automatycznie przesuwa kolejne terminy. Główny wyróżnik ("wedge" — jedna cecha, bez której produkt staje się zwykłym przypominaczem) to właśnie ten liczony i samokorygujący się harmonogram.

## North star

**S-02: user dodaje roślinę i od razu widzi wyliczony harmonogram pielęgnacji** — to pierwszy przepływ end-to-end, który dowodzi, że silnik harmonogramu działa, i realizuje główne kryterium sukcesu ("dodaje roślinę i widzi konkretny harmonogram w <1 min, bez ręcznej konfiguracji").

> Gwiazda przewodnia = najmniejszy przepływ end-to-end, którego dostarczenie udowadnia główną tezę produktu — ustawiony tak wcześnie, jak pozwalają zależności, bo reszta ma sens tylko jeśli ten rdzeń działa.

## At a glance

| ID | Change ID | Outcome (user can …) | Prerequisites | PRD refs | Status |
|---|---|---|---|---|---|
| F-01 | data-persistence | (foundation) warstwa danych z izolacją per-user | — | NFR (izolacja danych), Access Control | blocked |
| F-02 | auth-entra-external | (foundation) logowanie i weryfikacja tożsamości (Entra External ID + MSAL) | — | FR-001, FR-002, US-05 | ready |
| F-03 | species-seed | (foundation) kuratorowany seed ~15-20 gatunków z bazowymi interwałami | — | FR-030 | ready |
| S-01 | user-sign-in | zaloguje się i widzi wyłącznie własną (pustą) przestrzeń | F-02 | US-05, FR-001, FR-002 | proposed |
| S-02 | add-plant-schedule | doda roślinę i od razu widzi wyliczony harmonogram | F-01, F-03, S-01 | US-01, FR-010, FR-020, FR-030 | proposed |
| S-03 | manage-plants | przegląda, edytuje i usuwa swoje rośliny | S-02 | FR-011, FR-012, FR-013 | proposed |
| S-04 | care-dashboard | widzi zadania "dziś" i "w tym tygodniu" ze wszystkich roślin | S-02 | US-02, FR-021 | proposed |
| S-05 | complete-task-reschedule | odhacza zadanie, a kolejny termin przelicza się od daty wykonania | S-04 | US-03, FR-022 | proposed |
| S-06 | overdue-shift | widzi zaległe zadania i przesunięty przez nie harmonogram | S-05 | US-04, FR-023 | proposed |

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme | Chain | Note |
|---|---|---|---|
| A | Tożsamość i dostęp | `F-02` → `S-01` | Niezależny tor; ready od startu. Odblokowuje per-user scoping w każdym slice. |
| B | Rdzeń pielęgnacji | `F-01` → `S-02` → `S-03`, `S-04` → `S-05` → `S-06` | Główny tor produktu. `S-02` dołącza `S-01` (auth) i `F-03` (gatunki). `S-03` i `S-04` równoległe po `S-02`. |
| C | Dane referencyjne | `F-03` | Standalone, zasila `S-02`. Ready od startu, bez zależności od datastore. |

## Baseline

What's already in place in the codebase as of `2026-07-26` (auto-researched + user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Vite + React 19 + TS SPA (`frontend/src/`, komponenty i `lib/careLabel.ts`).
- **Backend / API:** partial — Azure Functions Node v4 (TS), tylko endpoint `api/src/functions/health.ts`; brak endpointów domenowych.
- **Data:** absent — brak persystencji; `shared/` zawiera tylko typy domeny (`shared/src/index.ts`), zero drivera/ORM.
- **Auth:** absent — brak integracji MSAL/Entra w kodzie (potwierdzone grepem).
- **Deploy / infra:** present — Azure Static Web Apps (Free) + `.github/workflows/deploy.yml` + `infra/main.bicep` (Bicep, żywy deploy na publicznym URL).
- **Observability:** absent — brak logowania/trackingu błędów poza domyślnym runtime.

## Foundations

### F-01: Warstwa danych z izolacją per-user

- **Outcome:** (foundation) wybrany i wpięty datastore z modelem `Plant` / `CareTask` / `CustomSpecies` powiązanym z właścicielem; każdy zapis i odczyt scoped do zalogowanego usera.
- **Change ID:** data-persistence
- **PRD refs:** NFR (izolacja danych — "user nigdy nie widzi cudzych danych"), Access Control
- **Unlocks:** S-02, S-03, S-04 (żaden CRUD ani dashboard nie może persystować bez tej warstwy)
- **Prerequisites:** —
- **Parallel with:** F-02, F-03
- **Blockers:** —
- **Unknowns:**
  - Wybór datastore (Azure SQL vs Table Storage vs Cosmos) + wariant backendu A (managed Functions) vs B (standalone Function App z managed identity) + sposób dostępu (connection string vs managed identity) — Owner: user. Block: yes.
- **Risk:** Najwyżej-lewarowa decyzja MVP: przenika na schemat, kontrakt API i sposób izolacji per-user. Zgadywanie tu = rework całego rdzenia; stąd status blocked do czasu decyzji.
- **Status:** blocked

### F-02: Logowanie i tożsamość (Entra External ID + MSAL)

- **Outcome:** (foundation) użytkownik może założyć konto i się zalogować; API weryfikuje token i wyciąga stabilne `userId` do scoping'u zasobów.
- **Change ID:** auth-entra-external
- **PRD refs:** FR-001, FR-002, US-05
- **Unlocks:** S-01 (widoczne logowanie + redirect), oraz per-user scoping we wszystkich slice'ach rdzenia
- **Prerequisites:** —
- **Parallel with:** F-01, F-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Podejście zdecydowane (Entra External ID + MSAL, osobny tenant) — zostaje realna robota konfiguracyjna, ale bez otwartej niewiadomej blokującej planowanie.
- **Status:** ready

### F-03: Seed gatunków

- **Outcome:** (foundation) statyczny, kuratorowany dataset ~15-20 popularnych roślin z bazowymi interwałami (podlewanie/nawożenie/przycinanie), dostępny dla wyboru gatunku i dla silnika harmonogramu.
- **Change ID:** species-seed
- **PRD refs:** FR-030
- **Unlocks:** S-02 (dodanie rośliny wybiera gatunek; silnik czyta bazowe interwały)
- **Prerequisites:** —
- **Parallel with:** F-01, F-02
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Może być statyczną stałą w `shared/` — nie zależy od decyzji datastore, więc gotowy do planowania od razu; ryzyko tylko w jakości/kompletności danych gatunków.
- **Status:** ready

## Slices

### S-01: Logowanie i kontrola dostępu

- **Outcome:** niezalogowany gość próbujący wejść na dowolny widok roślin/zadań jest przekierowany do logowania; po zalogowaniu widzi wyłącznie własną przestrzeń.
- **Change ID:** user-sign-in
- **PRD refs:** US-05, FR-001, FR-002
- **Prerequisites:** F-02
- **Parallel with:** F-01, F-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Guardrail sukcesu ("user nigdy nie widzi cudzych danych") i twardy prereq gwiazdy przewodniej — dlatego przed S-02, mimo że sam w sobie nie dowodzi tezy produktu.
- **Status:** proposed

### S-02: Dodanie rośliny z wyliczonym harmonogramem

- **Outcome:** user dodaje roślinę (gatunek, nazwa, nasłonecznienie, data ostatniego podlania) i natychmiast widzi ją na liście z wyliczonym harmonogramem (podlewanie/nawożenie/przycinanie).
- **Change ID:** add-plant-schedule
- **PRD refs:** US-01, FR-010, FR-020, FR-030
- **Prerequisites:** F-01, F-03, S-01
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - Dokładny kształt funkcji liczącej interwał (gatunek × pora roku × nasłonecznienie) — Owner: user/team. Block: no (to robota dla `/10x-plan`, nie blokuje sekwencji).
- **Risk:** Gwiazda przewodnia — pierwszy dowód, że silnik harmonogramu działa end-to-end; jednocześnie pierwszy realny zapis do datastore, więc wprost konsumuje decyzję z F-01.
- **Status:** proposed

### S-03: Zarządzanie roślinami (lista / edycja / usuwanie)

- **Outcome:** user przegląda listę swoich roślin, edytuje szczegóły rośliny i usuwa roślinę.
- **Change ID:** manage-plants
- **PRD refs:** FR-011, FR-012, FR-013
- **Prerequisites:** S-02
- **Parallel with:** S-04
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Dopina pełny CRUD po create'cie z S-02; niskie ryzyko, wzorce już ustalone przez gwiazdę przewodnią. Równoległy z dashboardem (S-04).
- **Status:** proposed

### S-04: Dashboard "dziś" i "w tym tygodniu"

- **Outcome:** user otwiera dashboard i widzi zadania pielęgnacyjne pogrupowane jako "dziś" i "w tym tygodniu" ze wszystkich swoich roślin (z pustym stanem, gdy nic nie jest wymagane).
- **Change ID:** care-dashboard
- **PRD refs:** US-02, FR-021
- **Prerequisites:** S-02
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Pierwszy widok agregujący harmonogram — musi czytać terminy z wielu roślin; równoległy z S-03. Fundament pod odhaczanie (S-05).
- **Status:** proposed

### S-05: Odhaczanie zadania przelicza harmonogram

- **Outcome:** user oznacza wymagane zadanie jako wykonane, a jego następne wystąpienie zostaje przeliczone od daty wykonania (widoczne w tej samej interakcji, bez odświeżania).
- **Change ID:** complete-task-reschedule
- **PRD refs:** US-03, FR-022
- **Prerequisites:** S-04
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Druga połowa tezy produktu (harmonogram "się adaptuje"); wymaga istniejącego widoku zadań z S-04. Logika przeliczenia to serce reguły biznesowej.
- **Status:** proposed

### S-06: Zaległe zadania przesuwają harmonogram

- **Outcome:** user widzi zadania po terminie jako zaległe (wizualnie odróżnione), a harmonogram odzwierciedla poślizg; odhaczenie zaległego liczy kolejny termin od faktycznej daty wykonania.
- **Change ID:** overdue-shift
- **PRD refs:** US-04, FR-023
- **Prerequisites:** S-05
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Domyka regułę biznesową (auto-korekta overdue liczona on-read); bazuje na logice przeliczenia z S-05. Ostatni slice rdzenia MVP.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | Ready for `/10x-plan` | Notes |
|---|---|---|---|---|
| F-01 | data-persistence | Wybór i wpięcie warstwy danych (per-user) | no | Blocked: decyzja datastore + wariant A/B + managed identity |
| F-02 | auth-entra-external | Logowanie Entra External ID + MSAL | yes | Run `/10x-plan auth-entra-external` |
| F-03 | species-seed | Seed ~15-20 gatunków z interwałami | yes | Run `/10x-plan species-seed` |
| S-01 | user-sign-in | Logowanie i kontrola dostępu per-user | no | Wymaga F-02 |
| S-02 | add-plant-schedule | Dodanie rośliny z wyliczonym harmonogramem | no | Wymaga F-01 (blocked), F-03, S-01 |
| S-03 | manage-plants | Lista / edycja / usuwanie roślin | no | Wymaga S-02 |
| S-04 | care-dashboard | Dashboard "dziś" / "w tym tygodniu" | no | Wymaga S-02 |
| S-05 | complete-task-reschedule | Odhaczanie przelicza harmonogram | no | Wymaga S-04 |
| S-06 | overdue-shift | Zaległe zadania przesuwają harmonogram | no | Wymaga S-05 |

## Open Roadmap Questions

1. **Wybór warstwy danych** (Azure SQL vs Table Storage vs Cosmos) + wariant backendu A (managed Functions) vs B (standalone Function App z managed identity) + sposób dostępu (connection string vs managed identity) — Owner: user. Block: F-01 (→ S-02, S-03, S-04, S-05, S-06).

## Parked

- **FR-031: własny gatunek z ręcznymi interwałami** — Why parked: nice-to-have w PRD; seed z F-03 pokrywa MVP.
- **Rozpoznawanie rośliny ze zdjęcia** — Why parked: PRD §Non-Goals (gatunek wybierany z listy).
- **Funkcje społecznościowe / współdzielone presety pielęgnacji** — Why parked: PRD §Non-Goals; odłożone post-MVP (unika zimnego startu datasetu).
- **Marketplace / zakupy** — Why parked: PRD §Non-Goals (produkt doradza, nie sprzedaje).
- **Integracja IoT / czujniki sprzętowe** — Why parked: PRD §Non-Goals (wejścia wpisywane ręcznie).
- **Powiadomienia push / mobilne** — Why parked: PRD §Non-Goals w MVP (pielęgnacja w dashboardzie).
- **Internacjonalizacja** — Why parked: PRD §Non-Goals (jeden język — polski — w MVP).
- **Tryb offline-first** — Why parked: PRD §Non-Goals (aplikacja zakłada łączność).

## Done

(Empty on first generation. `/10x-archive` appends entries here when a matching change is archived.)
