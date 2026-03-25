# Default Routing Rules

Rules evaluated top-to-bottom; first match wins. The SKILL.md references this file during agent dispatch.

## Backend Engineer

Route when the question involves any of:

- API endpoints, HTTP methods, request/response shapes, REST/GraphQL
- Database schemas, migrations, queries, ORMs, data models
- Authentication, authorization, sessions, tokens, OAuth
- Service layer, business logic, repositories, CQRS
- Infrastructure, deployment, environment config, secrets
- Background jobs, queues, events, webhooks
- Performance, caching, load, scalability
- Security (OWASP Top 10, injection, XSS on server)

## Frontend Engineer

Route when the question involves any of:

- UI components, layouts, pages, visual structure
- CSS, styling systems, design tokens, Tailwind, CSS modules
- Responsive design, breakpoints, mobile layout
- Accessibility, ARIA roles, keyboard navigation, contrast
- Client-side state management, forms, validation
- Animations, transitions, micro-interactions
- Browser APIs, bundle size, Core Web Vitals
- Frontend testing (component tests, visual regression)

## Tester

Route when the question involves any of:

- "What should we test?" / "What could go wrong?"
- Test strategy, coverage decisions, what to skip
- Edge cases, boundary conditions, error paths
- Test framework choice or test organization
- Integration vs unit vs e2e trade-offs
- Risk assessment before shipping
- Missing test coverage in a plan

## Scribe

Route when the question involves any of:

- Prior decisions ("what did we decide about X?")
- Naming conventions ("how do we call X in this project?")
- Documentation of established patterns
- Undocumented behavior that should be recorded
- decisions.md recall or maintenance

## Lead (catch-all)

Route when:

- The question spans multiple domains
- There is a conflict between two domain concerns
- The question is about approach or trade-offs at a system level
- No other specialist clearly owns it
- Synthesizing answers from multiple agents into a recommendation
