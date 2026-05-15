// Copyright (C) 2026 Oleh Prypin

const inventoryStyles = /* css */ `
.inv_img,
.inv_img.border-green {
    border-width: 3px !important;
    border-radius: 0.25rem;
    margin: 2px;
    padding: 0;
    padding-bottom: 3px;
    line-height: 1.05;
}
.inv_img {
    border-color: #dddddd;
}
.inv_img:hover {
    border-color: #999999;
}
body.dark-mode .inv_img {
    border-color: #837b7b;
}
body.dark-mode .inv_img:hover {
    border-color: #b4d1c7;
}
.inv_img img {
    padding: 0;
    margin-top: 3px;
    margin-bottom: 1px;
}
.part-text {
    padding-top: 0;
}
.part-text {
    font-size: 105% !important;
}
.part-text small {
    font-size: 90%;
}
.part-overlay {
    border: none;
    font-weight: initial;
    margin: 0;
    border-left: 1px solid #444;
    border-bottom: 1px solid #444;
    color: #003967;
    background-color: hsla(0, 0%, 100%, .8);
    font-size: 95%;
    border-bottom-left-radius: 5px;
    position: absolute;
    top: 0;
    right: 0;
    padding: 2px;
}
.js-part>div {
    background-color: white;
}
.js-part a {
    text-decoration: none;
    color: #395405;
}
.js-part b {
    font-size: 115%;
    color: #000;
}

.js-part-data {
    position: relative;
    overflow: hidden;
    background-color: white;
}
.js-part-data.rbrefined-corner::before {
    content: "";
    position: absolute;
    z-index: 1;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 14px 14px 0px 0px;
    border-color: var(--corner_col) rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0);
}

.js-part-data.rbrefined-corner.rbrefined-corner-bright::before,
.js-part-data.rbrefined-corner.rbrefined-corner-trans::before {
    left: -165px;
    top: -165px;
    width: 200px;
    height: 200px;
    border-radius: 200px;
    border: none;
    background-color: var(--corner_col);
    box-shadow: 0 0 3px #333;
    border-width: 13px 13px 0px 0px;
}

.js-part-data.rbrefined-corner.rbrefined-corner-trans::before {
    box-shadow: 0 0 3px black;
    background: repeating-linear-gradient(45deg, var(--corner_col), var(--corner_col) 3px, #fff 3px, #fff 4px);
    opacity: 0.7;
}

.js-part-data.rbrefined-corner.rbrefined-corner-trans.rbrefined-corner-bright::before {
    background: repeating-linear-gradient(45deg, var(--corner_col), var(--corner_col) 3px, #888 3px, #888 4px);
}

.js-part-data.rbrefined-corner img.overlay.img-responsive {
    top: 8px;
}

.js-part .control-label.checkbox:has(input:focus),
.js-part .control-label.checkbox:has(input:active) {
    outline: 1px dashed gray;
}
`.replace(/^\.\b/gm, 'body .rbrefined-part-list .');

function processPartsInventory(inventoryContainer: HTMLElement) {
    if (inventoryContainer.closest('#filtered_results')) {
        return;
    }

    when('rework-inventory-styles', (activated) => {
        addStyle(inventoryStyles);
        inventoryContainer.classList.add('rbrefined-part-list');
        void activated;
    });

    when('checklist-range-selection', (activated) => {
        let lastClickedItem: HTMLElement | null = null;
        const checkboxSelector = 'input[type=checkbox]' as const;

        nestedEventListener(inventoryContainer, `.control-label.checkbox, ${checkboxSelector}`, 'mousedown', () => {
            window.getSelection()?.removeAllRanges();
        });

        nestedEventListener(inventoryContainer, `.control-label.checkbox, ${checkboxSelector}`, 'click', (e, target) => {
            const clickedItem = target.closest<HTMLElement>('.js-part');
            if (!e.shiftKey) {
                lastClickedItem = clickedItem;
            } else {
                window.getSelection()?.removeAllRanges();
                if (clickedItem == null || lastClickedItem == null) {
                    return;
                }
                const lastClickedChecked = lastClickedItem.querySelector<HTMLInputElement>(checkboxSelector)!.checked;
                let isWithinSelection = false;
                // Go over all parts and, within the range, make all checkboxes match the last clicked one's state.
                for (const el of clickedItem.parentElement?.querySelectorAll<HTMLElement>('.js-part') ?? []) {
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
                e.preventDefault();
            }
        });
        void activated;
    });

    observeChanges(inventoryContainer, () => {
        try {
            for (const menu of inventoryContainer.querySelectorAll<HTMLUListElement>('ul.dropdown-menu')) {
                const li = menu.querySelector('li:last-child');
                if (li && li.textContent.toLowerCase() === '500 parts/page') {
                    const newLi = li.cloneNode(true) as HTMLLIElement;
                    const a = newLi.querySelector('a')!;
                    a.innerText = a.innerText.replace('500', '1000');
                    a.href = a.href.replace('500', '1000');
                    li.after(newLi);
                    break;
                }
            }
        } catch (e) {}

        for (const part of inventoryContainer.querySelectorAll<HTMLElement>('.js-part')) {
            when('checklist-range-selection', (activated) => {
                activated();
            });

            when('rework-inventory-styles', (activated) => {
                const img = part.querySelector('.inv_img');
                if (img != null && !img.classList.contains('inv_img_small')) {
                    img.classList.add('inv_img_med');
                }
                activated();
            });

            // Move the part quantity out of the first line.
            const countText = part.querySelector('.part-text b');
            if (countText == null) {
                continue;  // Not `return` - for the case where only 1 item in the inventory gets dynamically refreshed.
            }
            countText.textContent = countText.textContent.replace(' x', '');
            part.querySelector('.part-text')?.after(countText);

            fixImg(part);
        }

        when('decorate-part-colors', (activated) => {
            const isEnabled = !!inventoryContainer.querySelector('.rbrefined-corner-enabled');

            let prevColorName: string | null = null;
            for (const part of inventoryContainer.querySelectorAll<HTMLElement>('.js-part')) {
                const partData = part.querySelector<HTMLElement>('[data-color_name]');
                if (partData == null) {
                    prevColorName = null;
                    continue;
                }

                const colorName = partData.dataset['color_name'] ?? '';
                if (!isEnabled || colorName === prevColorName) {
                    partData.removeAttribute('style');
                    partData.classList.remove('rbrefined-corner');
                } else {
                    const [hsv, rgb] = partData.dataset['color_hsv']!.split(' ');
                    const s = parseInt(hsv.substring(3, 5), 16) / 255;
                    const v = parseInt(hsv.substring(5, 7), 16) / 255;
                    let l = v - (v * s / 2);
                    if (colorName === 'Trans-Clear' || colorName === 'White') {
                        l = 1;
                    } else if (colorName === 'Black') {
                        l = 0;
                    }
                    partData.classList.add('rbrefined-corner');
                    const isTrans = colorName.includes('Trans');
                    if (isTrans) {
                        partData.classList.add('rbrefined-corner-trans');
                    }
                    if (l > (isTrans ? 0.7 : 0.75)) {
                        partData.classList.add('rbrefined-corner-bright');
                    }
                    partData.setAttribute('style', `--corner_col:#${rgb}`);
                    activated();
                }
                prevColorName = colorName;
            }
        });
    });
}

const timestampsToDarken = new Set([
    // eslint-disable-next-line max-len
    1658360518, 1658402741, 1658421977, 1658593259, 1659332137, 1660677824, 1662004997, 1664337115, 1667885165, 1668930054, 1677488827, 1714159439, 1714159537, 1714971632, 1735206000, 1740507707, 1761194141, 1761194825, 1761778632, 1761780364, 1761780680, 1761780951, 1761781249, 1761781758, 1761782098, 1761857705, 1761860373, 1761860900, 1761861509, 1762305393, 1762305935, 1762315437, 1762315861, 1762316088, 1762323727, 1762410054, 1763446536, 1763542363, 1765446274, 1765543968, 1765545397, 1769340593, 1771567551, 1774485081,
]);
const elementsToDarken = new Set([
    '3004626', '408126', '4107783', '4114295', '4121667', '4164133', '4168884', '4173668', '4193529', '4500458', '4526982', '6089577', '6325254', '6331437', '655826',
]);

function fixImg(container: HTMLElement) {
    const img = (
        container.tagName === 'IMG'
            ? container as HTMLImageElement
            : container.querySelector<HTMLImageElement>('img[data-src]')
    );
    if (img == null) {
        return;
    }
    let imgSrc = img.dataset['src']!;
    if (imgSrc == null) {
        return;
    }

    function replaceImage(newSrc: string) {
        imgSrc = newSrc;
        img!.removeAttribute('data-src');
        img!.setAttribute('loading', 'lazy');
        img!.classList.remove('lazy-loaded');
        img!.src = newSrc;
    }

    when('consistent-part-images', (activated) => {
        const elementMatch = /\/parts\/elements\/([0-9]+).+\?(.+)$/.exec(imgSrc);
        if (!elementMatch) {
            if (imgSrc.includes('/parts/ldraw/0/')) {
                img.style.filter = 'brightness(1.3)';
            }
            return;
        }
        // eslint-disable-next-line prefer-destructuring
        const element = elementMatch[1];
        const timestamp = Math.floor(parseFloat(elementMatch[2]));
        const colorId = container.querySelector<HTMLElement>('[data-color_id]')?.dataset['color_id'];
        if (timestamp >= 1775010000) {
            replaceImage(`https://www.lego.com/cdn/product-assets/element.img.lod5photo.192x192/${element}.jpg`);
            if (colorId === '0' && elementsToDarken.has(element)) {
                img.style.filter = 'contrast(1.26)';
            }
        } else if (colorId === '0') {
            if (timestamp && (
                (timestamp <= 1658354369 && timestamp !== 1658325727)
                || timestampsToDarken.has(timestamp))
            ) {
                img.style.filter = 'contrast(1.28)';
            }
        } else if (colorId === '71' || colorId === '72') {
            img.style.filter = 'brightness(1.07)';
        }
        activated();
    });

    when('increase-image-resolution', (activated) => {
        if (imgSrc.includes('/urls/')) {
            return;
        }
        for (const [before, after] of [
            ['/400x320', '/800x640'], // 400x320c
            ['/300x150', '/600x300'], // 300x150c
            ['/200x160', '/400x320'], // 200x160c
            ['/180x180', '/500x500'], // 180x180p
            ['/125x100', '/250x200'], // 125x100p
            ['/85x85', '/250x250'], // 85x85p
        ]) {
            if (imgSrc.includes(before)) {
                replaceImage(imgSrc.replace(before, after));
                activated();
                return;
            }
        }
    });
}

const inventoryContainer = document.querySelector<HTMLElement>('#inventory, #part_list_parts, #tab_parts, .container:has(#common_parts)');
if (inventoryContainer != null) {
    processPartsInventory(inventoryContainer);
}

for (const img of document.querySelectorAll<HTMLElement>('img.img-responsive[data-src]')) {
    fixImg(img);
}

for (const container of document.querySelectorAll<HTMLElement>('div[data-src], div.tab-content>.tab-pane, #set_list_sets, #build_results')) {
    const observer = new MutationObserver(() => {
        for (const part of container.querySelectorAll<HTMLElement>('div.js-part, div.set-tn')) {
            fixImg(part);
        }
    });
    observer.observe(container.querySelector('div[id]') ?? container, {
        childList: true,
        attributes: true,
    });
}
