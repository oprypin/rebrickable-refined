// Copyright (C) 2026 Oleh Prypin

/* eslint-disable @typescript-eslint/no-unused-vars */

function naturalSortKey(value: string | null | undefined): Array<string | number> {
    if (!value) {
        return [];
    }
    const valueArr: Array<string | number> = value.split(/((?:0|[1-9][0-9]*)(?:\.[0-9]+)?)/);
    for (let i = 1; i < valueArr.length; i += 2) {
        valueArr[i] = +valueArr[i];
    }
    return valueArr;
}

function sortBy<T>(arr: Array<T>, key: (arg: T) => any): Array<T> {
    return arr.sort((a, b) => cmpRespectingArrays(key(a), key(b)));
}

// Returns -1, 0 or 1 based on the comparison of the two values.
// In the case of arrays, an item-by-item lexicographic comparison is implemented.
function cmpRespectingArrays(a, b): -1 | 0 | 1 {
    if (Array.isArray(a) && Array.isArray(b)) {
        for (let i = 0; i < Math.min(a.length, b.length); ++i) {
            const result = cmpRespectingArrays(a[i], b[i]);
            if (result !== 0) {
                return result;
            }
        }
        return a.length > b.length ? 1 : -1;
    } else if (a === b) {
        return 0;
    } else {
        return a > b ? 1 : -1;
    }
}
