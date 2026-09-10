# Changelog

All notable changes to HRI Enterprise ATS will be documented in this file.

---


## [1.2.6] - 2026-05-14

### Fixed
- OpenAI provider compatibility: Added fallback handling for `max_completion_tokens` and `max_tokens` so AI features keep working across different OpenAI model families.


## [1.2.5] - 2026-05-07

### Added
- ✨ **applicant Filter Popover**: Refactored applicant filters from a persistent sidebar to a modern popover button in the header, including an **Active Filter Badge** for immediate feedback on applied filters.
- ⚙️ **Manual Filter Apply**: Introduced "Apply Filters" and "Clear All" buttons in the applicant filters to prevent flickering and excessive data reloads while configuring multiple criteria.
- 🧹 **Code Cleanup**: Removed the legacy `applicantsPageSidebar.tsx` and optimized property passing in the applicants page header.

### Fixed
- 🐛 **Azure AD User Search**: Resolved `Request_UnsupportedQuery` error by removing unsupported sorting in the Graph API user fetch query.
- 🎨 **Splash Screen Behavior**: Optimized the splash screen to only show on the first session load, preventing it from appearing during normal page transitions.
- 📏 **Job Description Spacing**: Fixed excessive line spacing in the job description and match criteria sections of the Position Detail view, resulting in a more compact and readable layout.
- 🔧 **Type Safety**: Fixed several TypeScript build errors related to missing interface properties in `applicantFilterValues`.
- 🐛 **Applicant Page Fixes**: Resolved "cn is not defined" error in applicant details and ensured the filter popover remains visible on desktop regardless of horizontal filter settings.


## [1.2.4-beta.1] - 2026-01-27

### Fixed
- ⚡ **Avatar Performance**: Implemented thumbnail optimization for Recruiter Avatars, reducing load times from seconds to milliseconds by resizing images on the server.
- 🐛 **Cross-Domain Cookies**: Resolved "No Session" errors for avatars on UAT/PROD by enforcing relative URLs and fixing the Azure AD sync job to store environment-agnostic paths.
- 🐛 **Duplicate Activity Logs**: Fixed duplicative activity entries when adding comments; now hiding redundant "Comment added" activity logs in favor of the comment feedback itself.

## [1.2.3] - 2026-01-22 (Consolidated Stable Release)

### Added
- ✨ **V2 API Infrastructure**: Introduced a new V2 API architecture (`/api/v2/*`) for high-performance external integrations and automation.
- 🔑 **System API Key Management**: Secure management for external service authentication with role-based permissions and SHA-256 hashing.
- 🔧 **Admin Initialization**: Automated setup of the initial administrator via environment variables for zero-config deployments.
- ️ **Security Controls**: Integrated Screen Capture Protection (blur on focus loss, block PrintScreen) and Right-Click Protection.
- 🚫 **applicant Blacklist**: Comprehensive functionality to flag and filter inappropriate applicants system-wide.
- 💰 **Expected Salary**: Integrated salary expectations into applicant profiles, API logic, and Job Match scoring.
- 🎨 **Email Chip Input**: Modern UI component for managing validated email lists as chips.
- 📊 **Azure AD Sync Progress**: Real-time progress indicators and notifications for user synchronization.
- ☁️ **Azure AD Configuration UI**: Added inputs for Client ID, Secret, and Tenant ID in System Settings to allow database-backed configuration.
- 🔄 **2FA Resend Capability**: Added API endpoint and UI for resending 2FA verification codes.

### Fixed & Secured
- 💥 **System Settings Crash**: Resolved critical `ReferenceError: Cannot access 'n' before initialization` in the API route.
- 🐛 **2FA Flow Reliability**: Fixed Email OTP sending issues, corrected "Disable 2FA" API call, and improved TOTP vs Email messaging.
- 🐳 **Docker Build Fixes**: Added missing `entrypoint-processor.sh` and `build`/`start` npm scripts to ensure reliable container builds.
- 🔒 **Security Hardening**: Addressed 50+ Snyk findings including SQL Injection (via explicit type casts), DOM-based XSS, and Open Redirects.
- 🔒 **Dependency Updates**: Resolved multiple CVEs in critical packages (`validator`, `nodemailer`, `xlsx`, `js-yaml`, etc.).
- 🔒 **Safe Redirects**: Centralized utility to prevent open redirect vulnerabilities across all navigation.
- 🐛 **Auth Reliability**: Resolved `CallbackRouteError`, 2FA bypass bugs, and cookie persistence issues.
- 🐛 **Account Lockout**: Implemented a 3-strike security policy for passwords and 2FA with automated administrator alerts.
- 🐛 **UI/UX Stability**: Fixed Position Drawer visibility, Mobile Filter scrolling, Avatar flickering, and Header layout borders.
- 🐛 **Icon Assets**: Resolved build errors caused by incorrect Heroicon component names/imports.
- 🐛 **Data Consistency**: Resolved "Unique constraint" errors in seeding and 500 errors in Recruitment Stage and applicant APIs.

### Changed & Improved
- � **Architecture Simplification**: Decommissioned the standalone `hri-processor` (moved to n8n/V2 API) and removed Sentry integration.
- 🧱 **Infrastructure**: Removed legacy SigNoz and Elasticsearch dependencies in favor of optimized PostgreSQL audit trails.
- ⚡ **Performance Optimization**: Reduced login times by 50-70% via query consolidation and throttled session activity updates.
- 🔄 **Retry Mechanism**: Enhanced the Upload Queue with manual retry for failed applicant imports.
- 📱 **Standardized Layouts**: Unified User Profile modals and System Settings into consistent, navigable vertical layouts.
- � **JWT Optimization**: Significant cookie size reduction via optimized token storage and fresh metadata fetching.
- 📝 **Auto-Documentation**: Automated SQL comment generation directly from Prisma schema docstrings.

### Removed
- 🔥 **Sentry Integration**: Completely removed `@sentry/nextjs` codebase and configurations.
- 🔥 **Legacy Warning Feature**: Removed `SimpleWarningService` and all associated database models and UI components.
- 📄 **Pagination Limits**: Optimized database performance by removing excessive "1000 items per page" option.

## [1.2.2] - 2026-01-06

### Fixed
- 🐛 **Position Drawer applicants Tab**: Fixed issue where selection tabs were not visible in the Position Drawer when clicking the applicants tab.
- 🐛 **Cookie Persistence**: Resolved issue where sign-out did not clear all service worker caches and local storage, ensuring fresh sessions.
- 🐛 **JWT Token Optimization**: Significantly reduced cookie size by moving large metadata (permissions, avatars) out of the token and into database fetches.
- 🐛 **Mobile Filter FAB**: Added a floating action button on mobile for easier access to applicant filters with a badge indicator for active counts.

### Added
- 🌏 **Asia/Bangkok Timezone**: Native support for Thai timezone in deployments for consistent audit log timestamps.

---

## [1.2.1] - 2026-01-02

### Added
- 🗓️ **Interview Module**: A comprehensive suite for scheduling and managing applicant interviews.
  - **Evaluation Links**: Generate secure, expiring links with QR code support for instant mobile evaluation access.
  - **Automated Scheduling**: Set interview dates, times, and locations with direct integration into applicant profiles.
  - **Meeting Room Booking**: Integration with internal room resources to book actual meeting locations during invitation.
  - **Interviewer Management**: Assign and track internal interviewers per position with automated appointment invitations.
  - **Smart Validation**: Built-in checks to ensure positions have required skills and interviewers configured before scheduling.
  - **Unified Calendar View**: Mobile-responsive calendar for tracking all upcoming interview sessions.
  - **Customizable Invitations**: WYSIWYG/HTML email editor with variable support for personalized interviewer communications.
  - **Security Controls**: Granular control over link expiration and optional login requirements for evaluators.
- 🎨 **System Settings UI**: Redesigned the settings interface with a vertical sidebar and granular categories for better navigation.
- 🎨 **Unified Property Editor**: New "Figma-like" BoxModelInput for precise control over margins, paddings, and borders.

### Fixed
- 🐛 **Plugin Seeding**: Corrected component paths and logic in plugin setup scripts.
- 🐛 **Prisma Sync**: Resolved unique constraint errors (P2002) in the SystemSetting table.

---

## [v0.2.1] - 2026-01-05

### Fixed
- 🐛 **Mobile Attachment Viewing**: Resolved issue where applicant attachments failed to display on mobile devices. Replaced problematic `window.open(blobUrl)` logic with the `FileViewerModal` component for a consistent and reliable viewing experience.

### Improved
- ⚡ **System Settings Caching**: Implemented server-side caching for system settings using Next.js `unstable_cache`. Settings are now cached and revalidated on-demand when updated, reducing redundant database queries.
- 🧹 **Code Consolidation**: Removed redundant `src/lib/settings.ts` and consolidated all system settings logic into `src/lib/systemSettings.ts`.

---

## [v0.2.0] - 2025-12-16

### Added
- ✅ **Evaluation System**: Comprehensive applicant evaluation with expertise skills and personality traits
- ✅ **Warning System**: Real-time data quality warnings with configurable conditions
- ✅ **Headcount Management**: Track hiring requests and headcount allocations
- ✅ **Multiple Job Applications**: Support for applicants applying to multiple positions
- ✅ **AI API Key Fallback**: Multiple API keys with automatic failover
- ✅ **Upload Queue Management**: Enhanced queue processing with SSE updates
- ✅ **Real-time Updates**: SSE-based live collaboration and notifications
- ✅ **Multi-language Support**: Automatic font switching (Inter/Thai fonts)
- ✅ **Mobile Enhancements**: Improved mobile evaluation and navigation

### Changed
- ✅ **Codebase Cleanup**: Removed 30+ unnecessary files
- ✅ **Package.json Optimization**: Cleaned up references to non-existent scripts
- ✅ **Documentation Overhaul**: Split README into focused documentation files

### Improved
- ✅ **Enhanced applicant Management**: Resume history tracking and advanced filtering
- ✅ **Improved Position Management**: Advanced filtering and bulk operations
- ✅ **Comprehensive User Management**: Role-based access control with granular permissions
- ✅ **Task Board Implementation**: Kanban and list views with enhanced filtering
- ✅ **Enhanced Audit Logging**: Search and filter capabilities
- ✅ **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- ✅ **Error Handling**: Improved React rendering and error management
- ✅ **Docker Optimization**: Updated deployment configuration

---

## [v0.1.0] - Initial Release

### Added
- Core ATS functionality
- applicant management
- Position management
- User authentication (Email/Password + Azure AD SSO)
- Role-based access control
- File upload with MinIO
- AI-powered applicant matching
- Dashboard and analytics
- Audit logging

---

## Roadmap

### Planned Features
- Enhanced reporting and analytics
- Mobile application support
- Advanced workflow automation
- Integration with more HR systems
- Enhanced AI capabilities
- Multi-tenant support
- Advanced search and filtering
- Custom dashboard widgets
