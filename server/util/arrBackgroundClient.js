(() => {
  const {HOST, PORT, ARR_PATH} = require('../config/env');

  const source = new EventSource(`http://${HOST}:${PORT}${ARR_PATH}`);

  source.addEventListener(
    'open',
    () => {
      console.log('[ARR] Connected to DevServer.');
    }
  );

  source.addEventListener(
    'error',
    () => {
      console.warn('[ARR] Failed to establish connection with DevServer.');
    }
  );

  source.addEventListener(
    'compiled',
    () => {
      console.log('[ARR] Recompilation finished. Sending refresh request to content scripts...');
      let cnt = 0;
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          try {
            chrome.tabs.sendMessage(tab.id, {src: 'background', act: 'refresh'}, response => {
              if (response && response.src === 'contentScript' && response.act === 'reload') {
                cnt++;
              }
            });
          } catch {
          }
        });
        console.log(`[ARR] ${cnt.toString()} content scripts responded. Reloading extension...`);
        source.close();
        chrome.runtime.reload();
      });
    }
  );
})();
