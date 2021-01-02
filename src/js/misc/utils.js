const isMac = navigator.platform.match("Mac");

export const isChromeExt = typeof chrome !== 'undefined' && chrome.runtime.id !== 'undefined';
// export const isFirefoxExt = typeof browser !== 'undefined' && browser.runtime.id !== 'undefined';

export const hijackSave = () => {
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === 83 && (isMac ? e.metaKey : e.ctrlKey)) e.preventDefault();
    }, false);
}

export const getFaviconUrl = url => `chrome://favicon/size/512@1x/${url}`;

export const getDomain = url => url.split("/")[2].split(":")[0].split("?")[0];