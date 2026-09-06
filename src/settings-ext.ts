// Copyright (C) 2026 Oleh Prypin

let localSettingsInitialized: Promise<void> | true = new Promise<void>((resolve) => {
    void (async function () {
        for (const key in localSettings) {
            const storageKey = `setting-${key}`;
            const result = (await chrome.storage.local.get([storageKey]))[storageKey];
            if (result != null) {
                localSettings[key] = result;
            }
        }
        localSettingsInitialized = true;
        resolve();

        // Special settings that need to load very early - they get activated early or through world: MAIN.
        for (const key of specialSettings) {
            localStorage.setItem(`rbrefined-${key}`, localSettings[key] ? 'true' : 'false');
        }
    })();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getSetting(key: SettingsKey): Promise<boolean> {
    await localSettingsInitialized;
    return !!localSettings[key];
}

let anySettingsChanged = false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getActivatedSettings') {
        const activatedSettings: Array<string> = [];
        for (const key in localSettings) {
            if (document.documentElement.getAttribute(`data-rbrefined-activated-${key}`)) {
                activatedSettings.push(key);
            }
        }
        sendResponse(activatedSettings);
    } else if (request.action === 'settingChanged') {
        anySettingsChanged = true;
    }
});
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'popupToContent') {
        port.onDisconnect.addListener(() => {
            if (anySettingsChanged) {
                window.location.reload();
            }
        });
    }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function when(key: SettingsKey, callback: (activated: () => void) => void) {
    if (callback?.length !== 1) {
        throw new Error('Callback must be accepted as a parameter');
    }
    if (localSettingsInitialized !== true) {
        void localSettingsInitialized.then(() => when(key, callback));
        return;
    }
    if (localSettings[key]) {
        try {
            callback(() => settingActivated(key));
        } catch (e) {
            console.error(e);
        }
    }
}
