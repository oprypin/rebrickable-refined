// Copyright (C) 2026 Oleh Prypin

function populateSetDetails(root: HTMLDivElement) {
    const details = root.querySelector('.set-tn-details>*');
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
    if (authorEl != null) {
        authorEl.setAttribute('style', 'margin-bottom: 0 !important; padding-bottom: 1px; font-size: 13px !important');
        result.push(authorEl);
    }

    let count: HTMLSpanElement | null = null;

    let setNum = details.querySelector<HTMLElement>('.js-set-details-num>small');
    if (setNum == null && data['set_num']) {
        setNum = createElement('span', {}, [
            createElement('i', {className: 'fa fa-hashtag'}),
            '\u2009',
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
            el.style.filter = 'opacity(0.85)';
        }
        el.style.display = 'inline-block';
        el.style.padding = '3.5px';
        el.style.fontSize = '12px !important';
    }

    const row = createElement('div');
    row.setAttribute('style', 'display: flex; justify-content: space-between; align-items: center; width: 100%; margin: 2px 0 4px');

    let resultData: Array<string | HTMLElement | null>;
    if (data['likes'] && data['added'] && data['num_parts']) {
        // MOCs
        const [, month, year] = new Date(+data['added'] * 1000).toString().match(/^\w+ (\w+) [0-9]+ ([0-9]{4,6})\b/)!;
        resultData = [
            count,
            data['likes'],
            data['num_parts'],
            document.querySelector('#user_profile_sections') ? year : `${month} ${year}`,
        ];
        row.innerHTML = `
            <div><small><span></span></small> <label style="margin: 0"><i class="fa fa-star"></i>&thinsp;<span style="color: var(--primary-high-contrast)"></span></label></div>
            <div><i class="fa fa-puzzle-piece"></i>&thinsp;<span></span></div>
            <div><i class="fa fa-calendar"></i>&thinsp;<span></span></div>
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
            <div><i class="fa fa-puzzle-piece"></i>&thinsp;<span></span></div>
            <div><i class="fa fa-calendar"></i>&thinsp;<span></span></div>
        `;
    } else {
        return;
    }
    for (const [i, span] of row.querySelectorAll('span').entries()) {
        if (resultData[i] != null) {
            span.append(resultData[i]);
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
        buttons.style.minHeight = '23px';
    }

    details.replaceChildren(...result);
    details.classList.add('rbrefined-populated');
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
