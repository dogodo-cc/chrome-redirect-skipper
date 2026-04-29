import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrowserMock } from '../__mocks__/browser-mock.js';

vi.mock('../../src/browser-wrap.js', () => {
    const mock = createBrowserMock();
    return { browser: mock, default: mock };
});

import functionSites from '../../src/sites.js';

describe('function site rules (sites.js)', () => {
    const findSite = (hostname) => functionSites.find((s) => s.hostname === hostname);

    describe('51CTO (blog.51cto.com)', () => {
        const site = findSite('blog.51cto.com');

        it('has correct config', () => {
            expect(site).toBeDefined();
            expect(site.pathname).toBe('/transfer');
            expect(typeof site.getTargetUrl).toBe('function');
        });

        it('extracts target by stripping the hostname prefix', () => {
            const result = site.getTargetUrl('https://blog.51cto.com/transfer?https%3A%2F%2Fcocos.com');
            expect(result).toBe('https%3A%2F%2Fcocos.com');
        });

        it('extracts from example URL', () => {
            const result = site.getTargetUrl(site.example);
            expect(result).toBeTruthy();
        });

        it('returns empty string for URL without query', () => {
            const result = site.getTargetUrl('https://blog.51cto.com/transfer?');
            expect(result).toBe('');
        });
    });

    describe('iPlaySoft (www.iplaysoft.com)', () => {
        const site = findSite('www.iplaysoft.com');

        beforeEach(() => {
            vi.stubGlobal('fetch', vi.fn());
        });

        it('has correct config', () => {
            expect(site).toBeDefined();
            expect(site.pathname).toBe('/link');
            expect(typeof site.getTargetUrl).toBe('function');
        });

        it('fetches page and extracts href from <a class="button">', async () => {
            const html = '<html><body><a class="button" rel="noopener noreferrer" href="https://target.com/download">Download</a></body></html>';
            globalThis.fetch.mockResolvedValueOnce({ text: () => Promise.resolve(html) });

            const result = await site.getTargetUrl('https://www.iplaysoft.com/link/?url=abc123');
            expect(result).toBe('https://target.com/download');
            expect(globalThis.fetch).toHaveBeenCalledWith('https://www.iplaysoft.com/link/?url=abc123');
        });

        it('returns empty string when no matching <a> found', async () => {
            const html = '<html><body><a href="https://other.com">Link</a></body></html>';
            globalThis.fetch.mockResolvedValueOnce({ text: () => Promise.resolve(html) });

            const result = await site.getTargetUrl('https://www.iplaysoft.com/link/?url=abc123');
            expect(result).toBe('');
        });

        it('returns empty string on fetch failure', async () => {
            globalThis.fetch.mockRejectedValueOnce(new Error('network error'));

            const result = await site.getTargetUrl('https://www.iplaysoft.com/link/?url=abc123');
            expect(result).toBe('');
        });
    });

    describe('Baidu Security Captcha (seccaptcha.baidu.com)', () => {
        const site = findSite('seccaptcha.baidu.com');

        it('has correct config', () => {
            expect(site).toBeDefined();
            expect(site.pathname).toBe('/v1/webapi/verint/svcp.html');
            expect(typeof site.getTargetUrl).toBe('function');
        });

        it('extracts s_cap from nested backurl pointing to bsb.baidu.com', () => {
            const result = site.getTargetUrl(site.example);
            expect(result).toBe('https://www.example.com');
        });

        it('returns backurl directly when not pointing to bsb.baidu.com', () => {
            const url = 'https://seccaptcha.baidu.com/v1/webapi/verint/svcp.html?backurl=https%3A%2F%2Fother.com%2Fpath';
            const result = site.getTargetUrl(url);
            expect(result).toBe('https://other.com/path');
        });

        it('returns empty string when backurl is missing', () => {
            const url = 'https://seccaptcha.baidu.com/v1/webapi/verint/svcp.html?ak=test';
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });

        it('returns backurl on malformed inner URL', () => {
            const url = 'https://seccaptcha.baidu.com/v1/webapi/verint/svcp.html?backurl=not-a-valid-url';
            const result = site.getTargetUrl(url);
            expect(result).toBe('not-a-valid-url');
        });
    });

    describe('Baidu Tieba SafeCheck (jump2.bdimg.com)', () => {
        const site = findSite('jump2.bdimg.com');

        beforeEach(() => {
            vi.stubGlobal('fetch', vi.fn());
        });

        it('has correct config', () => {
            expect(site).toBeDefined();
            expect(site.pathname).toBe('/safecheck/index');
            expect(typeof site.getTargetUrl).toBe('function');
        });

        it('fetches page and extracts first non-Baidu href', async () => {
            const html = `
                <a href="https://www.baidu.com/search">Baidu</a>
                <a href="https://jump2.bdimg.com/home">Home</a>
                <a href="https://external-site.com/page">External</a>
                <a href="https://another.com">Another</a>
            `;
            globalThis.fetch.mockResolvedValueOnce({ text: () => Promise.resolve(html) });

            const result = await site.getTargetUrl('https://jump2.bdimg.com/safecheck/index?url=abc');
            expect(result).toBe('https://external-site.com/page');
        });

        it('skips baidu.com and bdimg.com hrefs', async () => {
            const html = `
                <a href="https://baidu.com">B</a>
                <a href="https://tieba.baidu.com">TB</a>
                <a href="https://bdimg.com/img">I</a>
                <a href="https://static.bdimg.com/res">R</a>
                <a href="https://real-target.org">T</a>
            `;
            globalThis.fetch.mockResolvedValueOnce({ text: () => Promise.resolve(html) });

            const result = await site.getTargetUrl('https://jump2.bdimg.com/safecheck/index?url=abc');
            expect(result).toBe('https://real-target.org');
        });

        it('returns empty string when all hrefs are Baidu', async () => {
            const html = '<a href="https://www.baidu.com">B</a><a href="https://jump2.bdimg.com/x">I</a>';
            globalThis.fetch.mockResolvedValueOnce({ text: () => Promise.resolve(html) });

            const result = await site.getTargetUrl('https://jump2.bdimg.com/safecheck/index?url=abc');
            expect(result).toBe('');
        });

        it('returns empty string on fetch failure', async () => {
            globalThis.fetch.mockRejectedValueOnce(new Error('network error'));

            const result = await site.getTargetUrl('https://jump2.bdimg.com/safecheck/index?url=abc');
            expect(result).toBe('');
        });
    });

    describe('Ziyibbs (blog.ziyibbs.com)', () => {
        const site = findSite('blog.ziyibbs.com');

        it('has correct config', () => {
            expect(site).toBeDefined();
            expect(site.pathname).toBe('/go/');
            expect(typeof site.getTargetUrl).toBe('function');
        });

        it('base64-decodes the target param', () => {
            const result = site.getTargetUrl(site.example);
            expect(result).toBe('https://bd.bdwpweb.shop/quark/');
        });

        it('rejects non-http/https decoded URLs', () => {
            const encoded = btoa('ftp://files.example.com/data');
            const url = `https://blog.ziyibbs.com/go/?target=${encoded}`;
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });

        it('rejects javascript: protocol', () => {
            const encoded = btoa('javascript:alert(1)');
            const url = `https://blog.ziyibbs.com/go/?target=${encoded}`;
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });

        it('returns empty string for invalid base64', () => {
            const url = 'https://blog.ziyibbs.com/go/?target=!!!invalid-base64!!!';
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });

        it('returns empty string when target param missing', () => {
            const url = 'https://blog.ziyibbs.com/go/';
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });
    });

    describe('HackV (www.hackv.cn)', () => {
        const site = findSite('www.hackv.cn');

        it('has correct config', () => {
            expect(site).toBeDefined();
            expect(typeof site.getTargetUrl).toBe('function');
        });

        it('base64-decodes the url param', () => {
            const result = site.getTargetUrl(site.example);
            expect(result).toBe('https://hackv.lanzouu.com/b01to9g4sd');
        });

        it('rejects non-http/https decoded URLs', () => {
            const encoded = btoa('ftp://files.example.com');
            const url = `https://www.hackv.cn/%e5%a4%96%e9%93%be%e8%b7%b3%e8%bd%ac.html?url=${encoded}`;
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });

        it('returns empty string for invalid base64', () => {
            const url = 'https://www.hackv.cn/%e5%a4%96%e9%93%be%e8%b7%b3%e8%bd%ac.html?url=!!!bad!!!';
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });

        it('returns empty string when url param missing', () => {
            const url = 'https://www.hackv.cn/%e5%a4%96%e9%93%be%e8%b7%b3%e8%bd%ac.html';
            const result = site.getTargetUrl(url);
            expect(result).toBe('');
        });
    });
});
