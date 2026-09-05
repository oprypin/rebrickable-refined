// Copyright (C) 2026 Oleh Prypin

function getAuthorName(setEl: Element): string | null {
    return setEl.querySelector<HTMLAnchorElement>('a[href^="/mocs/"]')?.href.match(/\/mocs\/MOC-[0-9]+\/([^/]+)/)?.[1] ?? null;
}

function populateSetDetails(root: HTMLDivElement) {
    const details = root.querySelector<HTMLElement>('.set-tn-details>*');
    if (details == null || details.classList.contains('rbrefined-populated') || details.closest('.set-tn-small')) {
        return;
    }

    const data = root.querySelector<HTMLDivElement>('.js-sort-data')!.dataset;

    const result: Array<HTMLElement> = [];

    const title = details.querySelector('h5')!;
    result.push(title);

    let authorEl = title.nextElementSibling as HTMLElement | null;
    if (!authorEl?.textContent.trim().startsWith('By ')) {
        authorEl = null;
    }
    if (authorEl == null) {
        // Populate author in case it's missing, also adjust vertical spacing for build search page.
        const authorName = getAuthorName(details);
        const authorEl = createElement('div', {className: 'clearfix trunc mb-6 size-12 rbrefined-set-author'}, ['\u00a0']);
        if (authorName != null && !document.location.pathname.startsWith(`/users/${authorName}/`)) {
            const authorLink = createElement('a', {className: 'js-hover-card', href: `/users/${authorName}/mocs/`}, [decodeURIComponent(authorName)]);
            authorLink.dataset['hover'] = `/users/${authorName}/card/`;
            authorEl.replaceChildren('By ', authorLink);
            result.push(authorEl);
        }
        // Places that can contain both MOCs and sets: need to add the author field even if it's empty.
        if (document.location.pathname.match(new RegExp('^/build/|^/users/[^/]+/lists/[0-9]+'))) {
            for (const el of root.querySelectorAll<HTMLDivElement>('a div.p-5')) {
                if (el.textContent.startsWith('Missing:')) {
                    el.style = 'margin-bottom: -7px !important; padding-bottom: 0 !important';
                    el.closest('a')!.style.color = 'inherit';
                }
            }
            result.push(authorEl);
        }
    } else {
        authorEl.classList.add('rbrefined-set-author');
        result.push(authorEl);
    }

    let count: HTMLSpanElement | null = null;

    let setNum = details.querySelector<HTMLElement>('.js-set-details-num>small');
    if (setNum == null && data['set_num']) {
        setNum = createElement('span', {}, [
            createElement('i', {className: 'fa fa-hashtag'}),
            data['set_num'],
        ]);
    } else if (setNum) {
        setNum.querySelector('.label-primary')?.setAttribute('class', 'label badge-light');
        setNum.classList = '';
        count = setNum.querySelector('span.label-info');
        if (count?.querySelector('b')?.textContent === '1') {
            count.replaceChildren();
            if (!setNum.textContent.trim().startsWith('fig-') && data['set_num'] !== 'MOC') {
                count.append(createElement('i', {className: 'fa fa-hashtag'}));
            }
        } else {
            count?.setAttribute('class', 'label label-blue');
        }
    }

    for (const el of details.querySelectorAll<HTMLElement>('.label')) {
        if (el.querySelector('.fa-trophy')) {
            el.remove();
            continue;
        }
        if (el.querySelector('.fa-retweet')) {
            // "Alt+" title.
            if (el.title.includes('Alternate Build') && !el.title.includes('only')) {
                el.append('+');
            }
        }
    }

    const row = createElement('div', {className: 'rbrefined-set-stats'});

    let resultData: Array<string | HTMLElement | null>;
    if (data['likes'] && data['added'] && data['num_parts']) {
        // MOCs
        const [, month, year] = new Date(+data['added'] * 1000).toString().match(/^\w+ (\w+) [0-9]+ ([0-9]{4,6})\b/)!;

        const dateEl = createElement('span', {}, [
            createElement('span', {className: 'rbrefined-extra', innerText: month}),
            `${year}`,
        ]);
        resultData = [
            count,
            data['likes'],
            data['num_parts'],
            dateEl,
        ];
        row.innerHTML = `
            <div><small><span></span></small><i class="fa fa-star"></i><span style="color: var(--primary-high-contrast)"></span></div>
            <div><i class="fa fa-puzzle-piece"></i><span></span></div>
            <div><i class="fa fa-calendar"></i><span></span></div>
        `;
    } else if (setNum != null && data['year'] && data['num_parts']) {
        // Sets
        resultData = [
            setNum,
            data['num_parts'],
            data['year'],
        ];
        row.innerHTML = `
            <div><span></span></div>
            <div><i class="fa fa-puzzle-piece"></i><span></span></div>
            <div><i class="fa fa-calendar"></i><span></span></div>
        `;
    } else {
        return;
    }
    for (const [i, span] of row.querySelectorAll('span').entries()) {
        const data = resultData[i];
        if (data == null) {
            continue;
        }
        const replacement = (data instanceof HTMLElement ? [...data.childNodes] : [data]);
        span.replaceWith(...replacement);
    }
    for (const el of row.querySelectorAll('small')) {
        if (!el.textContent) {
            el.remove();
        }
    }
    result.push(row);

    const buttons = details.querySelector<HTMLElement>('.action-buttons');
    if (buttons) {
        result.push(buttons);
        const likeButton = buttons.querySelector('.js-like-button');
        if (likeButton) {
            row.querySelector('.fa-star')?.replaceWith(likeButton);
            likeButton.classList.remove('pull-right');
            likeButton.querySelector('*')?.classList.remove('fa-fw');
            likeButton.querySelector('*')?.classList.remove('fa-lg');
        }
        if (authorEl != null) {
            for (const button of buttons.querySelectorAll('button')) {
                authorEl.prepend(button);
            }
        }
    }

    details.replaceChildren(...result);
    details.classList.add('rbrefined-populated');
}

function findSetsUnderHeading(heading: HTMLElement): Array<Element> {
    const elements: Array<Element> = [];
    let el: Element | null = heading;
    while ((el = el.nextElementSibling) && el.querySelector('div.heading-title') == null) {
        if (el.querySelector('div.js-sort-data')) {
            elements.push(el);
        }
    }
    return elements;
}

for (const container of document.querySelectorAll<HTMLElement>('#tab_alt_builds')) {
    observeChanges(container, () => {
        if (!container.querySelector('.set-tn')) {
            return false;
        }

        when('moc-sort-options', (activated) => {
            // Allow toggling MOC alt sections and add totals
            for (const heading of container.querySelectorAll<HTMLDivElement>('div.heading-title')) {
                const toggler = createElement('span', {className: 'link pull-right'}, [
                    'Toggle ', createElement('i', {className: 'fa fa-chevron-down'}),
                ]);
                heading.prepend(toggler);
                toggler.addEventListener('click', () => {
                    const parent = heading.parentElement!;
                    const isHidden = parent.style.height === '60px';
                    parent.style.cssText = 'overflow: hidden; interpolate-size: allow-keywords; transition: height 0.15s ease';
                    parent.style.height = (isHidden ? 'auto' : '60px');
                });

                heading.style.marginTop = '20px';
                heading.style.marginBottom = '20px';

                try {
                    let freeCount = 0;
                    let premiumCount = 0;
                    for (const set of findSetsUnderHeading(heading)) {
                        if (set.querySelector('.fa-bolt')) {
                            premiumCount += 1;
                        } else {
                            freeCount += 1;
                        }
                    }
                    const textParts: Array<string> = [];
                    if (freeCount) {
                        textParts.push(`${freeCount} free`);
                    }
                    if (premiumCount) {
                        textParts.push(`${premiumCount} premium`);
                    }
                    if (textParts) {
                        textParts[textParts.length - 1] += textParts[textParts.length - 1].match(/^1\b/) ? ' MOC' : ' MOCs';
                    }
                    heading.querySelector('h4')?.append(
                        createElement('small', {className: 'ml-30'}, [textParts.join(', ')]),
                    );
                } catch (e) {}
            }

            const sortOptionElements: Array<HTMLLIElement> = [];
            for (const [sortByName, sortByKey, sortDefault] of [
                ['Likes', 'likes', 'D'],
                ['Year', 'added', 'A'],
                ['Num Parts', 'num_parts', 'D'],
                ['Author', 'author', 'A'],
            ]) {
                const li = createElement('li', {dataset: {sortByKey, sortDefault}}, [ // 'sort1': 'color_name', 'sort2': 'part_name', 'sort_by': '0',
                    createElement('a', {}, [
                        createElement('i', {className: 'fa fa-fw'}),
                        ' ', sortByName,
                    ]),
                ]);
                sortOptionElements.push(li);
            }

            const sortSelector = createElement('div', {className: 'btn-group', title: 'Sort MOCs'}, [
                createElement('button', {type: 'button', className: 'btn btn-default btn-sm dropdown-toggle', dataset: {'toggle': 'dropdown'}}, [
                    createElement('span'),
                    ' ', createElement('span', {className: 'caret'}),
                ]),
                createElement('ul', {className: 'dropdown-menu', role: 'menu'}, sortOptionElements),
            ]);
            container.prepend(sortSelector);

            nestedEventListener(sortSelector, 'li', 'click', (e, target) => {
                const {sortByKey, sortDefault} = target.dataset;
                const thisI = target.querySelector('i')!;
                const isDescending = !(
                    sortDefault === 'D'
                        ? thisI.classList.contains('fa-sort-amount-desc')
                        : !thisI.classList.contains('fa-sort-amount-asc')
                );
                for (const otherI of sortSelector.querySelectorAll('i')) {
                    otherI.classList.remove('fa-sort-amount-desc');
                    otherI.classList.remove('fa-sort-amount-asc');
                }
                thisI.classList.add(isDescending ? 'fa-sort-amount-desc' : 'fa-sort-amount-asc');
                sortSelector.querySelector('span')!.replaceChildren(...target.querySelector('a')!.cloneNode(true).childNodes);

                for (const heading of container.querySelectorAll<HTMLDivElement>('div.heading-title')) {
                    const elementsToSort = findSetsUnderHeading(heading);
                    if (elementsToSort.length <= 1) {
                        continue;
                    }
                    sortBy(elementsToSort, (e) => {
                        const data = e.querySelector<HTMLDivElement>('div.js-sort-data')!.dataset;
                        return [
                            sortByKey === 'author' ? getAuthorName(e)?.toLocaleLowerCase() : naturalSortKey(data[sortByKey!]),
                            naturalSortKey(data['added']),
                        ];
                    });
                    if (isDescending) {
                        elementsToSort.reverse();
                    }
                    elementsToSort[0].before(...elementsToSort);
                }
            });

            sortOptionElements[0].click();

            activated();
        });
        return true;
    });
}

when('redesign-set-and-moc-tiles', (activated) => {
    for (const container of document.querySelectorAll<HTMLElement>('#set_list_sets, #tab_sets, #tab_alt_builds, #filtered_results, #designer_mocs, #related_mocs, #build_results')) {
        observeChanges(container, () => {
            for (const el of container.querySelectorAll<HTMLDivElement>('.js-sort-data')) {
                populateSetDetails(el.parentElement! as HTMLDivElement);
                activated();
            }
        });
    }
    for (const el of document.querySelectorAll<HTMLDivElement>('.set-tn')) {
        populateSetDetails(el);
        activated();
    }
    addStyle(/* css */`
        .rbrefined-set-stats {
            display: flex;
            justify-content: space-between;
            margin: 2px 0 4px;
            container-type: inline-size;
            width: 100%;
        }
        .rbrefined-set-stats > div {
            display: flex;
            column-gap: 4px;
            align-items: baseline;
            flex-direction: row;
        }
        @container (max-width: 150px) {
            .rbrefined-set-stats > div {
                flex-direction: column;
                align-items: center;
            }
        }
        @container (max-width: 180px) {
            .rbrefined-set-stats > div .rbrefined-extra {
                display: none;
            }
        }
        .rbrefined-set-stats button {
            display: flex;
        }
        .rbrefined-set-stats .label {
            display: inline-block;
            padding: 3.5px;
            font-size: 12px;
        }
        .rbrefined-set-stats .label.fa-retweet {
            filter: opacity(0.85);
        }
        .rbrefined-set-stats .action-buttons {
            min-height: 23px;
        }
        .rbrefined-set-stats .fa-puzzle-piece {
            margin-right: -1.5px;
        }
        .rbrefined-set-author {
            margin-bottom: 0;
            padding-bottom: 1px;
            font-size: 12.5px;
        }
        .text-right:has(.pagination-btns) {
            clear: both;
        }
    `.replaceAll(';', ' !important;'));
});

when('detailed-moc-sidebar', (activated) => {
    const likes = document.querySelector('h2.num-likes')?.textContent;
    const detailsEl = document.querySelector('div.mb-30>span')?.parentElement;
    const partsEl = detailsEl?.querySelector('a[href="#parts_scroll"]')?.parentElement;
    if (likes == null || detailsEl == null || partsEl == null) {
        return;
    }
    const dateMatch = document.querySelector('i.fa-plus[title="Added"]')?.parentElement?.textContent.match(/^\s*(\w{3})\w*\.? ([0-9]+), ([0-9]{4,6})\b/);
    if (dateMatch == null) {
        return;
    }
    const [, month, day, year] = dateMatch;

    const row = createElement('div');
    row.style.margin = '3px';
    const [parts] = partsEl.textContent.match(/\b[0-9]+\b/)!;
    partsEl.previousSibling?.remove();
    partsEl.remove();

    row.innerHTML = `
        <i class="fa fa-star"></i>&thinsp;<span style="color: var(--primary-high-contrast)"></span></td> &thinsp;&bull;&thinsp;
        <i class="fa fa-puzzle-piece"></i>&thinsp;<a href="#parts_scroll" style="color: inherit;"><span></span></a></td> &thinsp;&bull;&thinsp;
        <i class="fa fa-calendar"></i>&thinsp;<span></span></td>
    `;
    const datas = [
        likes,
        parts,
        `${day} ${month} ${year}`,
    ];
    for (const [i, span] of row.querySelectorAll('span').entries()) {
        span.innerText = datas[i];
    }
    detailsEl.append(row);
    activated();
});

when('quick-download-csv-link', (activated) => {
    const downloadsEl = document.querySelector('.p-10.flex-grow p+div, .p-10.flex-grow p+a');
    if (downloadsEl == null) {
        return;
    }

    const newNode = createElement('div');
    newNode.className = 'row pb-6';
    newNode.innerHTML = `
        <div class="col-md-1 hidden-xs hidden-sm">
            <i class="fa fa-lg pt-3 text-muted fa-file-o"></i>
        </div>
        <div class="col-md-11">
            <a rel="nofollow">Parts list - Rebrickable CSV</a>
        </div>
    `;

    let invId: string | null = null;

    for (const el of document.querySelectorAll<HTMLButtonElement>('button[data-url]')) {
        const match = /\binv_id=([0-9]+)\b/.exec(el.dataset['url']!);
        if (match) {
            [, invId] = match;
        }
    }
    if (!invId) {
        return;
    }
    const link = newNode.querySelector('a')!;
    link.href = `https://rebrickable.com/inventory/${invId}/parts/?format=rbpartscsv&_=${+new Date()}`;
    downloadsEl.after(newNode);
    activated();
});
