const isMac = navigator.platform.match("Mac");

export const isChromeExt = typeof chrome !== 'undefined' && chrome.runtime.id !== 'undefined';
// export const isFirefoxExt = typeof browser !== 'undefined' && browser.runtime.id !== 'undefined';

export const hijackSave = () => {
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === 83 && (isMac ? e.metaKey : e.ctrlKey)) e.preventDefault();
    }, false);
}