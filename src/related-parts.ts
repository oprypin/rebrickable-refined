// Copyright (C) 2026 Oleh Prypin

function getAndFixYears(partNum: string, container: HTMLElement): {avgYear: number; minYear: number; maxYear: number} {
    const re = /\b([0-9]{4}) to ([0-9]{4})\b/;
    const match = container.innerHTML.match(re)!;

    const minYear = parseInt(match[1]);
    let maxYear = parseInt(match[2]);

    if (partRetirementYears[partNum] < maxYear) {
        maxYear = partRetirementYears[partNum];
        when('fix-part-retirement-years', (activated) => {
            for (const el of container.querySelectorAll<HTMLElement>('*')) {
                if (el.innerText.trim() === match[0]) {
                    el.innerText = `${minYear} to ${maxYear} `;
                    el.append(createElement('s', {innerText: `(${match[2]})`}));
                    activated();
                    break;
                }
            }
        });
    }

    return {avgYear: (minYear + maxYear) / 2, minYear, maxYear};
}

function currentPart() {
    const [, num, name] = /^LEGO PART (\w+) (\w.*)$/.exec(document.querySelector('h1')!.textContent)!;
    return {num, name};
}

const insertBefore = document.querySelector<HTMLElement>('section:has(#your_colors), section:has(#available_colors)');
if (insertBefore) {
    const molds: Array<{avgYear: number; minYear: number; maxYear: number; partNum: string; partName: string}> = [];

    const extraSplitData: Array<string> = [];
    const siteImgUrls: Record<string, string> = {};

    for (const relRow of document.querySelectorAll('#tab_rel_parts .row')) {
        const match = ['Pairs With:', 'Alternate Parts:', 'Molds:', 'Print Of:'].find((s) => relRow.innerHTML.includes(s));
        if (match) {
            for (const partEl of relRow.querySelectorAll('.js-part')) {
                if (partEl.innerHTML.match(/\b[12]?[0-9] sets\b/)) {
                    continue;
                }
                const img = partEl.querySelector('img[title]')!;
                const [, partNum, partName] = img.getAttribute('title')!.match(/^\s*(\w+) (.+)(?:\n|\s*$)/)!;
                if (match === 'Molds:') {
                    molds.push({...getAndFixYears(partNum, partEl.querySelector('.part-text')!), partNum, partName});
                } else {
                    if (match === 'Alternate Parts:' && getAndFixYears(partNum, partEl.querySelector('.part-text')!)[2] < 1998) {
                        continue;
                    }
                    const groupKind = {
                        'Alternate Parts:': 'Related',
                        'Pairs With:': 'Fits with',
                        'Print Of:': 'Print of',
                    }[match];
                    if (groupKind) {
                        extraSplitData.push(`${groupKind}\n*${currentPart().num} UNUSED\n*${partNum} ${partName}`);
                        siteImgUrls[partNum] = img.getAttribute('data-src') || img.getAttribute('src')!;
                    }
                }
            }
        }
    }

    when('display-related-parts', async (activated) => {
        const splitData = relatedPartsData.trim().split('\n\n');
        splitData.push(...extraSplitData);

        const partsImages: Array<Record<string, string>> = await chrome.runtime.sendMessage({action: 'getPartColorsData'}) ?? [];
        function getPartImage(partNum: string) {
            for (const record of partsImages) {
                if (record[partNum]) {
                    return `https://cdn.rebrickable.com/media/thumbs/parts/${record[partNum]}/250x250p.jpg`;
                }
            }
            if (siteImgUrls[partNum]) {
                return siteImgUrls[partNum];
            }
            return `https://cdn.rebrickable.com/media/thumbs/parts/ldraw/71/${partNum}.png/250x250p.png`;
        }

        const seenPartsByName: Map<string, string> = new Map();
        const shownParts: Set<string> = new Set();
        const outputGroups: Map<string, Array<HTMLDivElement>> = new Map();
        outputGroups.set('Related', []);
        outputGroups.set('Fits with', []);
        outputGroups.set('Inverted', []);
        outputGroups.set('Print of', []);

        const container = createElement('div', {id: 'rbrefined-related-parts'});
        for (const pass of [0, 1]) {
            let data: Array<string>;
            if (pass === 0) {
                data = splitData;
            } else {
                data = [];
                const invertedRe = /\b Inverted\b/;
                for (const [search, replacement] of [
                    [invertedRe, ''],
                    [/\bBrick\b/, 'Plate'],
                    [/\bPlate\b/, 'Brick'],
                    [/\bPlate\b/, 'Tile'],
                    [/\bTile\b/, 'Plate'],
                    [/\bWedge Plate\b/, 'Wedge'],
                    [/\bLeft\b/, 'Right'],
                    [/\bRight\b/, 'Left'],
                    [/\bTile Round\b/, 'Tile'],
                ] as const) {
                    for (const [partName, partNum] of seenPartsByName.entries()) {
                        const partName2 = partName.replace(search, replacement);
                        if (partName2 !== partName) {
                            const partNum2 = seenPartsByName.get(partName2);
                            if (partNum2 != null) {
                                if (partNum.split('/').includes(currentPart().num) !== partNum2.split('/').includes(currentPart().num)) {
                                    const groupKind = (search === invertedRe ? 'Inverted' : 'Related');
                                    data.push(`${groupKind}\n*${partNum} ${partName}\n*${partNum2} ${partName2}`);
                                }
                            }
                        }
                    }
                }
            }
            for (const group of data) {
                const table = createElement('table');
                let anyPartsMatched = false;
                let anySkip = false;
                let anyNonExtra = false;

                let outputGroup = outputGroups.get('Related')!;
                let first = true;
                for (const row of group.split('\n')) {
                    if (first) {
                        first = false;
                        if (row.match(/^[A-Z]/)) {
                            const maybeGroup = outputGroups.get(row);
                            if (maybeGroup == null) {
                                console.error('Unrecognized group type: ', row);
                            } else {
                                outputGroup = maybeGroup;
                            }
                            continue;
                        }
                    }

                    const tr = createElement('tr');
                    for (const item of row.split(';')) {
                        const td = createElement('td');
                        if (item) {
                            const match = /^(\*|\+)?([0-9a-z/]+) (\(?\w.+)$/.exec(item.trim());
                            if (!match) {
                                console.error(`Could not match part: ${item}`);
                                continue;
                            }
                            const [, isExtra, partNums, partName] = match;
                            seenPartsByName.set(partName, partNums);
                            let anyExtra = false;

                            let img: HTMLImageElement;
                            for (const partNum of partNums.split('/')) {
                                const a = createElement('a', {textContent: partNum});

                                if (shownParts.has(partNum) && isExtra === '*') {
                                    anyExtra = true;
                                }
                                if (td.hasChildNodes()) {
                                    td.append('\u2009/\u2009');
                                    a.style.fontSize = '90%';
                                } else {
                                    img = createElement('img', {
                                        loading: 'lazy',
                                        src: getPartImage(partNum),
                                    });
                                    img.setAttribute('data-src', img.src);
                                    img.setAttribute('data-url', `/parts/${partNum}/summary/`);
                                    img.classList.add('js-part-popup');
                                    td.classList.add('inv_img');
                                }
                                if (partNum === currentPart().num) {
                                    anyPartsMatched = true;
                                    a.style.fontWeight = '600';
                                    a.style.textDecoration = 'underline';
                                    if (isExtra === '*') {
                                        anyExtra = true;
                                    } else {
                                        anyNonExtra = true;
                                        if (isExtra === '+') {
                                            anySkip = true;
                                        }
                                    }
                                    td.style.boxShadow = 'inset 0 0 3px 0 #009900';
                                } else {
                                    a.href = `https://rebrickable.com/parts/${partNum}/`;
                                }
                                td.append(a);
                            }
                            if (anyExtra) {
                                continue;
                            }

                            td.prepend(createElement('br'));
                            td.prepend(img!);

                            const div = createElement('div');
                            div.setAttribute('style', 'font-size: 90%; white-space: pre-line');
                            div.textContent = partName.replaceAll('[', '\n[').replaceAll('  ', '\n').replace(/\b x \b/g, '\u00a0x\u00a0').trim();
                            td.append(div);
                        } else {
                            table.style.flexBasis = '100%';
                            table.style.position = 'relative';
                        }
                        tr.append(td);
                    }
                    if (tr.hasChildNodes()) {
                        table.append(tr);
                    }
                }

                if (anyPartsMatched && !anySkip && table.hasChildNodes()) {
                    for (const a of table.querySelectorAll('a')) {
                        shownParts.add(a.textContent);
                    }

                    if (!anyNonExtra) {
                        for (const tr of table.childNodes) {
                            for (const td of tr.childNodes) {
                                const div = createElement('div');
                                div.append(...td.childNodes);
                                outputGroup.push(div);
                                for (const attr of ['style', 'class', 'data-url']) {
                                    div.setAttribute(attr, (td as HTMLTableCellElement).getAttribute(attr) ?? '');
                                }
                            }
                        }
                    } else {
                        container.append(table);
                    }
                }
            }
        }

        if ([...outputGroups.values()].some((v) => v.length > 0)) {
            for (const [groupKind, group] of outputGroups.entries()) {
                if (group.length === 0) {
                    continue;
                }
                if (groupKind !== 'Related') {
                    if (container.hasChildNodes()) {
                        container.append(createElement('br'));
                    }
                    container.append(
                        createElement('h5', {textContent: groupKind}),
                    );
                }
                const containerFlex = createElement('div', {className: 'rbrefined-flex'});
                containerFlex.append(...group);
                container.append(containerFlex);
            }

            const h = createElement('h4', {textContent: 'Related parts'});
            container.prepend(h);
        }

        if (shownParts.size > 0) {
            // Remove an existing QuickLinks section:
            for (const table of document.querySelectorAll('.container .col-md-9 .mt-10 table')) {
                const toRemove: Array<ChildNode> = [table];
                let node = table.previousSibling;

                function skipBr() {
                    while (node && node.nodeName === 'BR') {
                        toRemove.push(node);
                        node = node.previousSibling;
                    }
                }
                skipBr();

                if (node && node.nodeType === Node.TEXT_NODE && node.textContent?.trim().toLowerCase().endsWith('quicklinks:')) {
                    toRemove.push(node);
                    node = node.previousSibling;
                    skipBr();
                    for (const el of toRemove) {
                        el.remove();
                    }
                    break;
                }
            }
        }

        try {
            molds.unshift({
                ...getAndFixYears(currentPart().num, document.querySelector('.sidebar:has(h2) table')!),
                partNum: currentPart().num,
                partName: currentPart().name,
            });
        } catch (e) {}

        if (molds.length > 1) {
            molds.sort((a, b) => a[0] - b[0]);
            const ul = createElement('ul');

            for (const {minYear, maxYear, partNum, partName} of molds) {
                const li = createElement('li');
                const a = createElement('a', {textContent: partNum});
                if (partNum === currentPart().num) {
                    a.style.fontWeight = '600';
                    a.style.textDecoration = 'underline';
                } else {
                    a.href = `https://rebrickable.com/parts/${partNum}/`;
                }
                li.append(a);
                li.append(` (${minYear} to ${maxYear}) - ${partName}`);

                ul.append(li);
            }

            container.prepend(ul);

            container.prepend(
                createElement('h4', {textContent: 'Molds'}),
            );
        }

        if (container.hasChildNodes()) {
            insertBefore.before(createElement('hr'));
            insertBefore.before(container);
            activated();

            addStyle(/* css */`
                #rbrefined-related-parts .inv_img {
                    border: 2px solid var(--border-part);
                    background-color: var(--bg-parts);
                    padding: 2px;
                    margin: 0;
                    min-width: 95px;
                    max-width: 140px;
                    width: 140px;
                    vertical-align: top;
                    text-align: center;
                    outline-offset: -2px;
                }
                #rbrefined-related-parts .js-part-popup {
                    cursor: pointer;
                }
                #rbrefined-related-parts .inv_img:hover {
                    outline: 2px solid #aaa;
                }
                #rbrefined-related-parts table {
                    min-width: 20px;
                }
                #rbrefined-related-parts table:hover {
                    z-index: 100;
                }
                #rbrefined-related-parts tr {
                    height: 10px;
                }
                #rbrefined-related-parts img {
                    width: 75px;
                    height: 75px;
                }
                #rbrefined-related-parts .rbrefined-flex {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: flex-start;
                    gap: 5px;
                }
            `);
        }
    });
}
