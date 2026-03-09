# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

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
