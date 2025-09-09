# Tasks

Use this checklist to plan and track. Mark with `[x]` when done.

------------------------------------------------------------
- [x] Task 1: Pin top icons (Theme + User) to viewport
  - [x] Verify current behavior on required pages (Index, Dashboard, Support)
  - [x] Ensure wrappers use `fixed top-4 left-4` and `fixed top-4 right-4`, with `z-50`
  - [x] Confirm no responsive `hidden` classes affect them on mobile
  - [x] Do NOT add icons to Terms/Privacy (as requested)
  - [ ] Cross-check on real deploy after merge

Acceptance:
- Icons don’t scroll and stay in the top corners on Index/Dashboard/Support; remain visible on mobile; positions unchanged.

------------------------------------------------------------
- [ ] Task 2: Add floating "Back to Top" button
  - [ ] Create button that appears after scroll Y > 600px
  - [ ] Style like Dashboard "Back to Search" button
  - [ ] Position `fixed bottom-6 right-6 z-50`; smooth-scroll to top
  - [ ] Mount on Index and Dashboard

Acceptance:
- Button appears when scrolled down and returns smoothly to top.

------------------------------------------------------------
- [ ] Task 3: Results UI — count + user photo per result
  - [ ] Replace "Match Found" with "Found N matches" (pluralization)
  - [ ] Show user photo near every result item (Index + Dashboard)
  - [ ] Keep layout responsive and sanitized
  - [ ] Add tests for header text and per-item image

Acceptance:
- Header shows exact number of matches; every row has the uploaded image thumbnail.

------------------------------------------------------------
- [ ] Task 4: Favorites (star) + Dashboard section
  - [ ] Add star button (outline/filled, hover); tooltip: "Add to favorites"/"Remove from favorites"
  - [ ] Toggle persists per user; prevent duplicates by (user_id, url)
  - [ ] Add collapsible Favorites section in Dashboard
  - [ ] Tests for toggle and rendering

Supabase setup (USER action via SQL editor)
- [ ] USER: Run once in Supabase → SQL Editor:
  ```sql
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
  create policy if not exists "favorites_select_own" on public.favorites for select using (auth.uid() = user_id);
  create policy if not exists "favorites_insert_own" on public.favorites for insert with check (auth.uid() = user_id);
  create policy if not exists "favorites_delete_own" on public.favorites for delete using (auth.uid() = user_id);
  create index if not exists favorites_user_created_at on public.favorites(user_id, created_at desc);
  ```

Frontend steps
- [ ] Add `favorites` helpers (`listFavorites`, `addFavorite`, `removeFavorite`, `isFavorite`)
- [ ] Wire star button in results and history
- [ ] Render Favorites section in Dashboard

Acceptance:
- Star toggles instantly with tooltip; favorites list correctly renders for the user.

------------------------------------------------------------
- [ ] Task 5: Keep last search on Index until tab closed
  - [ ] Save last `currentSearchResult` to `sessionStorage`
  - [ ] Restore on Index mount if state empty
  - [ ] Clear on new search or sign out; include `notBoatMsg`
  - [ ] Tests for store/restore

Acceptance:
- Returning from Dashboard keeps the last results until the tab is closed.

------------------------------------------------------------
- [ ] Task 6: QA & polish
  - [ ] Cross-browser sanity
  - [ ] Accessibility for floating/star buttons
  - [ ] No layout jank on scroll/resize
