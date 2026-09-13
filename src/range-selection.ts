// Copyright (C) 2026 Oleh Prypin

function processCheckboxListForRangeSelection(container: HTMLElement) {
    let lastClickedItem: HTMLElement | null = null;
    const checkboxSelector = 'input[type=checkbox]' as const;

    nestedEventListener(container, `.control-label.checkbox, ${checkboxSelector}`, 'mousedown', () => {
        window.getSelection()?.removeAllRanges();
    });

    let processing = false;
    nestedEventListener(container, `.control-label.checkbox, ${checkboxSelector}`, 'click', (e, target) => {
        if (processing) {
            return;
        }
        const itemSelector = '.js-part, li.clearfix, .row';
        const clickedItem = target.closest<HTMLElement>(itemSelector);
        if (!e.shiftKey) {
            lastClickedItem = clickedItem;
        } else {
            window.getSelection()?.removeAllRanges();
            if (clickedItem == null || lastClickedItem == null) {
                return;
            }
            const lastClickedChecked = lastClickedItem.querySelector<HTMLInputElement>(checkboxSelector)!.checked;
            // Go over all parts and, within the range, make all checkboxes match the last clicked one's state.
            processing = true;
            let isWithinSelection = false;
            for (const el of clickedItem.parentElement?.querySelectorAll<HTMLElement>(itemSelector) ?? []) {
                const wasWithinSelection = isWithinSelection;
                if ((el === lastClickedItem) !== (el === clickedItem)) {
                    isWithinSelection = !isWithinSelection;
                }
                if (isWithinSelection || wasWithinSelection) {
                    const elCheckbox = el.querySelector<HTMLInputElement>(checkboxSelector)!;
                    if (elCheckbox.checked !== lastClickedChecked) {
                        elCheckbox.click();
                    }
                }
            }
            processing = false;
            e.preventDefault();
        }
    });
}

when('checklist-range-selection', (activated) => {
    for (const checkboxContainer of document.querySelectorAll<HTMLElement>('#part_list_filters, #set_list_filters, #lost_parts_sidebar, #drill_down_filters')) {
        observeChanges(checkboxContainer, () => {
            const checkboxLists = checkboxContainer.querySelectorAll<HTMLUListElement>('ul:has(input.js-drill-down-filter[type=checkbox])');
            for (const checkboxList of checkboxLists) {
                processCheckboxListForRangeSelection(checkboxList);
            }
            if (checkboxLists.length > 0) {
                activated();
                return true;
            }
            return false;
        });
    }
    for (const checkboxContainer of document.querySelectorAll<HTMLElement>('#message_list')) {
        processCheckboxListForRangeSelection(checkboxContainer);
        activated();
    }
});
