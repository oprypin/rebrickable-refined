// Copyright (C) 2026 Oleh Prypin

/* eslint-disable @typescript-eslint/no-unused-vars */

const localSettings = {
    'fix-parts-sort-order': true,
    'rework-inventory-styles': true,
    'decorate-part-colors': true,
    'remove-x-from-part-counts': false,
    'consistent-part-images': true,
    'always-export-parts': true,
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
    'moc-sort-options': true,
    'detailed-moc-sidebar': true,
    'quick-download-csv-link': true,
    'increase-image-resolution': false,
    'checklist-range-selection': true,
    'enable-high-contrast-text': true,
};
type SettingsKey = keyof typeof localSettings;

type _Assert<T extends true> = T;
// Assert that `specialSettings` is a subset of `localSettings`.
type _SubsetCheck = _Assert<typeof rbrefinedSpecialSettings[number] extends keyof typeof localSettings ? true : false>;

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
        for (const key of rbrefinedSpecialSettings) {
            localStorage.setItem(`rbrefined-${key}`, localSettings[key] ? 'true' : 'false');
        }
    })();
});

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
            callback(() => rbrefinedSettingActivated(key));
        } catch (e) {
            console.error(e);
        }
    }
}
