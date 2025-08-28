import { browser } from './browser-wrap.js';
import { $, i18n, message, generateIssueUrl } from './utils.js';
import sites from './sites.js';

document.addEventListener('DOMContentLoaded', function () {
  const $list = $('sites-list');
  renderSite();

  $list.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-remove')) {
      const hostname = e.target.dataset.hostname;
      if (confirm(`${browser.i18n.getMessage('options_deleteConfirmTip')} ${hostname}?`)) {
        try {
          await deleteSite(hostname);
          renderSite();
        } catch (error) {
          message(error.message || 'Failed to delete site', 'error');
        }
      }
    }
  });

  async function renderSite() {
    const fragment = document.createDocumentFragment();

    const _sites = await getSites();
    _sites.forEach((site) => {
      const li = document.createElement('li');
      li.className = 'site-item';

      // site-info
      const siteInfo = document.createElement('div');
      siteInfo.className = 'site-info';

      const favicon = document.createElement('img');
      favicon.className = 'site-favicon';
      favicon.src = site.favicon || `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(site.hostname)}`;
      favicon.alt = site.title || site.hostname;

      const siteName = document.createElement('span');
      siteName.className = 'site-name';
      siteName.textContent = site.title || site.hostname;

      const siteLink = document.createElement('a');
      siteLink.className = 'site-hostname';
      siteLink.href = `https://${site.hostname}`;
      siteLink.target = '_blank';
      siteLink.textContent = site.hostname;

      siteInfo.appendChild(favicon);
      siteInfo.appendChild(siteName);
      siteInfo.appendChild(siteLink);

      // site-actions
      const siteActions = document.createElement('div');
      siteActions.className = 'site-actions';

      if (!site.builtIn) {
        const btnRemove = document.createElement('span');
        btnRemove.className = 'btn btn-remove';
        btnRemove.dataset.hostname = site.hostname;
        btnRemove.title = 'i18n:options_deleteTip';
        btnRemove.textContent = '❌';

        const createIssue = document.createElement('a');
        createIssue.className = 'btn create-issue';
        createIssue.href = ` ${generateIssueUrl(site.example || site.hostname)} `;
        createIssue.target = '_blank';
        createIssue.title = 'i18n:options_reportTip';
        createIssue.textContent = '🙋';

        siteActions.appendChild(btnRemove);
        siteActions.appendChild(createIssue);
      }

      li.appendChild(siteInfo);
      li.appendChild(siteActions);

      fragment.appendChild(li);
    });

    $list.innerHTML = '';
    $list.appendChild(fragment);

    // li 是动态创建的，需要重新绑定 i18n
    i18n();
  }

  // 高级设置

  const $fuzzy = $('fuzzy');

  browser.storage.sync.get('fuzzy').then((result) => {
    $fuzzy.checked = result.fuzzy || false;
  });

  $fuzzy.addEventListener('change', () => {
    browser.storage.sync.set({ fuzzy: $fuzzy.checked }).then(() => {
      if (browser.runtime.lastError) {
        message(browser.runtime.lastError.message, 'error');
      }
    });
  });
});

function getSites() {
  const builtInSites = sites.map((site) => ({
    ...site,
    builtIn: true,
  }));

  return new Promise((resolve) => {
    browser.storage.sync.get('sites').then((result) => {
      if (browser.runtime.lastError) {
        resolve(builtInSites);
      } else {
        resolve([
          ...builtInSites,
          ...(result.sites || []).map((site) => ({
            ...site,
            builtIn: false,
          })),
        ]);
      }
    });
  });
}

function deleteSite(hostname) {
  return new Promise((resolve, reject) => {
    browser.storage.sync.get('sites').then((result) => {
      const sites = result.sites || [];
      const index = sites.findIndex((site) => site.hostname === hostname);
      if (index === -1) {
        return reject(new Error('Site not found'));
      }
      sites.splice(index, 1);
      browser.storage.sync.set({ sites }).then(() => {
        if (browser.runtime.lastError) {
          return reject(browser.runtime.lastError);
        }
        resolve();
      });
    });
  });
}
