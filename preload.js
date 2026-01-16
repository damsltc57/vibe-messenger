// Preload script - intercepts web notifications and forwards to native OS notifications
const { contextBridge, ipcRenderer } = require('electron');

// Log function for debugging
const log = (...args) => console.log('[Messenger Desktop]', ...args);

log('Preload script starting...');

// Override Notification API
const NativeNotification = function (title, options = {}) {
    log('Notification created:', title, options);

    // Send to main process for native notification
    ipcRenderer.send('show-notification', {
        title: title,
        body: options.body || '',
        icon: options.icon || null
    });

    this._onclick = null;
    this._onclose = null;
    this._onerror = null;
    this._onshow = null;

    const self = this;
    setTimeout(() => {
        if (self._onshow) self._onshow();
    }, 100);
};

NativeNotification.prototype = {
    close: function () {
        if (this._onclose) this._onclose();
    }
};

Object.defineProperty(NativeNotification.prototype, 'onclick', {
    get: function () { return this._onclick; },
    set: function (val) { this._onclick = val; }
});

Object.defineProperty(NativeNotification.prototype, 'onclose', {
    get: function () { return this._onclose; },
    set: function (val) { this._onclose = val; }
});

Object.defineProperty(NativeNotification.prototype, 'onerror', {
    get: function () { return this._onerror; },
    set: function (val) { this._onerror = val; }
});

Object.defineProperty(NativeNotification.prototype, 'onshow', {
    get: function () { return this._onshow; },
    set: function (val) { this._onshow = val; }
});

NativeNotification.permission = 'granted';

NativeNotification.requestPermission = function (callback) {
    log('Permission requested');
    const permission = 'granted';
    if (callback) callback(permission);
    return Promise.resolve(permission);
};

Object.defineProperty(window, 'Notification', {
    value: NativeNotification,
    writable: false,
    configurable: false
});

// Function to extract latest message info from the page
function getLatestMessageInfo() {
    try {
        // Try to find unread conversations in the sidebar
        // Messenger uses various selectors, we'll try common ones

        // Look for unread indicator (bold text in conversation list)
        const conversations = document.querySelectorAll('[role="row"], [data-testid="mwthreadlist-item"]');

        for (const conv of conversations) {
            // Check if conversation has unread indicator (usually bold or has specific attribute)
            const hasUnread = conv.querySelector('[data-unread="true"]') ||
                conv.querySelector('.x1s688f') || // Bold text class
                (conv.getAttribute('aria-label') && conv.getAttribute('aria-label').includes('non lu'));

            if (hasUnread || conversations.length > 0) {
                // Try to get the name
                const nameEl = conv.querySelector('[dir="auto"] span, [data-testid="mwthreadlist-item-name"]');
                const name = nameEl ? nameEl.textContent : null;

                // Try to get the message preview
                const previewEl = conv.querySelector('[dir="auto"]:last-child span, [data-testid="mwthreadlist-item-subtitle"]');
                const preview = previewEl ? previewEl.textContent : null;

                if (name) {
                    return { name, preview };
                }
            }
        }

        // Alternative: Get the active conversation header
        const headerName = document.querySelector('[data-testid="mwthreadlist-item-open"] [dir="auto"] span, h1[dir="auto"]');
        if (headerName) {
            return { name: headerName.textContent, preview: null };
        }

    } catch (e) {
        log('Error extracting message info:', e);
    }

    return null;
}

// Monitor page title changes
let lastTitle = '';
let lastUnreadCount = 0;
let notificationTimeout = null;
let lastNotificationTime = 0;

const checkForNewMessages = () => {
    const title = document.title;

    if (title !== lastTitle) {
        log('Title changed:', title);

        // Check for unread count in title (e.g., "(1) Messenger")
        const match = title.match(/^\((\d+)\)/);
        const currentCount = match ? parseInt(match[1]) : 0;

        // New message detected if count increased
        if (currentCount > lastUnreadCount) {
            const now = Date.now();

            // Debounce: ignore if notification was sent in last 2 seconds
            if (now - lastNotificationTime > 2000) {
                // Clear any pending notification
                if (notificationTimeout) {
                    clearTimeout(notificationTimeout);
                }

                // Delay slightly to ensure DOM is updated
                notificationTimeout = setTimeout(() => {
                    log('Sending notification for count:', currentCount);

                    // Try to get sender info
                    const messageInfo = getLatestMessageInfo();

                    let notifTitle = 'Messenger';
                    let notifBody = 'Nouveau message';

                    if (messageInfo && messageInfo.name) {
                        notifTitle = messageInfo.name;
                        notifBody = messageInfo.preview || 'Vous a envoyé un message';
                    }

                    ipcRenderer.send('show-notification', {
                        title: notifTitle,
                        body: notifBody,
                        icon: null
                    });

                    lastNotificationTime = Date.now();
                }, 300);
            }
        }

        lastUnreadCount = currentCount;
        lastTitle = title;
    }
};

// Start observing when DOM is ready
const startObserver = () => {
    const observer = new MutationObserver(checkForNewMessages);

    // Only observe the title element, not the entire head
    const titleEl = document.querySelector('title');
    if (titleEl) {
        observer.observe(titleEl, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    lastTitle = document.title;
    const match = lastTitle.match(/^\((\d+)\)/);
    lastUnreadCount = match ? parseInt(match[1]) : 0;

    log('Observer started, initial count:', lastUnreadCount);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
} else {
    startObserver();
}

// Expose API
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    showNotification: (title, body) => {
        ipcRenderer.send('show-notification', { title, body });
    }
});

log('Preload script loaded - Native notifications enabled');
