import { browser } from './browser-wrap.js';
import { siteManager } from './site-config.js';
import { getTargetUrl, MESSAGE_GET_ALL_SITES } from './utils.js';

let isFuzzy = false;
let isFirefox = false;

// 提取目标 URL 的逻辑
async function extractTargetUrl(link) {
  try {
    if (/^http/.test(link) === false) {
      return '';
    }

    const url = new URL(link);

    const site = siteManager.allSites.find((site) => site.hostname === url.hostname);

    let targetUrl = '';

    if (site) {
      if (site.pathname && !url.pathname.startsWith(site.pathname)) {
        // 如果站点有特定的路径，则需要当前URL的路径也匹配
        targetUrl = '';
        return targetUrl;
      }

      if (typeof site.getTargetUrl === 'function') {
        targetUrl = await site.getTargetUrl(link);
      } else {
        targetUrl = getTargetUrl(url.searchParams, site.param, true);
      }
    } else if (isFuzzy) {
      // 如果没有找到匹配的站点且启用了模糊匹配，则尝试从URL中提取目标URL
      // 只使用常见的参数列表来获取目标 URL （不用所有参数列表是避免误判）
      targetUrl = getTargetUrl(url.searchParams, ['target', 'link', 'href', 'url'], false);
    }

    return targetUrl;
  } catch (_) {
    return '';
  }
}

// browser.webNavigation.onBeforeNavigate
// browser.webNavigation.onCommitted
// 会拦截到一些不必要的请求，比如 iframe 的请求
// 使用 tabs.onUpdated 明确的针对 tab 地址栏的处理

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 如果在中转页面直接刷新 changeInfo.url 会为空， 这种情况下使用 tab.url
  // 为的是开启了模糊匹配后（或者新增了配置后），能处理用户直接在中转页面刷新的场景
  const url = changeInfo.url || tab.url;

  const statusToWatch = isFirefox ? 'complete' : 'loading';
  if (url && changeInfo.status === statusToWatch) {
    try {
      const targetUrl = await extractTargetUrl(url);

      // 如果没有提取到目标地址，或者目标地址和当前地址相同，则不处理

      if (!targetUrl) {
        return;
      }

      const currentUrl = await browser.tabs.get(tabId).then((tab) => tab.url);
      if (new URL(currentUrl).hostname === new URL(targetUrl).hostname) {
        return;
      }

      await browser.tabs.update(tabId, { url: targetUrl });
    } catch (e) {
      // do nothing
    }
  }
});

browser.runtime.onMessage.addListener(async (message) => {
  if (!message || message.type !== MESSAGE_GET_ALL_SITES) {
    return undefined;
  }

  // 每次 UI 请求都主动刷新一次，确保返回最新规则。
  await siteManager.loadRemoteStaticSites();
  await siteManager.loadUserSites();
  return siteManager.allSitesSerializable;
});

// 2.x 是在 browser.runtime.onInstalled 执行 init
// 在 Firefox 中点击 reload 不会触发，所以直接执行 init

const init = async () => {
  const title = browser.i18n.getMessage('actionTitle');
  if (title) {
    browser.action.setTitle({ title });
  }

  siteManager.load();

  // 初始化 fuzzy
  browser.storage.sync.get('fuzzy').then((result) => {
    isFuzzy = result.fuzzy ?? false;
  });

  // 更新 local sites 和 fuzzy
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.sites) {
        siteManager.loadUserSites();
      }

      if (changes.fuzzy) {
        isFuzzy = changes.fuzzy.newValue;
      }
    }
  });

  if (browser.runtime.getBrowserInfo) {
    const info = await browser.runtime.getBrowserInfo();
    isFirefox = info.name.toLocaleLowerCase().includes('firefox');
  }
};
init();
