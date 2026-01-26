# Changelog

All notable changes to the **DevinBook** project will be documented in this file.

## [1.3.3] - 2026-01-26
### Added
- **"Financial Intelligence" Hub**: Launched a premium Blog system with high-quality, professional articles focusing on finance strategy, small business reporting, and security.
- **Dynamic SEO Automation**: Implemented automated Sitemap and Robots.txt generation using Next.js Metadata API, ensuring every new blog post is immediately discoverable by search engines.
- **Premium Editorial Design**: Created a distinct blog aesthetic with high-resolution generated imagery and sharp editorial typography optimized for readability.

### Changed
- **Conversion Optimization**: Standardized navigation labels to "Try Now" and "Go to App" across all touchpoints to create a more direct and inviting user journey.
- **Brand Consistency**: Consolidated all metadata and content attribution under the "Team Devinsol" identity.
- **Global Strategy**: Updated SEO and landing page copy to be currency-neutral, explicitly highlighting support for multi-currency transactions.

### Fixed
- **Favicon & Identity**: Optimized the icon system with vector SVG support and high-resolution (96x96) Desktop PNG icons.
- **Accessibility & Contrast**: Resolved "white-on-white" invisibility issues on blog pages by forcing high-contrast typography and overriding system dark-mode inversions for the editorial content.

## [1.3.2] - 2026-01-24
### Added
- **Default Protection & Migration**: Implemented a "fail-safe" system for Categories and Accounts. Default items ("Other Expenses", "Other Income", "Main Wallet") are now protected from deletion.
- **Smart Transaction Migration**: When a category or account is deleted, all its associated transactions are now automatically moved to the default category/account, preventing data loss.
- **Improved Transaction Drawer**: Re-engineered the "Add Transaction" drawer with a side-by-side layout for icon and amount, optimizing vertical space for easier access to the "Add" button on mobile.

### Changed
- **Terminology Standardization**: Streamlined navigation and management labels, ensuring "CATEGORIES" is used consistently across the Manage page and entry forms.
- **UI Spacing**: Reduced excessive vertical padding in transaction forms to minimize scrolling on small screens.

### Fixed
- **Dark Mode Accessibility**: Resolved "white-on-white" contrast issues on the Transactions page and Share Report modal, ensuring active selection states are perfectly readable.
- **Account Filter Logic**: Fixed a bug where multiple account filter pills would highlight incorrectly; now only the active selection is visualized.

## [1.3.1] - 2026-01-24
### Added
- **Featured Accounts**: Users can now mark specific accounts as "Featured" to highlight their balances directly on the Dashboard overview card.
- **Dedicated Login Portal**: Implemented a standalone `/login` route with forced light-mode styling for a professional first-impression.
- **Account Management**: Added a full Edit Account system with visual badges for featured status.

### Changed
- **PWA Optimization**: Updated launch logic to skip the landing page and open directly into the Dashboard for installed app users.
- **Auth Redirection**: Implemented intelligent redirection logic that sends unauthenticated users to `/login` and authenticated users straight to the dashboard.
- **Transaction UI**: Enhanced entry card visibility with improved rounding, deeper shadows (`shadow-md`), and better background contrast.

### Fixed
- **Database Connection Persistence**: Resolved a critical production error (`bufferCommands = false`) by enabling Mongoose command buffering and implementing a middleware to ensure database readiness before processing requests.
- **Transaction Persistence**: Fixed a critical bug where the "Paid From / To" account selection was not being preserved during transaction edits.
- **ID Normalization**: Standardized ID handling between backend and frontend to ensure consistent account and category associations.

## [1.3.0] - 2026-01-21
### Added
- **Landing Page Overhaul**: Entirely new premium, high-density landing page focused on daily expense management.
- **Brand Identity Shift**: Transitioned branding to a vibrant "Electric Purple to Pink" gradient theme.
- **Mobile Guard**: Implemented `DesktopGuard` to enforce mobile-only access for the internal dashboard application while keeping the landing page accessible on PC.
- **SEO & Discoverability**: Added comprehensive SEO metadata, `robots.txt`, and `sitemap.xml`.
- **UX Enhancements**: Enabled smooth scrolling globally and added interactive section anchors.
- **Productivity Features**: Integrated "Live Ledger" and "Daily Burn" widgets into the hero showcase.

## [1.2.6] - 2026-01-20
### Added
- **Rebranding**: Officially renamed application to **DevinBook**.
- **Legal Pages**: Added comprehensive **Terms of Service** and **Privacy Policy** pages.
- **Password Visibility**: Added toggle (eye icon) to show/hide password in the login form.
- **Navigation Logic**: Bottom navigation now automatically hides when the user is not logged in or is on the landing page.

### Changed
- **Auth UI**: Replaced generic icons with the official **Devinsol** logo in the authentication header.
- **Theme Support**: Enhanced `AuthForm` to fully support light mode with system-responsive backgrounds and text.
- **Manifest**: Updated `manifest.json` with new app name and descriptions.
- **Metadata**: Updated SEO metadata and PWA settings in `layout.tsx`.

## [1.2.5] - 2026-01-20
### Added
- **PWA Shortcuts**: Added "Add Transaction", "Categories", and "Profile" shortcuts to `manifest.json` for quick mobile access.
- **Dashboard logic**: Added URL parameter handling (`?action=add`) to trigger the "Add Transaction" modal directly from PWA shortcuts.

### Changed
- **Login Experience**: Completely redesigned the Login/Register page with a **Glassmorphism** aesthetic, improved animations, and a toggle switch.
- **Pie Chart**: Revamped `CategoryPieChart` for better visual density (thicker donut) and added a central "Total Balance" label.

## [1.2.4] - 2026-01-19
### Fixed
- **PDF Generation**: Resolved TypeScript errors related to `jspdf` color handling (`setFillColor` tuples).
- **Chart Tooltips**: Improved styling and data formatting in dashboard charts.

### Changed
- **Mobile Experience**: Set `display: standalone` and `orientation: portrait` in manifest for a native app feel.

## [1.0.0] - 2025-12-29
### Initial Release
- Core Expense Tracking features.
- Dashboard with basic analytics.
- Transaction management (Add/Edit/Delete).
- User Authentication (Login/Register).
