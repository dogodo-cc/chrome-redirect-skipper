import { describe, it, expect, vi } from 'vitest';
import { createBrowserMock } from '../__mocks__/browser-mock.js';

vi.mock('../../src/browser-wrap.js', () => {
    const mock = createBrowserMock();
    return { browser: mock, default: mock };
});

import { getTargetUrl, targetParams, generateIssueUrl, MESSAGE_GET_ALL_SITES } from '../../src/utils.js';

describe('getTargetUrl', () => {
    function params(query) {
        return new URL(`https://x.com/?${query}`).searchParams;
    }

    describe('basic param extraction', () => {
        it('extracts value from a single named param', () => {
            expect(getTargetUrl(params('target=https%3A%2F%2Fexample.com'), 'target', false)).toBe('https://example.com');
        });

        it('returns empty string when param is missing', () => {
            expect(getTargetUrl(params('foo=bar'), 'target', false)).toBe('');
        });

        it('returns empty string for empty searchParams', () => {
            expect(getTargetUrl(new URLSearchParams(), 'target', true)).toBe('');
        });

        it('decodes URI-encoded values', () => {
            expect(getTargetUrl(params('url=https%3A%2F%2Fexample.com%2Fpath%3Fq%3D1'), 'url', false)).toBe(
                'https://example.com/path?q=1',
            );
        });

        it('converts string param to array internally', () => {
            const result1 = getTargetUrl(params('target=https://a.com'), 'target', false);
            const result2 = getTargetUrl(params('target=https://a.com'), ['target'], false);
            expect(result1).toBe(result2);
        });
    });

    describe('multiple params (array)', () => {
        it('tries params in order and returns first match', () => {
            expect(getTargetUrl(params('url=https://a.com&target=https://b.com'), ['target', 'url'], false)).toBe(
                'https://b.com',
            );
        });

        it('falls through to second param when first is missing', () => {
            expect(getTargetUrl(params('url=https://a.com'), ['target', 'url'], false)).toBe('https://a.com');
        });
    });

    describe('deepSearch mode', () => {
        it('appends targetParams when deepSearch=true', () => {
            expect(getTargetUrl(params('href=https://example.com'), 'nonexistent', true)).toBe('https://example.com');
        });

        it('prioritizes explicit params over targetParams', () => {
            expect(getTargetUrl(params('custom=https://a.com&target=https://b.com'), 'custom', true)).toBe(
                'https://a.com',
            );
        });

        it('does NOT append targetParams when deepSearch=false', () => {
            expect(getTargetUrl(params('target=https://example.com'), 'nonexistent', false)).toBe('');
        });
    });

    describe('edge cases', () => {
        it('returns value as-is for non-URL values', () => {
            expect(getTargetUrl(params('target=not-a-url'), 'target', false)).toBe('not-a-url');
        });

        it('double-decodes when URLSearchParams + decodeURIComponent both decode', () => {
            expect(getTargetUrl(params('url=https%253A%252F%252Fexample.com'), 'url', false)).toBe(
                'https://example.com',
            );
        });

        it('returns empty string when param value is empty', () => {
            expect(getTargetUrl(params('target='), 'target', false)).toBe('');
        });

        it('uses default params when none specified', () => {
            expect(getTargetUrl(params('target=https://a.com'))).toBe('https://a.com');
        });
    });
});

describe('targetParams', () => {
    it('contains the expected set of param names', () => {
        expect(targetParams).toEqual(['target', 'link', 'href', 'url', 'u', 'to', 'toasturl', 'q']);
    });

    it('does not contain duplicates', () => {
        expect(new Set(targetParams).size).toBe(targetParams.length);
    });
});

describe('generateIssueUrl', () => {
    it('generates a valid GitHub issue URL', () => {
        const url = generateIssueUrl('https://example.com/redirect?url=test');
        expect(url).toContain('https://github.com/dogodo-cc/chrome-redirect-skipper/issues/new?');
        expect(url).toContain(encodeURIComponent('report a new link'));
        expect(url).toContain(encodeURIComponent('https://example.com/redirect?url=test'));
    });

    it('handles special characters in content', () => {
        const url = generateIssueUrl('测试 & <script>');
        expect(url).toContain(encodeURIComponent('测试 & <script>'));
    });
});

describe('MESSAGE_GET_ALL_SITES', () => {
    it('is the expected string constant', () => {
        expect(MESSAGE_GET_ALL_SITES).toBe('get-all-sites');
    });
});
