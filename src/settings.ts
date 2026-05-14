// Copyright (C) 2026 Oleh Prypin

const settings = {
    'fix-parts-sort-order': true,
    'rework-inventory-styles': true,
    'decorate-part-colors': true,
    'consistent-part-images': true,
    'checklist-range-selection': true,
    'display-related-parts': true,
    'fix-part-retirement-years': true,
    'owned-parts-headings': true,
    'partlists-first-in-owned-parts': true,
    'add-main-parts-search': true,
    'focus-main-parts-search': false,
    'remember-selected-search-option': true,
    'part-dialog-replace-search': false,
    'part-dialog-filter-existing-colors': false,
    'part-dialog-always-sort-colors': true,
    'part-dialog-improved-keyboard-input': true,
    'redesign-set-and-moc-tiles': true,
    'detailed-moc-sidebar': true,
    'quick-download-csv-link': true,
    'increase-image-resolution': false,
    'enable-high-contrast-text': true,
};

type SettingsKey = keyof typeof settings;

let settingsInitialized: Promise<void> | true = new Promise<void>((resolve) => {
    void (async function () {
        for (const key in settings) {
            if (typeof chrome !== 'undefined') {
                const storageKey = `setting-${key}`;
                const result = (await chrome.storage.local.get([storageKey]))[storageKey];
                if (result != null) {
                    settings[key] = result;
                }
            } else {
                settings[key] = true;
            }
        }
        settingsInitialized = true;
        resolve();
    })();
});

if (typeof chrome !== 'undefined') {
    let anySettingsChanged = false;
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getActivatedSettings') {
            const activatedSettings: Array<string> = [];
            for (const key in settings) {
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
}

const alreadyActivatedSettings: Set<SettingsKey> = new Set();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function when(key: SettingsKey, callback: (activated: () => void) => void) {
    if (callback?.length !== 1) {
        throw new Error('Callback must be accepted as a parameter');
    }
    if (settingsInitialized !== true) {
        void settingsInitialized.then(() => when(key, callback));
        return;
    }
    if (settings[key]) {
        try {
            callback(() => {
                if (alreadyActivatedSettings.has(key)) {
                    return;
                }
                alreadyActivatedSettings.add(key);
                document.documentElement.setAttribute(`data-rbrefined-activated-${key}`, 'true');
            });
        } catch (e) {
            console.error(e);
        }
    }
}

const specialSettings = [
    'fix-parts-sort-order',
    'part-dialog-replace-search',
    'part-dialog-filter-existing-colors',
    'enable-high-contrast-text',
] as Array<SettingsKey>;

// Special settings that need to load very early - they get activated early or through world: MAIN.
void (async function () {
    await settingsInitialized;
    for (const key of specialSettings) {
        localStorage.setItem(`rbrefined-${key}`, settings[key] ? 'true' : 'false');
    }
}
)();
