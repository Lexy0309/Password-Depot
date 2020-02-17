$(document).ready(function () {
    function addEventListeners() {
        window.addEventListener('keypress', keypress);

        chrome.runtime.onMessage.addListener(request => {
            if (request.method === 'shadow-event') {
                console.log('shadow-event received chrome.runtime.onMessage');
              // window.postMessage(request, '*');
            }
        });

        chrome.extension.onMessage.addListener(request => {
            if (request.method === 'shadow-event') {
                console.log('shadow-event received in chrome.extension.onMessage');
              // window.postMessage(request, '*');
            }
        });
    }

    addEventListeners();

    // ======================== EVENT LISTENER ==============================
    function keypress(event) {
        if (event.which == 13) {
            event.preventDefault();
            console.log(chrome);
            
            chrome.runtime.sendMessage({
                method: 'Keypress',
                target: 'background',
                command: 'by-clicking'
            });
           return;
        }
    }
});
