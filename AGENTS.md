# Project instructions

## Implementation plans

Store implementation plans in the root-level `plans/` directory.

Name every implementation plan:

```text
{FEATURE}.IMPLEMENTATION_PLAN.md
```

Use an uppercase, concise feature name, for example
`INTERNSHIPS.IMPLEMENTATION_PLAN.md`.

## Domain labels

When a domain value needs a user-facing label (for example, teammate
responsibilities), define both together in one exported constant. Derive types,
validation, and UI options from that constant instead of duplicating value or
label lists.

## Feature DTOs

Define shared server-to-client data-transfer types in a feature-scoped shared
module, such as `src/lib/{feature}/types.ts`. Server queries and client
components must consume those DTOs instead of declaring equivalent local
interfaces.

## Feature organization

Group feature-specific code by feature within each application layer:

- UI components and form logic: `src/features/{feature}/`;
- server domain logic, services, and feature HTTP helpers:
  `src/server/{feature}/`;
- shared DTOs and other browser-safe feature contracts: `src/lib/{feature}/`;
- feature tests next to the code they cover.

Place code in a cross-cutting shared location only when it is genuinely used by
multiple features.

Place reusable, domain-agnostic UI primitives (for example, dialogs and modal
wrappers) in `src/components/ui/`, not in a feature directory.
Name React component files after their exported component using PascalCase, for
example `Modal.tsx` and `Button.tsx`. This applies to shared and feature
components; retain framework-required Next.js route filenames such as `page.tsx`
and `layout.tsx`.

## Forms

Use controlled inputs for interactive form fields. Keep their values in React
state and submit that state, rather than relying on `defaultValue`,
`defaultChecked`, or `FormData` as the source of truth.

When a form is rendered in a modal, close the modal after a successful
submission.
