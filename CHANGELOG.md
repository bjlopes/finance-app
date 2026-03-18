# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Modals centered in viewport**
  - Popups (account selector, receitas, transaction form, subtag filter, bulk edit, parceladas, tag transactions, conta/tag forms) now appear centered in the visible viewport
  - Stays centered regardless of page scroll position

- **Numeric keyboard on mobile**
  - Currency/value fields use `inputMode="decimal"` to show numeric keyboard with decimal on mobile
  - Parcelas count input uses `inputMode="numeric"` when custom value (13+)

- **iPad Pro 11" M4 landscape optimization**
  - New `ipad` breakpoint at 1210px (landscape viewport width)
  - Wider content area (75rem) and increased padding on iPad
  - Dashboard: two-column grid with fixed donut chart column (260–320px)
  - Transações: improved filter grid spacing and padding
  - Contas/Tags: increased card padding

- **Tag hierarchy (3 levels)**
  - Tags support subtags and sub-subtags (tag › subtag › sub-subtag)
  - Create-on-the-fly: create tags, subtags, and sub-subtags when typing a new name
  - Hierarchical display in dashboard and reports with expand/collapse

- **Transactions**
  - Recent-only view: show last 30 days by default with "View all" option
  - Date range filter when viewing all transactions
  - Bulk tag edit: change tags for multiple transactions at once
  - Subtag filter: include/exclude specific subtags when filtering by parent tag

- **UX improvements**
  - All forms (new transaction, tag, account) open in modal/popup to avoid scrolling
  - Full tag path display on mobile with proper wrapping (no truncation)
  - Account name no longer truncated on mobile
  - Improved tag pills layout with flex-wrap

- **Authentication with Supabase**
  - Email-only login via magic link (no password required)
  - User data isolated per account with Row Level Security (RLS)
  - Protected routes: app requires login when Supabase is configured
  - Landing page for unauthenticated users with "Login" and "Create account" options

- **Backup & data safety**
  - Manual backup: export/import JSON from `/backup` page
  - Automatic backup on app open and on every data change
  - Local backup used to restore if main storage is corrupted

- **Transactions**
  - Optional comment field (visible when expanding a transaction)
  - Installments selector: 1–12 parcels or custom value (13–999)
  - Equal split of value across parcels; remainder goes to first parcel
  - Inline editing: edit form replaces the transaction row in the list
  - Autofill: suggestions from previous transactions (description, value, tags, account)

- **Accounts**
  - Credit card support with closing date
  - Custom account management

- **Tags**
  - Types: context, frequency, rule
  - Color customization

- **PWA support**
  - Installable on iPhone and Android
  - Full-screen app experience

### Changed

- Reports page redirects to Dashboard (unified view)
- Dashboard: month selector and hierarchical tag display
- Transaction list: stacked layout on mobile (description above, value/actions below)
- Tag filter: dropdown for subtags (bottom sheet on mobile)

- Navigation shows full menu only when logged in
- Sign out clears local data to prevent data leakage on shared devices
- First login with existing local data uploads it to the user's cloud account

### Fixed

- App freezing when typing in form fields
- White screen crashes
- Parcel value distribution with exact division

---

## [0.1.0] - Initial release

- Dashboard with monthly overview
- Transaction list with tags
- Tag management
- Reports by tag
- Local storage persistence
