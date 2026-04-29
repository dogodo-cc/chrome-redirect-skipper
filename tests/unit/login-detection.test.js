import { describe, it, expect } from 'vitest';
import { isLoginLikePage, LOGIN_KEYWORDS } from '../../src/login-detection.js';

describe('LOGIN_KEYWORDS', () => {
    it('contains expected keywords', () => {
        const expected = ['login', 'signin', 'sign-in', 'sign_in', 'auth', 'oauth', 'sso', 'passport', 'account'];
        for (const keyword of expected) {
            expect(LOGIN_KEYWORDS.has(keyword)).toBe(true);
        }
        expect(LOGIN_KEYWORDS.size).toBe(expected.length);
    });
});

describe('isLoginLikePage', () => {
    function url(str) {
        return new URL(str);
    }

    describe('path segment matching', () => {
        it('detects /login path', () => {
            expect(isLoginLikePage(url('https://example.com/login'))).toBe(true);
        });

        it('detects /signin path', () => {
            expect(isLoginLikePage(url('https://example.com/signin'))).toBe(true);
        });

        it('detects /sign-in path', () => {
            expect(isLoginLikePage(url('https://example.com/sign-in'))).toBe(true);
        });

        it('detects /sign_in path', () => {
            expect(isLoginLikePage(url('https://example.com/sign_in'))).toBe(true);
        });

        it('detects /auth/callback', () => {
            expect(isLoginLikePage(url('https://example.com/auth/callback'))).toBe(true);
        });

        it('detects /oauth/authorize', () => {
            expect(isLoginLikePage(url('https://example.com/oauth/authorize'))).toBe(true);
        });

        it('detects /sso path', () => {
            expect(isLoginLikePage(url('https://example.com/sso'))).toBe(true);
        });

        it('detects /passport path', () => {
            expect(isLoginLikePage(url('https://example.com/passport'))).toBe(true);
        });

        it('detects /account path', () => {
            expect(isLoginLikePage(url('https://example.com/account'))).toBe(true);
        });

        it('detects nested login path', () => {
            expect(isLoginLikePage(url('https://example.com/user/login'))).toBe(true);
        });
    });

    describe('subdomain matching', () => {
        it('detects passport.weibo.com', () => {
            expect(isLoginLikePage(url('https://passport.weibo.com/foo'))).toBe(true);
        });

        it('detects sso.example.com', () => {
            expect(isLoginLikePage(url('https://sso.example.com/'))).toBe(true);
        });

        it('detects auth.example.com', () => {
            expect(isLoginLikePage(url('https://auth.example.com/'))).toBe(true);
        });

        it('detects login.example.com', () => {
            expect(isLoginLikePage(url('https://login.example.com/redirect'))).toBe(true);
        });
    });

    describe('false positives avoided', () => {
        it('does NOT match "blogging"', () => {
            expect(isLoginLikePage(url('https://example.com/blogging'))).toBe(false);
        });

        it('does NOT match "fashion"', () => {
            expect(isLoginLikePage(url('https://example.com/fashion'))).toBe(false);
        });

        it('does NOT match "accounting"', () => {
            expect(isLoginLikePage(url('https://example.com/accounting'))).toBe(false);
        });

        it('does NOT match "notloginpage"', () => {
            expect(isLoginLikePage(url('https://example.com/notloginpage'))).toBe(false);
        });

        it('does NOT match "authorization-guide"', () => {
            expect(isLoginLikePage(url('https://example.com/authorization-guide'))).toBe(false);
        });

        it('does NOT match "passport" as part of a longer subdomain segment', () => {
            expect(isLoginLikePage(url('https://mypassport.example.com/'))).toBe(false);
        });
    });

    describe('non-login pages', () => {
        it('returns false for normal redirect pages', () => {
            expect(isLoginLikePage(url('https://example.com/redirect'))).toBe(false);
        });

        it('returns false for root path', () => {
            expect(isLoginLikePage(url('https://example.com/'))).toBe(false);
        });

        it('returns false for complex paths', () => {
            expect(isLoginLikePage(url('https://example.com/a/b/c'))).toBe(false);
        });

        it('returns false for query-only URLs', () => {
            expect(isLoginLikePage(url('https://example.com/?login=true'))).toBe(false);
        });
    });

    describe('case insensitivity', () => {
        it('matches LOGIN in uppercase path', () => {
            expect(isLoginLikePage(url('https://example.com/LOGIN'))).toBe(true);
        });

        it('matches SSO in mixed case subdomain', () => {
            expect(isLoginLikePage(url('https://SSO.example.com/'))).toBe(true);
        });
    });
});
