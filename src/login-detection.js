export const LOGIN_KEYWORDS = new Set(['login', 'signin', 'sign-in', 'sign_in', 'auth', 'oauth', 'sso', 'passport', 'account']);

export function isLoginLikePage(url) {
    const pathSegments = url.pathname.toLowerCase().split('/').filter(Boolean);
    if (pathSegments.some((segment) => LOGIN_KEYWORDS.has(segment))) {
        return true;
    }
    const hostParts = url.hostname.toLowerCase().split('.');
    return hostParts.some((part) => LOGIN_KEYWORDS.has(part));
}
