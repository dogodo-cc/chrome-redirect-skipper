import { browser } from './browser-wrap.js';
import { targetParams, $, i18n, message, generateIssueUrl } from './utils.js';
import sitesBuiltIn from './sites.js';

document.addEventListener('DOMContentLoaded', function () {
  const $settingButton = $('setting');
  const $currentUrl = $('current-url');
  const $siteTitle = $('site-title');
  const $hostnameInput = $('hostname-input');
  const $targetParamInput = $('target-param-input');
  const $targetDomain = $('target-domain');
  const $submitButton = $('submit');
  const $reportButton = $('report');

  i18n();

  createParamOptions();

  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs && tabs[0]) {
      analyzeUrl(tabs[0].url, tabs[0].title);
    }
  });

  $currentUrl.addEventListener('change', (e) => {
    analyzeUrl(e.target.value);
  });

  $targetParamInput.addEventListener('change', (e) => {
    analyzeUrl($currentUrl.value, '', e.target.value);
  });

  $submitButton.addEventListener('click', (e) => {
    e.preventDefault();

    const btn = e.target;
    if (btn.isUpdating) {
      return;
    }
    btn.isUpdating = true;

    const data = {
      example: $currentUrl.value,
      title: $siteTitle.value,
      hostname: $hostnameInput.value,
      param: $targetParamInput.value,
    };
    updateUserData(data)
      .then(() => {
        message(browser.i18n.getMessage('popup_addSuccessTip'), 'info');
      })
      .catch((error) => {
        message(error.message || browser.i18n.getMessage('popup_addErrorTip'), 'error');
      })
      .finally(() => {
        btn.isUpdating = false;
      });
  });

  function analyzeUrl(link, title = '', param = '') {
    $currentUrl.value = link;
    $currentUrl.title = link;

    const url = new URL(link);

    if (title) {
      $siteTitle.value = title;
    }

    const domain = url.hostname;
    $hostnameInput.value = domain;

    const targetParam = param || targetParams.find((param) => url.searchParams.has(param));

    if (targetParam) {
      $targetParamInput.value = targetParam;

      const targetUrl = url.searchParams.get(targetParam);
      $targetDomain.value = targetUrl ? decodeURIComponent(targetUrl) : '';
    } else {
      $targetParamInput.value = '';
      $targetDomain.value = '';
    }

    updateSubmitButton();
  }

  function updateSubmitButton() {
    const targetDomain = $targetDomain.value.trim();
    $submitButton.disabled = !Boolean(targetDomain);
    $reportButton.disabled = !Boolean(targetDomain);
  }

  $settingButton.addEventListener(
    'click',
    () => {
      const url = browser.runtime.getURL('page-options.html');
      window.open(url);
    },
    false
  );

  $reportButton.addEventListener(
    'click',
    () => {
      const issueUrl = generateIssueUrl($currentUrl.value || $hostnameInput.value);
      window.open(issueUrl, '_blank');
    },
    false
  );
});

function updateUserData(data) {
  return new Promise((resolve, reject) => {
    if (!data || !data.hostname) {
      return reject(new Error('Invalid data'));
    }

    if (sitesBuiltIn.some((site) => site.hostname === data.hostname)) {
      return reject(new Error('Cannot modify built-in sites'));
    }

    browser.storage.sync.get('sites').then((result) => {
      const sites = result.sites || [];
      const existingIndex = sites.findIndex((site) => site.hostname === data.hostname);

      if (existingIndex !== -1) {
        // Update existing site
        sites[existingIndex] = { ...sites[existingIndex], ...data };
      } else {
        // Add new site
        sites.push(data);
      }

      browser.storage.sync.set({ sites }).then(resolve);
    });
  });
}

function createParamOptions() {
  const $targetParamList = $('target-param-list');
  $targetParamList.innerHTML = '';

  targetParams.forEach((param) => {
    const option = document.createElement('option');
    option.value = param;
    option.textContent = param;
    $targetParamList.appendChild(option);
  });
}
