# Feature modules

Feature modules contain contracts and behavior shared by routes and reusable components.

- `src/app` owns Next.js routing, layouts, route handlers, and thin route adapters.
- `src/features` owns feature-level types, schemas, client behavior, and server services.
- `src/components/ui` owns application-agnostic UI primitives.
- `src/lib` is reserved for infrastructure shared by multiple features.

Code in `src/components` and `src/features` must not import from `src/app`. The architecture check and ESLint enforce this dependency direction.
