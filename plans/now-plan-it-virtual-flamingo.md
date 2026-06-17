# Cliqit Super-Admin — Full Self-Sufficiency Plan

## Context

`cliqit-super-admin` (Next.js 15 / App Router / React 19) currently exposes only 3 things: a stats dashboard, influencer vetting (toggle `verified_user`), and a notification test panel. Yet the platform has a rich schema (users, businesses, gigs, events, applications, content submissions, community, chat, notifications, audit log) and the logged-in superAdmin **already has RLS-bypass write access to almost every table**. The gap is purely UI/data-layer: the admin can technically do almost anything in SQL but has no screens for it.

Goal: build out the panel so the super admin can manage **everything** from the app — users/accounts, businesses, gigs, events, applications, content review, community moderation, support/chat, broadcasts, audit, analytics — with the few truly-privileged operations (auth-level user create/delete/ban/password-reset) handled safely.

**Hard constraint (user):** 100% client-side. NO app backend, NO Route Handlers. It's a BaaS — adding an app server alongside Supabase makes no sense. Two existing repos only:
- **cliqit-super-admin** (this Next.js app) — all UI + data layer, talks to Supabase directly with the anon key + the logged-in superAdmin session. No `src/app/api/*`.
- **cliqit-backend** (existing migrations repo, Supabase-only) — add **one new SQL migration** for admin read RPCs + 2 trigger tweaks. RPCs run *inside Postgres*, not a server — fully BaaS-native, consistent with the existing migrations.

## Architecture decision — Pure client-side

| Operation class | Mechanism | Why |
|---|---|---|
| Reads of PII (`email`, `phone_number`, `deleted_at`, etc.) | SECURITY DEFINER RPCs (anon key, gated by `is_super_admin()`) | migration 0113 revoked client SELECT on those columns; RPCs are the existing escape hatch (`admin_list_influencers` pattern). RPC = Postgres function, not a server. |
| Writes to every table (users `deleted_at`/`role`/`verified_user`, gigs, events, applications, business_profiles, community, submissions, slot requests) | **direct client `.update()/.insert()/.delete()` via anon key** | superAdmin RLS-bypass policies allow it; 0113 only revoked SELECT, UPDATE privilege is intact (verified) |
| Reads of `audit_log` / `notification_history` | direct client SELECT (superAdmin has SELECT-only RLS) | already allowed |
| Broadcasts | existing `notify-broadcast` edge fn via `supabase.functions.invoke` | already BaaS-native; reuse `NotificationService` |

### Out of scope — the 5 ops that cannot be client-side (security, not preference)
`auth.admin` ops need the **service_role** key, which must NEVER ship to a browser (it bypasses all RLS — leaking it = full DB compromise). So these are NOT in the app:
- **create auth user, hard-delete auth user, reset password, ban/unban, confirm email** → do in the **Supabase dashboard** (rare admin tasks).
- Most aren't needed anyway: hard-delete is already automated by the existing `soft-delete-cleanup` cron (30-day purge after `deleted_at`); ban ≈ soft-delete (`deleted_at` + RLS hides the user). The app only sets `deleted_at` client-side.
- If ever wanted in-app later: add a **Supabase Edge Function** in cliqit-backend (same project, same pattern as `notify-*`/`instagram-*`; service_role stays server-side). Explicitly deferred / optional.

### Verified backend facts (load-bearing)
- **0113** `revoke select on public.users`, re-grants only `(id, display_name, avatar_url, role, verified_user, onboarding_completed, created_at)`. → reading `email/phone/deleted_at/email_verified/accepted_*/updated_at` needs an RPC; **writing them is unaffected** (UPDATE not revoked).
- **0098** `applications_enforce_rules()` starts `if public.is_super_admin() then return new;` → admin can force **any** application status transition with a plain `.update({status})`. No override RPC needed.
- **Webhook triggers are NOT superAdmin-exempt** (`notify-gig-activity` on app status, `notify-new-gig` on gig→active, `notify-on-update` on submission status, `notify-vetting` on `verified_user`, `notify-new-application` on insert). → every admin status flip fires a real push. **Gate each behind a ConfirmDialog that says "this sends a notification."**
- **business_profiles** has NO column lock; `verified_at` auto-set on insert (0108). Verify/unverify = set/clear `verified_at` directly.
- `recompute_slot_capacity(p_slot_id)` / `recompute_event_capacity(p_event_id)` already exist as RPCs.
- `users_public` view (id, display_name, avatar_url, role) is the safe join source for actor/participant names.
- Auto-audit triggers (0020) record `user.verify`, `user.role_change`, `user.soft_delete` on direct client writes — but NOT restore (clearing `deleted_at`), nor the service-role auth ops.
- **Stale types:** `src/types/application.ts` enums (`pending|accepted|under_review…`) do NOT match DB enums. Define fresh types from real enums; do not import the stale ones.
- **next/image:** Supabase Storage host is not in `next.config.ts remotePatterns`. Render post/chat media with plain `<img>` (avatars via existing `RemoteAvatar` are fine).

---

## Part 1 — Backend migration (cliqit-backend)

**New file:** `cliqit-backend/supabase/migrations/0114_admin_panel.sql`. All RPCs `SECURITY DEFINER`, `set search_path = public`, first line `if not public.is_super_admin() then raise exception 'not authorized' using errcode='42501'; end if;`, `grant execute … to authenticated`. Pattern = existing `admin_list_influencers`.

**Read RPCs (return jsonb):**
- `admin_list_users(p_search, p_role, p_status, p_verified, p_email_conf, p_limit, p_offset, p_sort)` → `{ total, rows[] }` (full user + profile summary; status from `deleted_at`).
- `admin_get_user(p_user_id)` → full users row + influencer/business profile + counts + last delete_request.
- `admin_user_stats()` → counts per role + active/deleted.
- `admin_list_delete_requests()` → delete_requests ⋈ users (email + grace window = `deleted_at + 30d`).
- `admin_list_businesses()` → business_profiles ⋈ users (email + `user_deleted_at`).
- `admin_get_business(p_user_id)` → full profile + email/phone + their gigs/events.
- `admin_get_user_contact(p_user_id)` → `{ email, phone_number, display_name, avatar_url }` (for app/content/chat detail pages).
- Analytics: `admin_platform_stats()` (usersByRole, gigsByStatus, eventsByStatus, submissionsByStatus, applicationsFunnel, influencerVerification), `admin_signup_timeseries(p_bucket, p_from)`, `admin_top_businesses(p_limit)`, `admin_top_influencers(p_limit)`. (Verify exact `applications` status/column names before writing the funnel predicates.)
- *(Optional perf)* `admin_conversation_list(...)` (last-message rollup), `admin_audit_actions()` / `admin_notif_types()` (distinct values for filters).

**Trigger tweaks:**
- Add a `user.restore` branch to `users_audit_trigger` (audit when `deleted_at` cleared) so restore is logged uniformly.
- New `users_protect_last_super_admin` (BEFORE UPDATE/DELETE): block demoting/deleting/suspending the last active superAdmin. Enforces the invariant at the DB layer — works even though the write comes from the client.

No new `audit_log` INSERT policy needed: the everyday admin writes (verify/role/soft-delete) already auto-audit via the existing 0020 triggers.

---

## Part 2 — Shared frontend foundation (cliqit-super-admin)

No server-side code. Everything uses the existing browser client (`src/lib/supabase.ts`, anon key + superAdmin session). `src/app/api/*` is NOT created; `getServiceSupabase()` stays unused.

**Shared UI (thin shadcn wrappers over already-installed Radix):**
- `src/components/ui/`: `toast.tsx` + `use-toast.ts` + `toaster.tsx` (Radix toast — already a dep; mount `<Toaster/>` in `src/components/Providers.tsx`), `alert-dialog.tsx`, `dialog.tsx`, `sheet.tsx`, `tabs.tsx`, `select.tsx`, `switch.tsx`, `textarea.tsx`, `scroll-area.tsx`, `label.tsx`, `separator.tsx`.
- `src/components/shared/confirm-dialog.tsx` — reusable confirm; `destructive` + optional `requireTyping` (type entity name/email to hard-delete) + `loading`.
- Extend `src/components/tables/data-table.tsx` — add `onRowClick`, `toolbar`, `isLoading`, and `manualPagination/manualFiltering` (for server-paginated lists). Add `data-table-column-header.tsx` (sortable header).
- `src/components/shared/media-gallery.tsx` — renders storage-ref arrays via `resolveStorageUrl` + plain `<img>`.
- `src/data/_shared.ts` — `PublicUser` type + `mapPublicUser` (resolves avatar). Reused by community/chat/audit.
- Extend `StatusBadge` (`status-badge.tsx`) with: `applied/started/verification_pending/pending_review`, gig/event/slot-change statuses, compensation types.

**Sidebar IA (`src/components/dashboard/sidebar.tsx`)** — restructure flat list into grouped sections, and replace the hardcoded fake "Admin User / admin@cliqit.com" footer with the real signed-in user:
- **Overview:** Dashboard, Analytics
- **People:** Users, Influencer Review (existing), Businesses
- **Marketplace:** Gigs, Events, Applications
- **Content & Community:** Content, Community
- **Operations:** Support / Chats, Notifications (existing), Audit Log

---

## Part 3 — Feature areas

Convention for every list page: `"use client"`, load via data fn, filter via `useMemo` (small lists use the extended `DataTable`; **large/unbounded lists — chat_messages, audit_log, notification_history — use server-side range/cursor pagination, NOT DataTable**). Each `src/data/<area>.ts` mirrors `influencers.ts` (snake→camel, `resolveStorageUrl`). Destructive / notification-firing actions → `ConfirmDialog` + toast.

### 3.1 Users & accounts — `/dashboard/users`, `/dashboard/users/[id]`, `/dashboard/users/deletion-requests`
`src/data/users.ts`: reads via `admin_list_users` / `admin_get_user` / `admin_user_stats` (RPC). Writes — all **client-side** direct updates: `setUserSuspended` (`deleted_at`), `setUserRole` (`role`), `setUserVerified` (`verified_user`). Deletion-requests inbox: `admin_list_delete_requests` + restore (clear `deleted_at` + delete the request row).
Components: `users-columns.tsx`, `user-actions-menu.tsx`, `user-detail.tsx` (Tabs: Profile / Activity[audit] / Danger Zone).
Guard-rails: can't modify self; can't demote/suspend the **last superAdmin** (enforced by the DB trigger from Part 1, mirrored in UI). **Suspend** (soft, sets `deleted_at`, reversible, RLS hides the user, and the existing `soft-delete-cleanup` cron hard-purges after 30 days) is the panel's account-disable mechanism — covers what "ban" and "delete" would do, without any auth.admin call.
**Not in app (security — service_role only):** create admin user, hard-delete-now, reset password, confirm email, auth-level ban → Supabase dashboard. Note this in the Danger Zone UI as a link/hint rather than a button.

### 3.2 Businesses — `/dashboard/businesses`, `/dashboard/businesses/[id]`
`src/data/businesses.ts`: `fetchBusinesses` (`admin_list_businesses`), `fetchBusinessDetail` (`admin_get_business`). Writes (direct): `setBusinessVerified` (`business_profiles.verified_at`), `updateBusinessProfile` (never send `verified_at/geog/search_vector`), `setBusinessSuspended` (`users.deleted_at` — direct update works). Detail joins business's gigs/events. Edge: suspending user does NOT cancel their live gigs — warn admin; tolerate missing profile row; `business_profiles.verified_at` ≠ `users.verified_user` (don't conflate).

### 3.3 Gigs — `/dashboard/gigs`, `/dashboard/gigs/[id]`
`src/data/gigs.ts` (all direct RLS): `fetchGigs` (join `users!business_id`), `fetchGigDetail` (+ `gig_slots` + applications), `updateGig`, `setGigStatus` (**→active fires notify-new-gig — confirm**), `softDeleteGig`, slot CRUD (`upsertSlot`/`deleteSlot`, never write `capacity_reached`), `recomputeSlotCapacity` (RPC). Detail tabs: Overview / Slots / Applications. Edge: freebie/barter → no amount; lowering capacity doesn't auto-reject.

### 3.4 Events — `/dashboard/events`, `/dashboard/events/[id]`
`src/data/events.ts`: **read `events_with_capacity` view, write base `events` table**. `setEventStatus` (silent — events have no activation webhook), `setEventQrCheckin`, `softDeleteEvent`, `recomputeEventCapacity` (RPC). EventStatus = `draft|active|upcoming|ongoing|completed|cancelled` (define fresh). Capacity nullable = unlimited.

### 3.5 Applications — `/dashboard/applications`, `/dashboard/applications/[id]`
`src/data/applications.ts`: `fetchApplications` (joins `users!influencer_id` + `users!business_id`; resolve polymorphic target title via 2 `.in()` lookups on gigs/events), `setApplicationStatus` (**direct `.update({status})` — admin bypasses state machine per 0098**). UI offers **Guided** transitions (valid per `is_valid_application_transition`) + a gated **Force override** select (all 8 statuses) behind a confirm warning "bypasses flow + sends notification." Catch `23505` (one-active-per-gig unique index) on forced revival → friendly message. Email via `admin_get_user_contact` on detail.

### 3.6 Content submissions — `/dashboard/content`, `/dashboard/content/[id]`
`src/data/content-submissions.ts` (direct): `fetchSubmissions` (join influencer), `fetchSubmissionDetail` (+ `instagram_media_insights!submission_id` 1:1, may be null), `reviewSubmission(id, 'completed'|'rejected', notes)` (**fires notify-on-update — confirm**). Detail: IG embed (reuse `influencer-details-modal` embed approach), insights panel (likes/comments/reach/impressions/engagement% + verified hashtags/mentions) with a small recharts bar. `remarks` = influencer-side (read-only), `notes` = admin side.

### 3.7 Slot-change requests — `/dashboard/requests/slot-changes`
`src/data/slot-change-requests.ts` (direct): `fetchSlotChangeRequests(status?)` (join requester + gig + both slots), `resolveSlotChangeRequest(id, 'approved'|'rejected')` (trigger `slot_change_apply` stamps `resolved_by/at` + moves `applications.slot_id` on approve). Show requested-slot capacity before approving (approving a full slot over-fills it). Hide actions for non-pending.

### 3.8 Community moderation — `/dashboard/community`, `/dashboard/community/[postId]`
`src/data/community.ts` (direct, full CRUD): `fetchCommunityPosts({filter,search,page})` (join `users_public`, embedded like/comment count aggregates), `fetchCommunityPostDetail`, `fetchCommunityComments`, `setPostVisibility` (hide/unhide), `softDeletePost`/`restorePost`, `softDeleteComment`/`restoreComment`. Card/row list (media preview) + segmented filter `all|visible|hidden|deleted`. Status precedence Deleted > Hidden > Visible. Plain `<img>` for media; `onError` placeholder.

### 3.9 Support / Chat viewer (read-only) — `/dashboard/chats`, `/dashboard/chats/[conversationId]`
`src/data/chats.ts` (read-only): `fetchConversations` (two `users_public` joins + gig title; last-message rollup via optional `admin_conversation_list` RPC else 2nd query), `fetchMessages(conversationId, {before, limit})` **cursor/keyset pagination** (newest first, "Load older"). `message-thread.tsx` in a ScrollArea, bubbles by role, image/file via `resolveStorageUrl`, read-only banner "for dispute resolution." No reply box.

### 3.10 Notifications / Broadcast — extend `/dashboard/notifications` (Tabs: Compose | Test | History)
`src/data/audience.ts`: `resolveAudience(target)` + `countAudience(target)` for `all_users | all_influencers | all_businesses | specific_user | filtered_influencers{verified,city,niche}`. `broadcast-composer.tsx` (rhf+zod): audience select, title/body, optional data key/values, **audience-count preview**, mandatory confirm at send-time count. Reuse `NotificationService.sendNotificationToMultipleUsers`, **batched in chunks** with progress + "retry failed only"; distinguish "no device" from real errors. (No edge-fn change for v1.)

### 3.11 Audit log viewer (read-only) — `/dashboard/audit`
`src/data/audit.ts`: `fetchAuditLog(filter)` direct SELECT (`actor:users_public!actor_id`, `count:exact`, **server range pagination**), `fetchAuditActions()`. `audit-table.tsx` (manual pagination footer) + `audit-diff.tsx` (before/after key-diff in a Dialog). Color action badge by prefix (`*.verify/approve`→success, `*.delete`→destructive, `role_change`→warning). Linkify target_id to its admin page where one exists. **Verify the `users_public!actor_id` FK embed resolves**; fallback = batch `fetchUsersByIds` + client map.

### 3.12 Notification history (read-only) — `/dashboard/notifications/history`
`src/data/notification-history.ts`: `fetchNotificationHistory(filter)` direct SELECT (join user, **server range pagination**), `fetchNotificationTypes()`. Default quick-filter "Failed only"; show `error_message`; `data` jsonb in a dialog `<pre>`.

### 3.13 Analytics — `/dashboard/analytics`
`src/data/analytics.ts`: `fetchPlatformStats` (`admin_platform_stats`), `fetchSignupTimeseries(bucket,from)`, `fetchTopBusinesses`, `fetchTopInfluencers`. Wrap each in try/catch → zeros (graceful if RPC not deployed). Components: `kpi-card.tsx`, `chart-card.tsx` (loading/empty states), `charts.tsx`. recharts: PieChart (users by role, verified-vs-pending), LineChart (signups over time, day/week/month selector), BarChart (gigs/events/submissions by status), horizontal Bar (applications funnel + conversion labels, top businesses, top influencers). Brand colors `#9333ea`/`#2563eb`.

---

## File manifest (new unless noted)

**cliqit-backend:** `supabase/migrations/0114_admin_panel.sql`

**cliqit-super-admin:** (no `lib/admin-*`, no `app/api/*` — all client-side)
- ui wrappers: `components/ui/{toast,use-toast,toaster,alert-dialog,dialog,sheet,tabs,select,switch,textarea,scroll-area,label,separator}.tsx`; `components/shared/{confirm-dialog,media-gallery}.tsx`; `components/tables/{data-table.tsx (edit), data-table-column-header.tsx}`
- data: `data/{users,businesses,gigs,events,applications,content-submissions,slot-change-requests,community,chats,audience,audit,notification-history,analytics,_shared}.ts`
- pages: `app/dashboard/{users,users/[id],users/deletion-requests,businesses,businesses/[id],gigs,gigs/[id],events,events/[id],applications,applications/[id],content,content/[id],requests/slot-changes,community,community/[postId],chats,chats/[conversationId],audit,analytics,notifications/history}/page.tsx`; edit `app/dashboard/notifications/page.tsx`
- components: per-area columns/detail/menu/composer/thread/charts; edit `components/dashboard/sidebar.tsx`, `components/Providers.tsx`

## Build sequencing
1. **Backend 0114** (RPCs + triggers) — prerequisite for Users/Businesses PII + analytics.
2. **Shared foundation** — toast/confirm/dialog/tabs/select wrappers, DataTable extension, sidebar IA, StatusBadge additions, fresh enum types.
3. **Users area** (highest value; all client-side RLS + RPC reads).
4. Pure-direct read/write areas (Gigs, Events, Applications, Content, Slot-changes, Community) — no migration dependency.
5. Businesses (depends on RPCs), Support/Chat, Broadcast, Audit, Notification history.
6. Analytics last (depends on analytics RPCs).

## Verification
- `npm run build` + `npm run lint` in cliqit-super-admin (must stay clean).
- Apply 0114 to the Supabase project; smoke-test each RPC via `supabase.rpc` (or REST) returning data for the superAdmin and erroring for a non-admin.
- Manual E2E per area as a logged-in superAdmin (`superadmin@cliqit.dev`): list loads with PII, a client-side write action succeeds and is reflected, the matching `audit_log` row appears (auto-trigger), and notification-firing actions show the confirm dialog.
- Guard-rails: confirm self-modify and last-superAdmin demote/suspend are blocked by the DB trigger (test the raw `.update()` is rejected, not just the UI).
