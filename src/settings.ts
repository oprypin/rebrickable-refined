// Copyright (C) 2026 Oleh Prypin

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const specialSettings = [
    'fix-parts-sort-order',
    'part-dialog-replace-search',
    'part-dialog-filter-existing-colors',
    'enable-high-contrast-text',
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function settingActivated(key: SettingsKey): void {
    document.documentElement.setAttribute(`data-rbrefined-activated-${key}`, 'true');
}

type SpecialSettingsKey = (typeof specialSettings)[number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getSettingFast(key: SpecialSettingsKey): boolean | undefined {
    if (!specialSettings.includes(key)) {
        throw new Error(`Settings setup failure for key ${key}`);
    }
    return {'true': true, 'false': false}[localStorage.getItem(`rbrefined-${key}`) ?? ''];
}
