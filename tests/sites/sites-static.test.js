import { describe, it, expect, vi } from 'vitest';
import { createBrowserMock } from '../__mocks__/browser-mock.js';

vi.mock('../../src/browser-wrap.js', () => {
    const mock = createBrowserMock();
    return { browser: mock, default: mock };
});

import { getTargetUrl } from '../../src/utils.js';
import sitesJson from '../../src/sites.json' with { type: 'json' };

describe('sites.json structure', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(sitesJson)).toBe(true);
        expect(sitesJson.length).toBeGreaterThan(0);
    });

    it('every entry has hostname (non-empty string)', () => {
        for (const site of sitesJson) {
            expect(typeof site.hostname).toBe('string');
            expect(site.hostname.length).toBeGreaterThan(0);
        }
    });

    it('every entry has title (non-empty string)', () => {
        for (const site of sitesJson) {
            expect(typeof site.title).toBe('string');
            expect(site.title.length).toBeGreaterThan(0);
        }
    });

    it('every entry has param (string or string[])', () => {
        for (const site of sitesJson) {
            const validParam =
                typeof site.param === 'string' ||
                (Array.isArray(site.param) && site.param.every((p) => typeof p === 'string'));
            expect(validParam).toBe(true);
        }
    });

    it('no duplicate hostnames', () => {
        const hostnames = sitesJson.map((s) => s.hostname);
        expect(new Set(hostnames).size).toBe(hostnames.length);
    });

    it('no entry has getTargetUrl (those belong in sites.js)', () => {
        for (const site of sitesJson) {
            expect(site.getTargetUrl).toBeUndefined();
        }
    });

    it('every entry with example has a valid URL', () => {
        for (const site of sitesJson) {
            if (site.example) {
                expect(() => new URL(site.example)).not.toThrow();
            }
        }
    });
});

describe('static site rules extraction', () => {
    const sitesWithExamples = sitesJson.filter((s) => s.example);

    it.each(sitesWithExamples)('$title ($hostname) extracts target from example URL', (site) => {
        const url = new URL(site.example);
        const result = getTargetUrl(url.searchParams, site.param, true);
        expect(result).toBeTruthy();
        expect(result).toMatch(/^https?:\/\//);
    });
});
