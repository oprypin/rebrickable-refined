// Copyright (C) 2026 Oleh Prypin

async function sendMessage(tabId: number, args: Record<string, unknown>) {
    const result = await chrome.tabs.sendMessage(tabId, args);
    if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
    }
    return result;
}

document.addEventListener('DOMContentLoaded', async () => {
    await settingsInitialized;

    let activatedSettings: Set<SettingsKey> = new Set();
    let onSettingChanged = () => {};
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        const tabId = tab.id;
        if (tab.url && tab.url.startsWith('https://rebrickable.com/') && tabId != null) {
            activatedSettings = new Set(await sendMessage(tabId, {action: 'getActivatedSettings'}));
            onSettingChanged = () => void sendMessage(tabId, {action: 'settingChanged'});
            chrome.tabs.connect(tabId, {name: 'popupToContent'});
        }
    } catch (error) {}

    // Iterate in reverse order in order for the `checked = false` line to trigger events as well.
    for (const input of [...document.querySelectorAll<HTMLInputElement>('input[id]')].reverse()) {
        const key = input.id as SettingsKey;
        if (activatedSettings.has(key)) {
            input.closest('label')!.classList.add('active');
            input.closest('label')!.title = 'This setting is currently influencing the page that you\'re viewing';
        }

        function set(value) {
            chrome.storage.local.set({[`setting-${key}`]: value}, () => {});
            onSettingChanged();
            void maybeRemoveWarnings();
        }
        if (input.type === 'checkbox') {
            input.checked = settings[key];
            input.addEventListener('change', () => {
                set(input.checked);
                if (specialSettings.includes(key)) {
                    localStorage.setItem(`rbrefined-${key}`, input.checked ? 'true' : 'false');
                }

                // Disable nested related checkboxes.
                let container: HTMLElement | null = input.closest('label');
                if (container?.parentElement?.tagName === 'DIV') {
                    container = container.parentElement;
                }
                const sibling = container?.nextElementSibling;
                if (container && sibling && sibling.classList.contains('subtree')) {
                    const allChecked = [
                        ...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
                    ].every((el) => el.checked);
                    for (const nestedEl of sibling.querySelectorAll<HTMLInputElement>('input')) {
                        if (!allChecked && nestedEl.checked) {
                            nestedEl.click();
                        }
                        nestedEl.disabled = !allChecked;
                        if (allChecked && !nestedEl.checked) {
                            nestedEl.click();
                        }
                    }
                }
            });
        }
    }

    for (const input of document.querySelectorAll<HTMLInputElement>('input[id]')) {
        const helpIcon = document.createElement('a');
        helpIcon.href = `https://github.com/oprypin/rebrickable-refined/blob/master/README.adoc#${input.id}`;
        helpIcon.className = 'help-icon';
        helpIcon.target = '_blank';
        helpIcon.title = 'Learn more about this option';
        helpIcon.appendChild(useSvgIcon('icon-question'));
        helpIcon.addEventListener('click', (e) => e.stopPropagation());

        input.parentElement?.append(helpIcon);
    }

    await maybeRemoveWarnings();

    for (const el of document.querySelectorAll<HTMLElement>('.warning')) {
        const warningIcon = document.createElement('span');
        warningIcon.appendChild(useSvgIcon('icon-warning'));
        el.prepend(warningIcon);
    }
});

function useSvgIcon(iconId: string) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${iconId}`);
    svg.appendChild(use);
    return svg;
}

async function maybeRemoveWarnings() {
    // Disable warnings if the user already clicked the checkbox
    for (const el of document.querySelectorAll<HTMLElement>('.warning')) {
        const key = `setting-${el.dataset['setting']}`;
        const storage = await chrome.storage.local.get([key]);
        if (storage[key] != null) {
            el.remove();
        }
    }
}
