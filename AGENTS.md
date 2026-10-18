# Project rules

- Never add a root `index.html`: the production server treats it as the page template and serves it instead of the rendered app (an empty one made the published site blank).
- Derive Trending from a shared active-game query ordered by accumulated views with stable ties; never rely on manual flags for ranking.
- Generate descriptions through an authenticated admin-only server function and request-scoped streaming AI helpers; never expose prompts or credentials to browsers.
