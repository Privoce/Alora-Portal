// load urls from storage
chrome.storage.local.get(['urls'], items => {
    let urls = items.urls || [];
    let listItem = document.getElementById('urlsList');
    urls.forEach((element, index) => {
        let liItem = document.createElement('li');

        let imgItem = document.createElement('img');
        imgItem.src = `chrome://favicon/${element}/`;
        liItem.appendChild(imgItem);

        let aItem = document.createElement('a');
        aItem.innerHTML = element;
        aItem.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                command: 'restore',
                index: index
            });
            // visually remove entry by deleting DOM element
            document.querySelector(`li:nth-child(${index+1})`).remove();
        });
        liItem.appendChild(aItem);

        listItem.appendChild(liItem);
    });
});