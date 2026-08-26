/**
 * App-level route paths that live outside the generated dashboard route tree.
 *
 * The nav generator (`@/nav`) only scans `app/users/dashboard`, so first-run
 * screens that sit above the dashboard shell are declared here instead. Use
 * `routes` from `@/nav` for everything under the dashboard.
 */

/** First-run screen shown to a signed-in user who has no organization yet. */
export const ONBOARDING_PATH = '/users/onboarding';
