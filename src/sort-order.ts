// Copyright (C) 2026 Oleh Prypin

declare const $, unsafeWindow;

function isSortOrderEnabled() {
    return localStorage.getItem('rbrefined-fix-parts-sort-order') === 'true';
}

function sortOrderActivated() {
    document.body.setAttribute('data-rbrefined-activated-fix-parts-sort-order', 'true');
}

function getWindow() {
    return (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
}

/* eslint-disable camelcase */

// Returns -1, 0 or 1 based on the comparison of the two values.
// In the case of arrays, an item-by-item lexicographic comparison is implemented.
function cmpRespectingArrays(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < Math.min(a.length, b.length); ++i) {
            const result = cmpRespectingArrays(a[i], b[i]);
            if (result !== 0) {
                return result;
            }
        }
        return a.length - b.length;
    } else if (a === b) {
        return 0;
    } else {
        return a > b ? 1 : -1;
    }
}

function sortItems(containerJ, itemsJ, dataSelector: string, sort1: string, sort2: string, sortDir: 'A' | 'D') {
    const [container]: [HTMLElement] = $(containerJ);
    if (container == null) {
        return;
    }
    const items = Array.from<HTMLElement>($(itemsJ));
    const sortOrder = [sort1, sort2];
    if (sortOrder.includes('part_name') || sortOrder.includes('part_cat_name')) {
        // Don't use color name as the fallback sort option, use part name and hue instead.
        if (sortOrder[1] === 'color_name') {
            sortOrder.pop();
        }
        if (!sortOrder.includes('part_name')) {
            sortOrder.push('part_name');
        }
        if (!sortOrder.includes('color_hsv')) {
            sortOrder.push('color_hsv');
        }
    }

    function getSortKey(item: HTMLElement, sortType: string) {
        function data(key: string) {
            return item.querySelector(dataSelector)!.getAttribute(`data-${key}`)!;
        }

        const value = data(sortType);
        if (sortType === 'color_hsv') {
            return [value, data('color_name').includes('Trans') ? 0 : 1];
        }
        // Implement natural sort order.
        const valueArr: Array<string | number> = value.split(/(0|[1-9][0-9]*)/);
        for (let i = 1; i < valueArr.length; i += 2) {
            valueArr[i] = +valueArr[i];
        }
        return valueArr;
    }

    items.sort((a: HTMLElement, b: HTMLElement) => {
        for (const [i, so] of sortOrder.entries()) {
            let cmpResult = cmpRespectingArrays(getSortKey(a, so), getSortKey(b, so));
            if (sortDir === 'D' && i === 0) {
                cmpResult = -cmpResult;
            }
            if (cmpResult) {
                return cmpResult;
            }
        }
        return 0;
    });
    container.append(...items);

    sortOrderActivated();
    if (sort1 === 'color_name' || sort1 === 'color_hsv') {
        container.classList.add('rbrefined-corner-enabled');
    } else {
        container.classList.remove('rbrefined-corner-enabled');
    }

    getWindow().RB.initLazyLoad();
}

function reSort() {
    for (const item of document.querySelectorAll<HTMLElement>('div[title="Sort Parts"] .js-sort-part')) {
        if (!item.querySelector('.fa-sort-amount-asc, .fa-sort-amount-desc')) {
            continue;
        }

        function data(key: string) {
            return item.getAttribute(`data-${key}`)!;
        }

        const items = item.parentElement?.getAttribute('data-items');
        if (items) {
            for (const container of document.querySelectorAll(items)) {
                sortItems(
                    container, container.querySelectorAll('.js-part'), '.js-part-data',
                    data('sort1'), data('sort2'), data('sort_dir') === 'A' ? 'D' : 'A',
                );
            }
        }
    }
}

(function () {
    let rbSortItems: ((...args: Array<unknown>) => void) | null = null;
    let rbSetPartPricesView: ((...args: Array<unknown>) => void) | null = null;

    getWindow().RB = {
        set sort_items(v) {
            rbSortItems = v;
        },
        get sort_items() {
            return (isSortOrderEnabled() ? sortItems : rbSortItems);
        },

        set setPartPricesView(v) {
            rbSetPartPricesView = v;
        },
        get setPartPricesView() {
            return (...args) => {
                rbSetPartPricesView!(...args);
                if (isSortOrderEnabled()) {
                    reSort();
                }
            };
        },
    };
})();
