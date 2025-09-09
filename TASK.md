# Tasks

Use this checklist to plan and track. Each task has concrete sub‑steps. Mark with `[x]` when done.

------------------------------------------------------------
- [ ] Task 1: Pin top icons (Theme + User) to viewport
  - [ ] Audit current placement on all pages (Index, Dashboard, Terms, Privacy, Support, 404)
  - [ ] Ensure wrappers use `position: fixed`, `top-4 left-4` and `top-4 right-4`, `z-50` and have no responsive `hidden` classes
  - [ ] Extract to a shared `FixedTopControls` included in the root layout so icons are present across routes
  - [ ] Make sure content below has adequate top spacing and icons never overlap modals/toasts
  - [ ] Verify behavior on mobile/tablet/desktop and during resize

Acceptance:
- Icons stay in the top corners while scrolling and resizing on all pages; never disappear on mobile.

------------------------------------------------------------
- [ ] Task 2: Add floating "Back to Top" button
  - [ ] Create `FloatingBackToTop` component: appears after scroll Y > 600px; smooth fade/slide in
  - [ ] Style to match Dashboard "Back to Search" button (size, colors, rounded, shadow)
  - [ ] Position bottom-right (`fixed bottom-6 right-6 z-50`), accessible label and keyboard focus
  - [ ] Implement `window.scrollTo({ top: 0, behavior: 'smooth' })` on click
  - [ ] Mount on Index and Dashboard pages; verify no overlap with toasts

Acceptance:
- Button appears only when scrolled down, returns smoothly to top, consistent with site style.

------------------------------------------------------------
- [ ] Task 3: Results UI — count + user photo per result
  - [ ] Replace header text "Match Found" with "Found N matches" (singular/plural)
  - [ ] Compute count from `searchResult.results.length` with safe fallback
  - [ ] In Index SearchResults: for each match item, render the user’s uploaded image (thumbnail) next to that item
  - [ ] In Dashboard SearchHistory: same per-item user photo rendering using stored `user_image_url`
  - [ ] Keep existing sanitization and layout; ensure cards remain responsive
  - [ ] Update tests covering header text and per-item image rendering

Acceptance:
- Header shows exact number of matches (0, 1, N). Each match row contains a small "Your photo" thumbnail.

------------------------------------------------------------
- [ ] Task 4: Favorites (star) + Dashboard section
  - [ ] Add star button to each result card (top-right inside card)
  - [ ] States: outline (not favorite), filled (favorite), hover color change; tooltip: "Add to favorites" / "Remove from favorites"
  - [ ] Click toggles favorite and persists for the signed-in user
  - [ ] Dashboard: add collapsible Favorites section (like history) that lists favorited results
  - [ ] Prevent duplicates per user+URL; display most recent first
  - [ ] Tests for toggle logic and rendering Favorites list

Supabase setup (USER action via SQL editor; no CLI required)
- [ ] USER: Open Supabase project → SQL Editor → run the SQL below
  ```sql
  -- Favorites table
  create table if not exists public.favorites (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    url text not null,
    title text,
    description text,
    thumbnail text,
    source_json jsonb,
    created_at timestamptz default now(),
    unique (user_id, url)
  );

  alter table public.favorites enable row level security;

  -- RLS policies: user can manage only own favorites
  create policy if not exists "favorites_select_own"
    on public.favorites for select using (auth.uid() = user_id);
  create policy if not exists "favorites_insert_own"
    on public.favorites for insert with check (auth.uid() = user_id);
  create policy if not exists "favorites_delete_own"
    on public.favorites for delete using (auth.uid() = user_id);

  -- Helpful index
  create index if not exists favorites_user_created_at
    on public.favorites(user_id, created_at desc);
  ```

Frontend implementation
- [ ] Add `src/lib/favorites.ts` with `listFavorites`, `isFavorite`, `addFavorite`, `removeFavorite`
- [ ] Wire star button in SearchResults + SearchHistory to call toggle via Supabase
- [ ] Add `Favorites` collapsible panel in Dashboard that fetches and renders entries

Acceptance:
- Star toggles instantly (optimistic UI), persists in DB per user; Favorites section shows items with correct tooltip text and states.

------------------------------------------------------------
- [ ] Task 5: Keep last search on Index until tab closed
  - [ ] Store last successful `currentSearchResult` in `sessionStorage` after each search
  - [ ] Restore from `sessionStorage` on Index mount if no active search is in state
  - [ ] Clear on new search start or when user signs out
  - [ ] Include `notBoatMsg` restore for consistency
  - [ ] Tests for store/restore behavior

Acceptance:
- Navigate to Dashboard and back: last results remain until tab is closed; a fresh search replaces the stored one.

------------------------------------------------------------
- [ ] Task 6: QA & polish
  - [ ] Cross-browser: Chrome, Safari, Firefox (desktop + mobile views)
  - [ ] Accessibility: focus ring on floating/star buttons, tooltips with labels
  - [ ] Performance sanity check; no layout jank on scroll/resize

Notes
- No backend/Edge Function changes expected for these tasks.
- Favorites requires the USER to apply the provided SQL in Supabase once.
