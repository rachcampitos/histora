/**
 * Mock for @stencil/core/internal/client
 * Prevents Stencil web component runtime from failing in jsdom
 */
const noop = () => {};
const noopReturn = (v: any) => v;

export const registerInstance = noop;
export const getElement = noop;
export const Host = noop;
export const h = noop;
export const proxyCustomElement = noopReturn;
export const defineCustomElement = noop;
export const attachShadow = noop;
export const createEvent = () => ({ emit: noop });
export const setPlatformHelpers = noop;
export const Build = { isBrowser: true, isDev: true, isTesting: true };
export const plt = {};
export const win = typeof window !== 'undefined' ? window : {};
export const doc = typeof document !== 'undefined' ? document : {};
export const supportsShadow = false;
export const supportsListenerOptions = false;
export const supportsConstructableStylesheets = false;
export const forceModeUpdate = noop;
export const getMode = () => 'md';
export const setMode = noop;
export { noop as forceUpdate };
export { noop as getRenderingRef };
export const insertVdomAnnotations = noop;
export const parsePropertyValue = noopReturn;
export const readTask = (cb: () => void) => { cb(); };
export const writeTask = (cb: () => void) => { cb(); };
export const nextTick = (cb: () => void) => { Promise.resolve().then(cb); };
export const consoleDevInfo = noop;
export const consoleDevWarn = noop;
export const consoleDevError = noop;
export const consoleError = noop;
export const setNonce = noop;
export const globalScripts = noop;
export const appDidLoad = noop;
export const safeCall = (instance: any, method: string) => {
  if (instance?.[method]) {
    try { return instance[method](); } catch(_e) { /* noop */ }
  }
};
export const addHostEventListeners = noop;
export const styles = new Map();
export const modeResolutionChain = [];
