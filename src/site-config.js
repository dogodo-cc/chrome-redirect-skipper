import { browser } from './browser-wrap.js';
import functionSites from './sites.js';

const REMOTE_SITES_JSON_URL = 'https://raw.githubusercontent.com/dogodo-cc/chrome-redirect-skipper/master/src/sites.json';

class SiteManager {
    #builtInFunctionSites = [...functionSites]; // 内置函数规则列表，直接从 sites.js 加载
    #builtInStaticSites = []; // 内置静态规则列表，直接从 sites.json 加载
    #remoteStaticSites = []; // 远程静态规则列表，从 GitHub 加载，优先级高于内置静态规则
    #userSites = []; // 用户自定义规则列表，优先级最高，由用户在选项页添加

    constructor() {
        this.load();
    }

    async load() {
        await Promise.all([this.loadBuiltInStaticSites(), this.loadRemoteStaticSites()]);
        await this.loadUserSites();
        console.log('SiteManager initialized');
    }

    // 获取用户自定义规则列表
    async loadUserSites() {
        browser.storage.sync.get('sites').then((result) => {
            if (Array.isArray(result.sites)) {
                // 如果官方的 sites 已经收录了某些站点，则将其从用户配置列表中删除
                this.#userSites = result.sites
                    .filter((site) => this.officialSites.every((s) => s.hostname !== site.hostname))
                    .map((site) => {
                        return {
                            ...site,
                            builtIn: false,
                        };
                    });

                // 将剔除重复后的 sitesLocal 保存到 storage
                if (this.#userSites.length !== result.sites.length) {
                    browser.storage.sync.set({ sites: this.#userSites });
                }
            }
        });
    }

    // 获取远程静态规则列表
    async loadRemoteStaticSites() {
        try {
            this.#remoteStaticSites = await fetchSitesJson(REMOTE_SITES_JSON_URL, {}, 5000);
        } catch (error) {
            this.#remoteStaticSites = [];
        }
        return this.#remoteStaticSites;
    }

    // 获取内置静态规则列表
    async loadBuiltInStaticSites() {
        if (this.#builtInStaticSites.length > 0) {
            // 已经加载过了，直接返回
            return this.#builtInStaticSites;
        }

        try {
            this.#builtInStaticSites = await fetchSitesJson(browser.runtime.getURL('src/sites.json'));
            return this.#builtInStaticSites;
        } catch (_) {
            this.#builtInStaticSites = [];
            return this.#builtInStaticSites;
        }
    }

    get officialStaticSites() {
        // 获取静态规则列表，远程静态规则优先级高于内置静态规则
        // 按 hostname 去重，优先使用远程规则（#remoteStaticSites）
        const seen = new Set();
        const result = [];

        // 先加入远程规则，确保远程规则优先
        for (const site of this.#remoteStaticSites) {
            if (site && typeof site.hostname === 'string' && !seen.has(site.hostname)) {
                seen.add(site.hostname);
                result.push(site);
            }
        }

        // 再加入内置规则，跳过已存在的 hostname
        for (const site of this.#builtInStaticSites) {
            if (site && typeof site.hostname === 'string' && !seen.has(site.hostname)) {
                seen.add(site.hostname);
                result.push(site);
            }
        }

        return result;
    }

    get officialSites() {
        // 增加 builtIn 标记
        return [...this.#builtInFunctionSites, ...this.officialStaticSites].map((site) => {
            return {
                ...site,
                builtIn: true,
            };
        });
    }

    get allSites() {
        // 官方 + 用户
        return [...this.officialSites, ...this.#userSites];
    }

    get allSitesSerializable() {
        // 获取所有规则的可序列化版本，函数规则会剔除掉 getTargetUrl 函数字段
        return this.allSites.map((site) => {
            const { getTargetUrl: _ignored, ...serializableSite } = site;
            return serializableSite;
        });
    }
}

function isValidStaticSite(site) {
    if (!site || typeof site !== 'object') {
        return false;
    }

    // 静态规则必须包含 hostname 和 title 字段，且不能包含 getTargetUrl 函数字段（函数字段只能在 functionSites 中定义）

    // 域名非空字符串
    if (typeof site.hostname !== 'string' || site.hostname.length === 0) {
        return false;
    }

    // 标题非空字符串
    if (typeof site.title !== 'string' || site.title.length === 0) {
        return false;
    }

    // param 字段如果存在，必须是字符串或字符串数组
    if (site.param != null && typeof site.param !== 'string' && !Array.isArray(site.param)) {
        return false;
    }

    if (site.pathname != null && typeof site.pathname !== 'string') {
        return false;
    }

    if (site.example != null && typeof site.example !== 'string') {
        return false;
    }

    // 不能包含 getTargetUrl 函数字段（函数字段只能在 functionSites 中定义）
    if (site.getTargetUrl != null) {
        return false;
    }

    return true;
}

function filterSites(sites) {
    if (!Array.isArray(sites)) {
        return [];
    }

    return sites.filter(isValidStaticSite);
}

async function fetchSitesJson(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal, ...options });
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return filterSites(data);
    } catch (error) {
        return [];
    } finally {
        clearTimeout(id);
    }
}

export const siteManager = new SiteManager();
export { SiteManager, isValidStaticSite, filterSites, fetchSitesJson };
