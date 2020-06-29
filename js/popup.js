document.getElementById('sendThis').addEventListener('click', () => {
    chrome.runtime.sendMessage({
        command: 'sendThis'
    });
});

document.getElementById('sendAll').addEventListener('click', ()=>{
    chrome.runtime.sendMessage({
        command: 'sendAll'
    });
});

document.getElementById('showPage').addEventListener('click',()=>{
    chrome.runtime.sendMessage({
        command: 'showPage'
    });
});
