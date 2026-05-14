// Copyright (C) 2026 Oleh Prypin

const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function fetchJson(url: string): Promise<object> {
    const response = await fetch(url, {signal: AbortSignal.timeout(5000)});
    if (!response.ok) {
        throw new Error(`HTTP error - status ${response.status}`);
    }
    return await response.json();
}

async function getOrUpdateDataFile({key, maxAgeDays, filename}: {
    key: string; maxAgeDays: number; filename: string;
}) {
    const results: Array<object> = [];

    let storageResult = (await chrome.storage.local.get([key]))[key] as {
        lastUpdated: number; extensionVersion: string; data: any;
    } | null;
    let lastUpdated: number = storageResult?.lastUpdated ?? 0;

    const extensionVersion: string = chrome.runtime.getManifest()?.version;
    if (extensionVersion !== storageResult?.extensionVersion) {
        lastUpdated = 0;
    }

    const now = Date.now();
    if (now - lastUpdated >= ONE_DAY_MS * maxAgeDays) {
        const url = `https://oprypin.github.io/rebrickable-refined/${filename}`;
        try {
            storageResult = {
                data: await fetchJson(url),
                extensionVersion,
                lastUpdated: now,
            };
            void chrome.storage.local.set({[key]: storageResult});
        } catch (e) {
            console.error(e);
        }
        if (storageResult != null) {
            results.push(storageResult.data);
        }
    }

    const resourceUrl = chrome.runtime.getURL(filename);
    if (resourceUrl) {
        results.push(await fetchJson(resourceUrl));
    }

    return results;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getPartColorsData') {
        void getOrUpdateDataFile({
            key: 'partsImages',
            maxAgeDays: 1,
            filename: 'parts-images.json',
        }).then(sendResponse);
        return true;
    }
    return undefined;
});

chrome.runtime.onInstalled.addListener(() => {
    void chrome.storage.local.set({extensionLastUpdated: Date.now()});
});
