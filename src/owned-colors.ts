// Copyright (C) 2026 Oleh Prypin

const partsOrderUpdatedAttr = 'data-rbrefined-updated-parts-order';

function updateOwnedParts(colorId: number | null) {
    const partsTab = document.querySelector<HTMLDivElement>('#tab_myparts, #user_parts_matrix');
    if (partsTab == null) {
        return;
    }
    const columnTitles = partsTab.querySelectorAll<HTMLDivElement>('th>div.color[title]');
    if (columnTitles.length === 0) {
        return;
    }
    when('owned-parts-headings', (activated) => {
        if (partsTab.querySelector('.rbrefined-parts-heading')) {
            return;
        }
        for (const colorColChild of columnTitles) {
            const colorCol = colorColChild.parentElement!;
            colorCol.classList.add('rbrefined-parts-heading');
            const [, thisColorId, thisColorName] = /^\s*([0-9]+) - (.+)\b\s*$/.exec(colorColChild.title)!;
            colorCol.prepend(createElement('small', {textContent: thisColorName}));
            if (colorId === parseInt(thisColorId)) {
                colorCol.classList.add('rbrefined-parts-heading-current');
                setTimeout(() => {
                    colorCol.scrollIntoView();
                }, 20);
            }
        }
        addStyle(/* css */`
            th.rbrefined-parts-heading {
                vertical-align: bottom !important;
                text-align: center;
            }
            th.rbrefined-parts-heading-current {
                box-shadow: inset 0 0 3px 0 #009900;
            }
            th.rbrefined-parts-heading small {
                font-weight: normal;
                text-orientation: sideways;
                transform: rotate(186deg);
                writing-mode: vertical-rl;
                max-height: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                display: inline-block;
                text-wrap: nowrap;
                font-size: 95%;
            }
            @media (min-width: 1200px) {
                .modal-lg {
                    width: 1200px;
                }
            }
            .table.js-table-sticky-header {
                width: inherit;
            }
            .table-sticky-wrapper {
                max-height: 600px !important;
            }
        `);
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 10);
        activated();
    });

    when('partlists-first-in-owned-parts', (activated) => {
        const tbody = partsTab.querySelector<HTMLElement>('#user_parts_matrix_body')!;
        if (tbody == null) {
            return;
        }
        const partLists: Array<HTMLElement> = [];
        const setLists: Array<HTMLElement> = [];
        for (const tr of tbody.querySelectorAll('tr')) {
            if (tr.getAttribute(partsOrderUpdatedAttr)) {
                continue;
            }
            tr.setAttribute(partsOrderUpdatedAttr, 'true');
            (tr.classList.contains('js-list-item-set') ? setLists : partLists).push(tr);
        }
        if (partLists) {
            partLists.sort(
                (a, b) => (a.querySelector('a')?.textContent ?? '').localeCompare(b.querySelector('a')?.textContent ?? ''),
            );
            tbody.prepend(...partLists);
            activated();
        }
    });
}

for (const modalBody of document.querySelectorAll<HTMLElement>('#page_modal_body, #part_popup_modal')) {
    observeChanges(modalBody, () => {
        const selectedColor = modalBody.querySelector<HTMLOptionElement>('#id_color option[selected]');
        let colorId: number | null = null;
        if (selectedColor != null) {
            colorId = parseInt(selectedColor.value);
            const [colorName] = /\b\w[^(]+\w\b/.exec(selectedColor.textContent)!;

            const infoDiv = modalBody.querySelector<HTMLDivElement>('h3+div');
            if (infoDiv != null && infoDiv.nextElementSibling?.tagName === 'HR') {
                const baseLink = infoDiv.querySelector('a')!.href;

                const newDiv = createElement('div', {}, [
                    createElement('a', {
                        href: `${baseLink}${colorId}/`,
                        innerText: `In ${colorName}`,
                    }),
                ]);
                infoDiv.after(newDiv);
            }
        }
        updateOwnedParts(colorId);
    });
}

for (const yourColors of document.querySelectorAll<HTMLElement>('#your_colors')) {
    observeChanges(yourColors, () => {
        let colorId: number | null = null;
        const match = /^#([0-9]+)$/.exec(window.location.hash);
        if (match) {
            colorId = parseInt(match[1]);
        }
        updateOwnedParts(colorId);
    });
}
