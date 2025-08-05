import { $, i18n, message, generateIssueUrl } from './utils.js';
import sites from './sites.js';

document.addEventListener('DOMContentLoaded', function () {
  const $list = $('sites-list');
  renderSite();

  $list.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-remove')) {
      const hostname = e.target.dataset.hostname;
      if (confirm(`${chrome.i18n.getMessage('options_deleteConfirmTip')} ${hostname}?`)) {
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

      const template = `
        <div class="site-info">
            <img class="site-favicon" src="${site.favicon || `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(site.hostname)}`}" alt="${
        site.title || site.hostname
      }">
          <span class="site-name">${site.title || site.hostname}</span>
          <a
            class="site-hostname"
            target="_blank"
            href="https://${site.hostname}">
            ${site.hostname}
          </a>
        </div>
        <div class="site-actions">
          ${
            site.builtIn
              ? ''
              : `
                <span class="btn btn-remove" data-hostname="${site.hostname}" title="i18n:options_deleteTip">❌</span>
                <a class="btn create-issue" target="_blank" href="${generateIssueUrl(site.example || site.hostname)}" title="i18n:options_reportTip">🙋</a>
                `
          }
        </div>
      `;

      li.innerHTML = template;

      fragment.appendChild(li);
    });

    $list.innerHTML = '';
    $list.appendChild(fragment);

    // li 是动态创建的，需要重新绑定 i18n
    i18n();
  }

  // 高级设置

  const $fuzzy = $('fuzzy');

  chrome.storage.sync.get('fuzzy', (result) => {
    $fuzzy.checked = result.fuzzy || false;
  });

  $fuzzy.addEventListener('change', () => {
    chrome.storage.sync.set({ fuzzy: $fuzzy.checked }, () => {
      if (chrome.runtime.lastError) {
        message(chrome.runtime.lastError.message, 'error');
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
    chrome.storage.sync.get('sites', (result) => {
      if (chrome.runtime.lastError) {
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
    chrome.storage.sync.get('sites', (result) => {
      const sites = result.sites || [];
      const index = sites.findIndex((site) => site.hostname === hostname);
      if (index === -1) {
        return reject(new Error('Site not found'));
      }
      sites.splice(index, 1);
      chrome.storage.sync.set({ sites }, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve();
      });
    });
  });
}
