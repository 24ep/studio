# Stylesheet ownership

`src/app/globals.css` is the entry point and token source. Implementation styles are grouped by ownership:

- `base/`: typography, motion, scrolling, scaling, and global platform behavior.
- `components/`: shared application components such as navigation, notifications, pagination, and banners.
- `features/`: feature-specific layouts that have not yet migrated to CSS modules.
- `vendors/`: isolated overrides for third-party editors.

New feature styles should prefer colocated CSS modules. Do not add page-specific selectors back to `globals.css`.
