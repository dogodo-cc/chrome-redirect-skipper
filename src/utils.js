import { browser } from './browser-wrap.js';
export const targetParams = [
  'target',
  'link',
  'href',
  'url',
  'u',
  'to',
  'toasturl', // 微博
  'q', // YouTube
];

export function getTargetUrl(searchParams, params = 'target', deepSearch = true) {
  params = Array.isArray(params) ? params : [params];

  if (deepSearch) {
    params = params.concat(targetParams);
  }

  for (const param of params) {
    const value = searchParams.get(param);
    if (value) {
      return decodeURIComponent(value);
    }
  }
  return '';
}

export function $(id) {
  return document.getElementById(id);
}

export function i18n() {
  // 翻译文本
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((element) => {
    const message = browser.i18n.getMessage(element.dataset.i18n);
    if (message) {
      element.textContent = message;
    }
  });

  // 翻译 placeholders
  const placeholders = document.querySelectorAll("input[placeholder^='i18n:']");
  placeholders.forEach((input) => {
    const placeholderKey = input.placeholder.replace('i18n:', '');
    const message = browser.i18n.getMessage(placeholderKey);
    if (message) {
      input.placeholder = message;
    }
  });

  // 翻译 title
  const titles = document.querySelectorAll("[title^='i18n:']");
  titles.forEach((element) => {
    const titleKey = element.title.replace('i18n:', '');
    const message = browser.i18n.getMessage(titleKey);
    if (message) {
      element.title = message;
    }
  });
}

export function message(text, type = 'info') {
  // 显示消息
  const messageElement = document.createElement('div');
  messageElement.className = `message ${type}`;
  messageElement.textContent = text;
  document.body.appendChild(messageElement);

  messageElement.addEventListener(
    'animationend',
    () => {
      messageElement.remove();
    },
    { once: true }
  );
}

export function generateIssueUrl(content) {
  return `https://github.com/dogodo-cc/chrome-redirect-skipper/issues/new?title=${encodeURIComponent('report a new link')}&body=${encodeURIComponent(content)}`;
}
