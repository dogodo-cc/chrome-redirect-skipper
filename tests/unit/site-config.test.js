import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/browser-wrap.js', async () => {
    const { createBrowserMock } = await import('../__mocks__/browser-mock.js');
    const mock = createBrowserMock();
    return { browser: mock, default: mock };
});

vi.mock('../../src/sites.js', () => ({
    default: [],
}));

import { isValidStaticSite, filterSites, fetchSitesJson } from '../../src/site-config.js';

describe('isValidStaticSite', () => {
    it('accepts valid site with hostname, title, and param', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', param: 'url' })).toBe(true);
    });

    it('accepts site without param', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X' })).toBe(true);
    });

    it('accepts site with array param', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', param: ['url', 'href'] })).toBe(true);
    });

    it('accepts site with pathname', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', pathname: '/redirect' })).toBe(true);
    });

    it('accepts site with example', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', example: 'https://x.com/?url=test' })).toBe(true);
    });

    it('rejects null', () => {
        expect(isValidStaticSite(null)).toBe(false);
    });

    it('rejects non-object', () => {
        expect(isValidStaticSite('string')).toBe(false);
        expect(isValidStaticSite(42)).toBe(false);
    });

    it('rejects missing hostname', () => {
        expect(isValidStaticSite({ title: 'X', param: 'url' })).toBe(false);
    });

    it('rejects empty hostname', () => {
        expect(isValidStaticSite({ hostname: '', title: 'X', param: 'url' })).toBe(false);
    });

    it('rejects missing title', () => {
        expect(isValidStaticSite({ hostname: 'x.com', param: 'url' })).toBe(false);
    });

    it('rejects empty title', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: '', param: 'url' })).toBe(false);
    });

    it('rejects non-string param', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', param: 123 })).toBe(false);
    });

    it('rejects site with getTargetUrl', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', getTargetUrl: () => {} })).toBe(false);
    });

    it('rejects non-string pathname', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', pathname: 123 })).toBe(false);
    });

    it('rejects non-string example', () => {
        expect(isValidStaticSite({ hostname: 'x.com', title: 'X', example: 123 })).toBe(false);
    });
});

describe('filterSites', () => {
    it('returns empty array for null input', () => {
        expect(filterSites(null)).toEqual([]);
    });

    it('returns empty array for non-array input', () => {
        expect(filterSites('string')).toEqual([]);
        expect(filterSites(undefined)).toEqual([]);
        expect(filterSites(42)).toEqual([]);
    });

    it('filters out invalid sites from array', () => {
        const valid1 = { hostname: 'a.com', title: 'A', param: 'url' };
        const invalid = { hostname: '', title: 'Bad' };
        const valid2 = { hostname: 'b.com', title: 'B', param: 'href' };
        expect(filterSites([valid1, invalid, valid2])).toEqual([valid1, valid2]);
    });

    it('returns empty array for all-invalid input', () => {
        expect(filterSites([null, { hostname: '' }, 'string'])).toEqual([]);
    });

    it('returns all items for all-valid input', () => {
        const sites = [
            { hostname: 'a.com', title: 'A', param: 'url' },
            { hostname: 'b.com', title: 'B', param: 'href' },
        ];
        expect(filterSites(sites)).toEqual(sites);
    });
});

describe('fetchSitesJson', () => {
    let mockFetch;

    beforeEach(() => {
        mockFetch = vi.fn();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('fetches and filters valid sites from JSON response', async () => {
        const sites = [
            { hostname: 'a.com', title: 'A', param: 'url' },
            { hostname: '', title: 'Bad' },
            { hostname: 'b.com', title: 'B', param: 'href' },
        ];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(sites),
        });

        const result = await fetchSitesJson('https://example.com/sites.json');
        expect(result).toEqual([sites[0], sites[2]]);
    });

    it('returns empty array on network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('network error'));
        const result = await fetchSitesJson('https://example.com/sites.json');
        expect(result).toEqual([]);
    });

    it('returns empty array on non-OK response', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
        const result = await fetchSitesJson('https://example.com/sites.json');
        expect(result).toEqual([]);
    });

    it('returns empty array on invalid JSON', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.reject(new SyntaxError('invalid json')),
        });
        const result = await fetchSitesJson('https://example.com/sites.json');
        expect(result).toEqual([]);
    });

    it('passes cache: no-store to fetch', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        await fetchSitesJson('https://example.com/sites.json');
        expect(mockFetch).toHaveBeenCalledWith(
            'https://example.com/sites.json',
            expect.objectContaining({ cache: 'no-store' }),
        );
    });

    it('passes signal to fetch for timeout', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        await fetchSitesJson('https://example.com/sites.json', {}, 5000);
        expect(mockFetch).toHaveBeenCalledWith(
            'https://example.com/sites.json',
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
    });

    it('aborts after timeout', async () => {
        mockFetch.mockImplementationOnce(
            (url, options) =>
                new Promise((_, reject) => {
                    options.signal.addEventListener('abort', () => {
                        reject(new DOMException('aborted', 'AbortError'));
                    });
                }),
        );

        const result = await fetchSitesJson('https://example.com/sites.json', {}, 50);
        expect(result).toEqual([]);
    });

    it('merges custom options with defaults', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([]),
        });

        await fetchSitesJson('https://example.com/sites.json', { headers: { 'X-Custom': '1' } });
        expect(mockFetch).toHaveBeenCalledWith(
            'https://example.com/sites.json',
            expect.objectContaining({ cache: 'no-store', headers: { 'X-Custom': '1' } }),
        );
    });
});
