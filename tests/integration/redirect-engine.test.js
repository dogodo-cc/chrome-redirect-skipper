import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/browser-wrap.js', async () => {
    const { createBrowserMock } = await import('../__mocks__/browser-mock.js');
    const mock = createBrowserMock();
    return { browser: mock, default: mock };
});

vi.mock('../../src/sites.js', () => ({
    default: [],
}));

import { extractTargetUrl } from '../../src/redirect-engine.js';
import { siteManager } from '../../src/site-config.js';

describe('extractTargetUrl', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('exact site match (static rules)', () => {
        it('extracts target for a known static site', async () => {
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                { hostname: 'link.juejin.cn', title: '掘金', param: 'target', builtIn: true },
            ]);

            const result = await extractTargetUrl('https://link.juejin.cn/?target=https%3A%2F%2Fexample.com');
            expect(result).toBe('https://example.com');
        });

        it('respects pathname constraint — matches', async () => {
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                { hostname: 'sspai.com', pathname: '/link', title: '少数派', param: 'target', builtIn: true },
            ]);

            const result = await extractTargetUrl('https://sspai.com/link?target=https%3A%2F%2Fexample.com');
            expect(result).toBe('https://example.com');
        });

        it('respects pathname constraint — rejects non-matching path', async () => {
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                { hostname: 'sspai.com', pathname: '/link', title: '少数派', param: 'target', builtIn: true },
            ]);

            const result = await extractTargetUrl('https://sspai.com/other?target=https%3A%2F%2Fexample.com');
            expect(result).toBe('');
        });

        it('extracts target for site with array param', async () => {
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                { hostname: 'weibo.cn', pathname: '/sinaurl', title: '微博', param: ['toasturl', 'url', 'u'], builtIn: true },
            ]);

            const result = await extractTargetUrl('https://weibo.cn/sinaurl?u=https%3A%2F%2Fexample.com');
            expect(result).toBe('https://example.com');
        });
    });

    describe('exact site match (function rules)', () => {
        it('calls site.getTargetUrl for function-based sites', async () => {
            const mockGetTarget = vi.fn().mockResolvedValue('https://target.com');
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                { hostname: 'custom.com', title: 'Custom', getTargetUrl: mockGetTarget, builtIn: true },
            ]);

            const result = await extractTargetUrl('https://custom.com/redirect?url=test');
            expect(result).toBe('https://target.com');
            expect(mockGetTarget).toHaveBeenCalledWith('https://custom.com/redirect?url=test');
        });

        it('handles async getTargetUrl that returns empty', async () => {
            const mockGetTarget = vi.fn().mockResolvedValue('');
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                { hostname: 'custom.com', title: 'Custom', getTargetUrl: mockGetTarget, builtIn: true },
            ]);

            const result = await extractTargetUrl('https://custom.com/redirect');
            expect(result).toBe('');
        });
    });

    describe('fuzzy matching', () => {
        beforeEach(() => {
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([]);
        });

        it('extracts target from unknown site when fuzzy=true', async () => {
            const result = await extractTargetUrl('https://unknown.com/redirect?url=https%3A%2F%2Fexample.com', {
                isFuzzy: true,
            });
            expect(result).toBe('https://example.com');
        });

        it('does NOT extract from unknown site when fuzzy=false', async () => {
            const result = await extractTargetUrl('https://unknown.com/redirect?url=https%3A%2F%2Fexample.com', {
                isFuzzy: false,
            });
            expect(result).toBe('');
        });

        it('skips login-like pages in fuzzy mode', async () => {
            const result = await extractTargetUrl('https://example.com/login?url=https%3A%2F%2Fattacker.com', {
                isFuzzy: true,
            });
            expect(result).toBe('');
        });

        it('skips SSO subdomain pages in fuzzy mode', async () => {
            const result = await extractTargetUrl('https://sso.example.com/callback?url=https%3A%2F%2Fattacker.com', {
                isFuzzy: true,
            });
            expect(result).toBe('');
        });

        it('uses limited param list (target, link, href, url) for fuzzy', async () => {
            const result = await extractTargetUrl('https://unknown.com/redirect?q=https%3A%2F%2Fexample.com', {
                isFuzzy: true,
            });
            expect(result).toBe('');
        });

        it('matches "target" param in fuzzy mode', async () => {
            const result = await extractTargetUrl('https://unknown.com/go?target=https%3A%2F%2Fexample.com', {
                isFuzzy: true,
            });
            expect(result).toBe('https://example.com');
        });

        it('matches "link" param in fuzzy mode', async () => {
            const result = await extractTargetUrl('https://unknown.com/go?link=https%3A%2F%2Fexample.com', {
                isFuzzy: true,
            });
            expect(result).toBe('https://example.com');
        });

        it('matches "href" param in fuzzy mode', async () => {
            const result = await extractTargetUrl('https://unknown.com/go?href=https%3A%2F%2Fexample.com', {
                isFuzzy: true,
            });
            expect(result).toBe('https://example.com');
        });
    });

    describe('error handling', () => {
        it('returns empty string for non-HTTP URLs', async () => {
            expect(await extractTargetUrl('ftp://example.com')).toBe('');
            expect(await extractTargetUrl('javascript:void(0)')).toBe('');
            expect(await extractTargetUrl('data:text/html,test')).toBe('');
        });

        it('returns empty string for invalid URLs', async () => {
            expect(await extractTargetUrl('not-a-url')).toBe('');
            expect(await extractTargetUrl('')).toBe('');
        });

        it('returns empty string when getTargetUrl throws', async () => {
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                {
                    hostname: 'bad.com',
                    title: 'Bad',
                    getTargetUrl: () => {
                        throw new Error('unexpected');
                    },
                },
            ]);

            const result = await extractTargetUrl('https://bad.com/redirect');
            expect(result).toBe('');
        });

        it('returns empty string when getTargetUrl rejects', async () => {
            vi.spyOn(siteManager, 'allSites', 'get').mockReturnValue([
                {
                    hostname: 'bad.com',
                    title: 'Bad',
                    getTargetUrl: () => Promise.reject(new Error('fail')),
                },
            ]);

            const result = await extractTargetUrl('https://bad.com/redirect');
            expect(result).toBe('');
        });
    });
});
