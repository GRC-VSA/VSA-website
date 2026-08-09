// src/utils/viewTransition.js

// Wraps a navigate() call in the native View Transitions API when supported,
// giving a smooth crossfade between Register <-> Sign in.
// Falls back to a plain navigate on browsers that don't support it (e.g. Firefox as of writing).
export function navigateWithTransition(navigate, path) {
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            navigate(path);
        });
    } else {
        navigate(path);
    }
}