# FlexFit Frontend/Backend API Audit

Date: 2026-05-21

Scope audited:
- `src/api/*`
- `src/pages/*`
- `src/components/*`
- `src/hooks/*`
- Backend controllers/services/DTOs under `FlexFit-main`

## Executive Summary

Frontend is partially integrated with the real backend APIs, but Partner pages are not production-safe yet.

Major risks:
- Partner pages often call global APIs (`/api/gyms`, `/api/branches`, `/api/classes`) and do not filter by logged-in partner/owner.
- Several Partner pages are placeholders because backend endpoints do not exist.
- `ExplorePage` still generates hardcoded class/gym sessions from frontend templates even though backend has real class and branch APIs.
- Class status mapping is wrong in Partner UI: frontend uses `Active`, backend only accepts `Open`, `Cancelled`, `Completed`.
- Branch DTO in frontend is missing backend fields `creditCost` and `staffs`.
- Credit wallet uses the correct `/api/users/{userId}/credit-wallet` endpoint backed by `UserCredits`, but some pages still default to `0` or locally mutate credit after backend already deducts/refunds.

## Backend API Inventory

### AuthController

- `POST /api/Auth/register`: used in `src/api/auth.ts`; route/method OK.
- `POST /api/Auth/verify-email`: used; route/method OK.
- `POST /api/Auth/login`: used; route/method OK.
- `POST /api/Auth/google-login`: used; route/method OK.
- `POST /api/Auth/forgot-password`: used; route/method OK.
- `POST /api/Auth/reset-password`: used; route/method OK.

Notes:
- Frontend maps DB role `GymPartner` to local `partner`; OK.
- Login/register error mapping replaces backend details with friendly text. This is acceptable for UX, but not a strict "display backend message" implementation.

### UsersController

- `GET /api/users`: used in admin pages.
- `GET /api/users/{id}`: used by auth/profile flows.
- `PUT /api/users/{id}`: used by profile.
- `PATCH /api/users/{id}/status`: used by admin.
- `DELETE /api/users/{id}`: used by admin.
- `POST /api/users/assign-role`: API function exists.
- `DELETE /api/users/revoke-role?userId=&roleName=`: API function exists.

Status: mostly OK.

### ProfilesController

- `GET /api/profiles/me`: used by `useMemberProfile`.
- `PUT /api/profiles/me`: used by profile update.

Status: OK.

### GymsController

- `GET /api/gyms`: used.
- `GET /api/gyms/{id}`: used/API exists.
- `POST /api/gyms`: API exists.
- `PUT /api/gyms/{id}`: API exists.
- `PATCH /api/gyms/{id}/status`: used by admin.
- `DELETE /api/gyms/{id}`: used by admin/API exists.
- `PUT /api/gyms/transfer-owner`: API exists.

Issues:
- Partner UI calls `GET /api/gyms` but does not filter by `ownerId === loggedInUser.userId`.
- Partner create UI is incomplete; `PartnerGymsPage` button does not call `createGymApi`.

### BranchesController

- `GET /api/branches`: used.
- `GET /api/branches/{id}`: API exists.
- `POST /api/branches`: API exists.
- `PUT /api/branches/{id}`: API exists.
- `PATCH /api/branches/{id}/status`: API exists.
- `DELETE /api/branches/{id}`: API exists.
- `POST /api/branches/assign-staff`: API exists.
- `DELETE /api/branches/remove-staff`: API exists.
- `PUT /api/branches/update-staff`: API exists.

Issues:
- `BranchDto` frontend misses backend fields `creditCost` and `staffs`.
- `CreateBranchRequest` and `UpdateBranchRequest` frontend miss required backend field `creditCost`.
- No dedicated Partner branches page exists in current routes.
- Partner branch dropdowns use all branches, not branches owned by the logged-in partner.

### ClassesController

- `GET /api/classes`: used.
- `GET /api/classes/branch/{branchId}`: used.
- `GET /api/classes/{id}`: used.
- `POST /api/classes`: used.
- `PUT /api/classes/{id}`: used.
- `PATCH /api/classes/{id}/status`: used.
- `DELETE /api/classes/{id}`: used.

Issues:
- Partner pages do not restrict classes to partner-owned gyms/branches.
- Frontend status uses `Active`; backend accepts only `Open`, `Cancelled`, `Completed`.
- Category API does not exist, so frontend cannot fetch categories dynamically. `PartnerDashboard` hardcodes seeded category IDs; `PartnerClassesPage` asks user to type category ID.
- `PartnerClassesPage` import is acceptable as `import type { ClassDto, ... }`, but requested exact line `import { type ClassDto } from "@/api/classes";` is not used.

### BookingsController

- `POST /api/bookings/gym`: used.
- `GET /api/bookings/gym/my-bookings`: used.
- `PUT /api/bookings/gym/{bookingId}/cancel`: used.
- `POST /api/bookings/class`: used.
- `GET /api/bookings/class/my-bookings`: used.
- `PUT /api/bookings/class/{bookingId}/cancel`: used.
- `GET /api/bookings/partner/gym`: API function exists.
- `GET /api/bookings/partner/class`: API function exists.

Issues:
- No Partner bookings page exists in current routes, so partner booking APIs are not surfaced.
- `ExplorePage` books every item through `bookGymSessionApi`, even generated "class" items. Class booking should call `POST /api/bookings/class` with `classId`.
- Frontend locally deducts/refunds credits after booking/cancel, while backend already writes `UserCredits` and `CreditTransactions`. This can temporarily double-count in UI.

### CreditPackageController / Credit API

- `GET /api/credit-packages`: used.
- `GET /api/credit-packages/{id}`: API exists.
- `POST /api/credit-packages`: API exists.
- `PUT /api/credit-packages/{id}`: API exists.
- `PATCH /api/credit-packages/{id}/status`: API exists.
- `PATCH /api/credit-packages/{id}/popular`: API exists.
- `DELETE /api/credit-packages/{id}`: API exists.
- `POST /api/credit-packages/{id}/buy`: API exists but payment flow mostly uses `/api/payment/create`.
- `GET /api/users/{userId}/credit-transactions`: used.
- `GET /api/users/{userId}/credit-wallet`: used; backend service queries `UserCredit/UserCredits`.
- `POST /api/credit-packages/admin-adjustment`: API exists.

Issues:
- `DashboardPage` defaults failed wallet load to `0`; should show "Không thể tải số credit".
- `useMemberWalletSnapshot` handles wallet failure correctly with "Không thể tải số credit".
- Local credit deduction/refund should be removed or replaced by wallet refetch after backend success.

### PaymentController

- `GET /api/payment/packages`: used.
- `POST /api/payment/create`: used.
- `GET/POST /api/payment/callback`: used as GET.
- `POST /api/payment/payos-webhook`: API function exists.
- `GET /api/payment/my-credit`: API function exists.

Status:
- Route/method mostly OK.
- `createPaymentApi` rewrites PayOS URLs on the frontend; should ideally be fixed in backend response generation.

### Missing Backend Controllers Mentioned In Requirements

Not found in current backend:
- `GymSessionsController`
- `ReviewsController`
- `NotificationsController`
- `PartnerController`
- `AdminController`
- Categories controller/API

Frontend placeholders correctly fail for some missing Partner APIs, but `ExplorePage` uses frontend-generated substitutes instead of clearly requiring backend data.

## Partner Pages Audit

### PartnerDashboard

Status: needs fix.

Issues:
- Uses hardcoded dashboard metrics: revenue, new customers, bookings, occupancy.
- Uses hardcoded `revenueData` and `attendanceData`.
- Hardcodes category IDs in `CATEGORY_MAPPING`.
- Calls `getAllBranchesApi()` and `getAllClassesApi()` globally, not partner-scoped.
- Uses `window.confirm` for delete.
- Displays class occupancy as `0/{capacity}` because class booking count is not provided.
- Text hardcodes "FLEXFIT chi nhánh Quận 1".
- Creates class with correct DTO shape, but selected branch can belong to another partner.

### PartnerClassesPage

Status: high priority fix.

Correct:
- Uses real class APIs for list/detail/create/update/status/delete.
- Uses real branch API through `getPartnerBranches`.
- Refreshes class list after create/update/delete/status change.
- Uses backend error message when API layer exposes it.
- Sends create DTO fields: `branchId`, `categoryId`, `className`, `description`, `coachName`, `startTime`, `endTime`, `capacity`, `creditCost`, `difficultyLevel`, `caloriesBurnEstimate`, `thumbnailUrl`.

Issues:
- `getPartnerBranches()` currently calls all `/api/branches`, not partner-owned branches.
- `selectedBranch === "all"` calls `GET /api/classes`, not partner-scoped class list.
- Category dropdown is missing; user types raw category ID. There is no backend categories API.
- Status change sends `Active`, but backend requires `Open`, `Cancelled`, `Completed`.
- UI treats non-`Cancelled` as active, but backend creates classes with `Open`.
- Delete uses `window.confirm`, not the existing confirm dialog UI.
- Edit form cannot change `branchId`; backend update DTO also does not support branch change.
- Uses `any[]` for branches and misses typed `BranchDto`.

### PartnerGymsPage

Status: needs fix.

Issues:
- Calls `GET /api/gyms` and shows all gyms instead of filtering by logged-in owner.
- "Add gym" buttons have no create dialog/API call.
- Gym DTO frontend includes `address/city`, but backend `GymDto` does not return address/city. Address lives on Branch.

### PartnerCustomersPage

Status: blocked by backend.

Issues:
- Calls placeholder `getPartnerCustomers()` which throws.
- No backend endpoint for partner customers exists.

Potential backend source:
- Could derive customers from `GET /api/bookings/partner/gym` and `/api/bookings/partner/class`, but frontend does not do this currently.

### PartnerRevenuePage

Status: blocked by backend.

Issues:
- Calls placeholder `GET /api/partner/revenue`, which does not exist.
- No fallback to aggregate booking/credit transaction data.

### PartnerReviewsPage

Status: blocked by backend.

Issues:
- Calls placeholder `GET /api/partner/reviews`, which does not exist.
- Backend has `Review` model, but no controller/service endpoint.

### PartnerPromotionsPage

Status: blocked by backend.

Issues:
- Calls placeholder `GET /api/partner/promotions`, which does not exist.
- Backend has `Promotion` model, but no controller/service endpoint.

### PartnerSettingsPage / PartnerProfilePage

Status: incomplete.

Issues:
- Current route is settings, not profile.
- It is static UI only and does not call profile/user/gym API.

### Missing Partner Pages

Required by audit request but not present in repo:
- `PartnerBranchesPage`
- `PartnerBookingsPage`
- `PartnerStaffPage`
- `PartnerProfilePage`
- `PartnerGymPage`

Equivalent/current pages:
- `PartnerGymsPage` exists.
- `PartnerCustomersPage`, `PartnerSettingsPage`, `PartnerPromotionsPage` exist.

## Credit / Wallet Audit

Correct:
- Frontend calls `GET /api/users/{userId}/credit-wallet`.
- Backend `CreditService.GetUserCreditAsync` queries `UserCredit`, matching the `UserCredits` table concept.
- `useMemberWalletSnapshot` shows toast "Không thể tải số credit" on failure.

Issues:
- `DashboardPage` catches wallet load errors silently and displays `0`; must display "Không thể tải số credit" instead.
- `deductCreditsLocally()` and `refundCreditsLocally()` are used after real booking/cancel APIs, even though backend already deducts/refunds. This causes inaccurate temporary balances.
- `MyBookingsPage.getBookingCredits()` falls back to hardcoded credit costs by name. Backend returns `creditUsed`; if absent, UI should show unknown/not available rather than guessing.

## Booking Audit

Gym booking:
- Backend `POST /api/bookings/gym` creates/fetches `GymSession` by branch/sessionName/start/end.
- There is no public `GymSessionsController` or slot API to list real sessions.
- `ExplorePage` generates slots on frontend from branch open/close time. This is acceptable only because no session-list API exists, but it should not invent class sessions.

Class booking:
- `ClassBookingPage` correctly uses real `GET /api/classes` and `POST /api/bookings/class`.
- It does not let users choose arbitrary times for classes; it uses `class.startTime/endTime`.
- `ExplorePage` is wrong: it generates Yoga/HIIT/Pilates/Boxing templates and books them as gym sessions, not class bookings.

Insufficient credit:
- `normalizeApiError` maps insufficient credit to "Bạn không đủ credit để đặt lịch".
- `ExplorePage` uses this normalization.
- `ClassBookingPage` does not use `normalizeApiError`, so backend insufficient-credit messages may not be normalized consistently.

## Explore Page Audit

Status: high priority fix.

Correct:
- Branch address mapping uses `address + district + city`.
- Label distinguishes Gym "Mở cửa" and Class "Giờ học".

Issues:
- Still hardcodes `SESSION_TEMPLATES` for Open Gym and classes.
- Does not call `GET /api/classes`, so real classes from DB are not displayed.
- Class cards do not use backend `classId`, `categoryName`, `creditCost`, `startTime/endTime` from `ClassDto`.
- Open Gym credit uses hardcoded template value instead of branch `creditCost`.
- No `sessionId` exists in cards. Backend does not expose a session-list API, but generated IDs are not real session IDs.
- Books generated class-like items via gym booking endpoint.

## Google Maps Audit

Correct:
- `mapUtils` builds maps from `address + district + city` or lat/lng.
- `MyBookingsPage` "Chỉ đường" passes address/district/city/lat/lng, not names.

Issues:
- `BookingResponse` frontend includes `latitude/longitude`, but backend booking response DTO does not return these fields. This is harmless fallback, but not backed by current API.
- Most listing pages show names/addresses only; no "Chỉ đường" buttons were found outside booking detail.

## DTO Mapping Issues

High priority:
- `ClassDto.status`: frontend expects/toggles `Active`, backend uses `Open`, `Cancelled`, `Completed`.
- `BranchDto`: missing `creditCost`, `staffs`.
- `CreateBranchRequest` / `UpdateBranchRequest`: missing `creditCost`.
- `GymDto`: Partner UI expects `address/city`, backend does not return them.
- `BookingResponse`: frontend has `createdAt`, backend returns `bookedAt`; frontend should map/use `bookedAt`.
- `BookingResponse`: frontend has `gymId`, backend booking response does not return `gymId`.

## Priority Fix Checklist

1. Fix `PartnerClassesPage` status values:
   - Use `Open` instead of `Active`.
   - Toggle `Open` <-> `Cancelled`.
   - Update status labels accordingly.

2. Replace `window.confirm` in Partner class/dashboard delete flows with existing confirm dialog component.

3. Make Partner data owner-scoped:
   - Filter gyms by `ownerId === loggedInUser.userId` until backend adds partner-scoped endpoints.
   - Filter branches by gyms owned by partner.
   - Filter classes by partner-owned branch IDs.
   - Validate create class branch belongs to partner-owned branches.

4. Fix Branch DTO/API:
   - Add `creditCost` and `staffs` to frontend `BranchDto`.
   - Include `creditCost` in create/update branch requests.

5. Remove class templates from `ExplorePage`:
   - Load real `GET /api/classes` for class cards.
   - Keep generated gym slots only for open gym if no `GymSessionsController` exists.
   - Use branch `creditCost` for gym/open gym.
   - Use `bookClassApi({ classId })` for class items.

6. Fix wallet behavior:
   - Do not show `0` on wallet API failure.
   - Remove local credit deduction/refund after backend booking/cancel; refetch wallet instead.
   - Normalize insufficient-credit errors in `ClassBookingPage`.

7. Add or expose missing backend APIs if these pages must be fully functional:
   - `GET /api/categories`
   - partner dashboard/revenue/customers/reviews/promotions
   - partner-scoped gyms/branches/classes
   - optional public gym session/slot listing

8. Add missing Partner pages or adjust routes/requirements:
   - Branches
   - Bookings
   - Staff
   - Profile

