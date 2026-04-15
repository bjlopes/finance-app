# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Installments (parceladas)**
  - "Encerradas" tab in the parceladas modal for groups where every installment’s bill due date is in the past; open groups remain under "Em aberto"
  - Parceladas button shows counts for open and closed groups when both exist

- **Dashboard**
  - "Saldo por conta": tap a row to open a modal listing every transaction that makes up that balance for the selected month (same `getMesEfetivo` rule as the dashboard, including credit-card billing)
  - Link from that modal to the Transações page with `conta` and `mesEfetivo` query parameters for full editing
  - Tag spending drill-down: edit and delete actions per row, with `TransactionForm` in a stacked overlay

- **Transações**
  - URL filter `mesEfetivo=YYYY-MM` (effective accounting month, aligned with the dashboard); when present, the recent-only window does not hide older rows
  - Banner when `mesEfetivo` is active, with a link to clear it while keeping `conta` and `tag` filters when applicable

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

- `TransactionForm` no longer takes a `transacoes` prop; related installments are always resolved from app context data

- Reports page redirects to Dashboard (unified view)
- Dashboard: month selector and hierarchical tag display
- Transaction list: stacked layout on mobile (description above, value/actions below)
- Tag filter: dropdown for subtags (bottom sheet on mobile)

- Navigation shows full menu only when logged in
- Sign out clears local data to prevent data leakage on shared devices
- First login with existing local data uploads it to the user's cloud account

### Fixed

- **Installment purchases**
  - New installments use one calendar month per parcel from the first date for all accounts; credit-card billing still comes from `getMesEfetivo` / `getDataVencimentoFatura` (fixes wrong last month or duplicate month on the 2nd parcel)
  - Editing installments: always load related rows from the full transaction list (fixes the home "Nova" form where the prop list was empty); if the number of stored rows does not match the `n/total` suffix, the form’s parcel count follows the actual linked rows
  - When normalizing per-parcel values, prefer the total amount field over summing partial rows so totals are not shrunk after a mismatch
  - Reloading the edit form when context updates uses a stable fingerprint of linked rows instead of a new array reference each time, avoiding accidental resets while editing

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
