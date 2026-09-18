// Copyright (C) 2026 Oleh Prypin

function updatePartDialogSearchField(searchField: HTMLElement) {
    if (!searchField.dataset['queryurl']?.includes('suggest_part_num')) {
        return;
    }
    const container = searchField.closest('.tab-content, .tab-pane, .modal-body');
    const partInput = container?.querySelector<HTMLInputElement>('#id_part');
    if (container == null || partInput == null) {
        return;
    }

    const filterExistingColors = rbrefinedGetSetting('part-dialog-filter-existing-colors');

    searchField.dataset['queryurl'] = (filterExistingColors
        ? 'https://setmaster.pryp.in/api/search_parts_rebrickable/?format=part_num_color_v1&q='
        : 'https://setmaster.pryp.in/api/search_parts_rebrickable/?format=part_num_v1&q=');

    partInput.setAttribute('maxlength', '100');

    const partDisplay = document.createElement('a');
    partDisplay.setAttribute('tabindex', '-1'); // Prevent tabstop
    partDisplay.style.display = 'block';
    partInput.closest('.controls')!.append(partDisplay);

    let currentlyDisplayedPart: HTMLElement | null = null;

    searchField.querySelector('.tt-menu')!.addEventListener('click', (e) => {
        const suggestion = (e.target as HTMLElement).closest('.tt-suggestion');
        if (!suggestion) {
            return;
        }
        partDisplay.replaceChildren(...suggestion.cloneNode(true).childNodes);
        const u = partDisplay.querySelector('u');
        if (u) {
            partDisplay.href = `https://rebrickable.com/parts/${u.textContent}/`;
            u.remove();
        }
        if (filterExistingColors) {
            const displayed = $(suggestion).data('ttSelectableDisplay') as string | undefined;
            const match = displayed!.match(/^#([^ ]+?)\/(.*)/)!;
            $(partInput).typeahead('val', match[1]);
            $(partInput).typeahead('close');
            const availableColors = match[2].split(',');
            if (availableColors) {
                for (const opt of container.querySelectorAll<HTMLOptionElement>('#id_color option')) {
                    const value = opt.getAttribute('value') ?? '';
                    if (availableColors.includes(value)) {
                        if (value === availableColors[0]) {
                            opt.selected = true;
                        }
                        opt.hidden = false;
                    } else {
                        opt.hidden = true;
                    }
                }
                currentlyDisplayedPart = $(partInput).typeahead('val');
            }
        }
    });
    if (filterExistingColors) {
        rbrefinedSettingActivated('part-dialog-filter-existing-colors');
    }

    partInput.addEventListener('change', () => {
        if (currentlyDisplayedPart && currentlyDisplayedPart !== $(partInput).typeahead('val')) {
            partDisplay.innerHTML = '';
            partDisplay.removeAttribute('href');
            if (filterExistingColors) {
                for (const opt of document.querySelectorAll<HTMLOptionElement>('#id_color option')) {
                    opt.hidden = false;
                }
            }
            currentlyDisplayedPart = null;
        }
    });
    rbrefinedSettingActivated('part-dialog-replace-search');
}

for (const modalBody of document.querySelectorAll('#page_modal_body, #part_popup_modal')) {
    const observer = new MutationObserver(() => {
        for (const searchField of modalBody.querySelectorAll<HTMLElement>('.autosuggest')) {
            const setting = rbrefinedGetSetting('part-dialog-replace-search');
            if (setting !== undefined) {
                observer.disconnect();
                if (setting) {
                    updatePartDialogSearchField(searchField);
                }
            }
        }
    });
    observer.observe(modalBody, {
        childList: true,
        subtree: true,
    });
}
