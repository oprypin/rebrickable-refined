// Copyright (C) 2026 Oleh Prypin

/* eslint-disable @typescript-eslint/no-unused-vars */

const rbrefinedSpecialSettings = [
    'fix-parts-sort-order',
    'part-dialog-replace-search',
    'part-dialog-filter-existing-colors',
    'enable-high-contrast-text',
] as const;

function rbrefinedSettingActivated(key: SettingsKey): void {
    document.documentElement.setAttribute(`data-rbrefined-activated-${key}`, 'true');
}

type SpecialSettingsKey = (typeof rbrefinedSpecialSettings)[number];

function rbrefinedGetSetting(key: SpecialSettingsKey): boolean | undefined {
    if (!rbrefinedSpecialSettings.includes(key)) {
        throw new Error(`Settings setup failure for key ${key}`);
    }
    return {'true': true, 'false': false}[localStorage.getItem(`rbrefined-${key}`) ?? ''];
}
