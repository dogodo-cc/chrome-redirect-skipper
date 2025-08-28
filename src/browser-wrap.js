// webextension-polyfill 是以 umd 方式打包的，后期如果支持了 esm，就不要用这种方式引入了

import '../node_modules/webextension-polyfill/dist/browser-polyfill.js';

export const browser = globalThis.browser;
export default globalThis.browser;
