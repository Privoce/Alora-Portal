chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.src === 'background' && message.act === 'refresh') {
    console.log('[ARR] Received refresh request from background. Refresh page after 1 second...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    sendResponse({src: 'contentScript', act: 'reload'});
  }
});
