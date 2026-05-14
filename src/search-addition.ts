// Copyright (C) 2026 Oleh Prypin

const searchUpdatedAttr = 'data-rbrefined-search-updated';
const partDialogColorUpdatedAttr = 'data-rbrefined-partdialog-color-updated';
const partDialogInputUpdatedAttr = 'data-rbrefined-partdialog-input-updated';

const additionalSearchStyles = /* css */`
    .setmaster-result {
        display: flex;
        gap: 8px;
        align-items: center;
        text-decoration: none;
    }
    .tt-menu .setmaster-result img {
        margin: -3px -2px -3px;
    }
    .setmaster-result img {
        width: 42px;
        height: 42px;
    }
    .setmaster-result u {
        margin-right: 2px;
    }
`.replaceAll(';', ' !important;');

when('add-main-parts-search', (activated) => {
    addStyle(additionalSearchStyles);
    addStyle(/* css */`
        #header div.autosuggest .tt-menu {
            left: -120px;
            width: calc(100% + 120px);
        }
        a.setmaster-result,
        .tt-menu .tt-selectable,
        .tt-menu .tt-selectable a:hover {
            text-decoration: none;
            font-weight: 400;
        }
    `.replaceAll(';', ' !important;'));
    void activated;
});
when('part-dialog-replace-search', (activated) => {
    addStyle(additionalSearchStyles);
    void activated;
});

for (const searchField of document.querySelectorAll<HTMLElement>('.autosuggest')) {
    const originalQueryUrl = searchField.getAttribute('data-queryurl')!;
    if (!originalQueryUrl) {
        continue;
    }
    if (searchField.getAttribute(searchUpdatedAttr)) {
        continue;
    }
    searchField.setAttribute(searchUpdatedAttr, 'true');

    const partsOption = searchField.parentElement?.querySelector<HTMLOptionElement>('select option[value="parts"]');
    if (partsOption == null) {
        continue;
    }
    const sel = partsOption.closest('select')!;

    let shouldRememberSearchOption = false;
    when('remember-selected-search-option', (activated) => {
        shouldRememberSearchOption = true;
        void activated;
    });

    const searchKey = 'rbrefined_parts';
    const localStorageKey = 'rbrefined-search-selection';

    when('add-main-parts-search', (activated) => {
        const newOption = partsOption.cloneNode() as HTMLOptionElement;
        newOption.value = searchKey;
        newOption.innerText = 'Parts+';
        partsOption.after(newOption);

        when('focus-main-parts-search', (activated) => {
            if (window.location.pathname.startsWith('/parts/')) {
                newOption.selected = true;
                shouldRememberSearchOption = false;
                activated();
            }
        });

        function updateQueryUrl() {
            if (sel.value === searchKey) {
                searchField.setAttribute('data-queryurl', 'https://setmaster.pryp.in/api/search_parts_rebrickable/?format=part_v1&q=');
            } else {
                searchField.setAttribute('data-queryurl', originalQueryUrl.replace('?', `?st=${sel.value}&`));
            }
        }

        updateQueryUrl();
        sel.addEventListener('change', updateQueryUrl, {capture: true});

        activated();
    });

    when('remember-selected-search-option', (activated) => {
        if (shouldRememberSearchOption) {
            const savedSelection = localStorage.getItem(localStorageKey);
            if (savedSelection && savedSelection.match(/^\w+$/)) {
                for (const option of sel.querySelectorAll<HTMLOptionElement>(`option[value="${savedSelection}"]`)) {
                    if (!option.selected) {
                        option.selected = true;
                        sel.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));
                    }
                    break;
                }
            }
            activated();
        }
    });
    sel.addEventListener(
        'change',
        () => localStorage.setItem(localStorageKey, sel.value),
        {capture: true},
    );
}

for (const modalBody of document.querySelectorAll('#page_modal_body, #part_popup_modal')) {
    new MutationObserver(() => {
        if (modalBody.querySelector('#tab_edit')) {
            // This indicates editing an existing part, this functionality should not be applied there.
            return;
        }
        const quantityInput = [
            ...modalBody.querySelectorAll<HTMLInputElement>('#id_quantity'),
        ].find((el) => el.checkVisibility());
        const container = quantityInput?.closest('.tab-content, .tab-pane, .modal-body');
        const colorInput = container?.querySelector<HTMLSelectElement>('#id_color');
        if (quantityInput == null || container == null || colorInput == null) {
            return;
        }

        when('part-dialog-improved-keyboard-input', (activated) => {
            if (quantityInput.getAttribute(partDialogInputUpdatedAttr)) {
                return;
            }

            const menu = container.querySelector<HTMLElement>('.tt-menu');
            if (menu != null) {
                menu.addEventListener('click', () => {
                    colorInput.focus();
                    quantityInput.value = '';
                });
            } else {
                setTimeout(() => colorInput.focus(), 10);
            }

            colorInput.addEventListener('keydown', (e) => {
                if (!quantityInput.value && e.key >= '0' && e.key <= '9') {
                    e.preventDefault();
                    quantityInput.focus();
                    quantityInput.value += e.key;
                }
            });

            quantityInput.value = '';
            quantityInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    setTimeout(() => {
                        quantityInput.value = '';
                        colorInput.focus();
                    }, 50);
                }
            });
            quantityInput.addEventListener('focus', () => quantityInput.select());
            quantityInput.style.width = '150px';
            quantityInput.setAttribute(partDialogInputUpdatedAttr, 'true');

            container.querySelector<HTMLButtonElement>('button[type="submit"]')?.addEventListener('mousedown', () => {
                if (!quantityInput.value) {
                    quantityInput.value = '1';
                }
            });

            document.documentElement.setAttribute('data-rbrefined-activated-part-dialog-improved-keyboard-input', 'true');
            activated();
        });

        when('part-dialog-always-sort-colors', (activated) => {
            for (const optgroup of colorInput.querySelectorAll('optgroup')) {
                if (optgroup.getAttribute(partDialogColorUpdatedAttr)) {
                    return;
                }
                const options = Array.from(optgroup.querySelectorAll('option'));
                const selectedOption = options.find((el) => el.selected);
                options.sort((a, b) => a.text.localeCompare(b.text));
                optgroup.append(...options);
                if (selectedOption != null) {
                    selectedOption.selected = true;
                }
                optgroup.setAttribute(partDialogColorUpdatedAttr, 'true');
                activated();
            }
        });
    }).observe(modalBody, {
        childList: true,
        subtree: true,
    });
}
