import { siteManager } from './site-config.js';
import { getTargetUrl } from './utils.js';
import { isLoginLikePage } from './login-detection.js';

export async function extractTargetUrl(link, { isFuzzy = false } = {}) {
    try {
        if (/^http/.test(link) === false) {
            return '';
        }

        const url = new URL(link);

        const site = siteManager.allSites.find((site) => site.hostname === url.hostname);

        let targetUrl = '';

        if (site) {
            if (site.pathname && !url.pathname.startsWith(site.pathname)) {
                targetUrl = '';
                return targetUrl;
            }

            if (typeof site.getTargetUrl === 'function') {
                targetUrl = await site.getTargetUrl(link);
            } else {
                targetUrl = getTargetUrl(url.searchParams, site.param, true);
            }
        } else if (isFuzzy) {
            if (!isLoginLikePage(url)) {
                targetUrl = getTargetUrl(url.searchParams, ['target', 'link', 'href', 'url'], false);
            }
        }

        return targetUrl;
    } catch (_) {
        return '';
    }
}
