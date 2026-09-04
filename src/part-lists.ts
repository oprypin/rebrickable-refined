// Copyright (C) 2026 Oleh Prypin

const inventoryStyles = /* css */ `
.inv_img,
.inv_img.border-green,
.inv_img.border-orange,
.inv_img.border-red {
    border-width: 3px !important;
    border-radius: 0.25rem;
    margin: 2px;
    padding: 0;
    padding-bottom: 3px;
    line-height: 1.05;
}
.inv_img.border-green {
    border-color: var(--primary);
}
.inv_img.border-orange {
    border-color: var(--part-orange);
}
.inv_img.border-red {
    border-color: var(--part-red);
}
.inv_img::after {
    display: none;
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
.inv_img .rb-card__image {
    margin: 0;
    padding: 3px;
    padding-bottom: 1px;
}
.part-text {
    padding-top: 0;
    font-size: 105% !important;
}
.part-text small {
    font-size: 90%;
}
.part-length-overlay {
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
.js-part a, .js-part .part-text {
    text-decoration: none;
    color: var(--primary-high-contrast) !important;
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

.js-part-data.rbrefined-corner img.part-overlay.img-responsive {
    top: 8px;
}

.js-part .control-label.checkbox:has(input:focus),
.js-part .control-label.checkbox:has(input:active) {
    outline: 1px dashed gray;
}
`.replace(/^\.\b/gm, 'body .rbrefined-part-list .');

function processCheckboxList(container: HTMLElement) {
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
        const itemSelector = '.js-part, li.clearfix';
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
        processCheckboxList(inventoryContainer);
        void activated;
    });

    observeChanges(inventoryContainer, () => {
        for (const part of inventoryContainer.querySelectorAll<HTMLElement>('.js-part')) {
            when('checklist-range-selection', (activated) => {
                activated();
            });

            const countText = part.querySelector('.part-text b');
            if (countText == null) {
                continue;  // Not `return` - for the case where only 1 item in the inventory gets dynamically refreshed.
            }

            when('rework-inventory-styles', (activated) => {
                // Move the part quantity out of the first line.
                countText.textContent = countText.textContent.replace(' x', '');
                part.querySelector('.part-text')?.after(countText);

                const img = part.querySelector('.inv_img');
                if (img != null && !img.classList.contains('inv_img_small')) {
                    img.classList.add('inv_img_med');
                }

                activated();
            });

            fixImg(part, true);
        }
    }, 0);

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

    when('always-export-parts', (activated) => {
        for (const inventory of inventoryContainer.querySelectorAll<HTMLDivElement>('#common_parts:has(.js-part)')) {
            if (inventory.querySelector('.js-export-parts-list, .rbrefined-export-parts-list')) {
                continue;
            }
            const exportButton = createElement('button', {className: 'btn btn-default rbrefined-export-parts-list'}, [
                createElement('i', {className: 'fa fa-save'}), ' ',
                createElement('span', {className: 'hidden-xs'}, ['Export Parts']), ' ',
                createElement('span', {className: 'hidden-xs'}, ['(CSV)']),
            ]);
            exportButton.addEventListener('click', () => {
                exportInventoryCsv(inventory);
            });
            inventory.prepend(exportButton);
            activated();
        }
    });
}

function exportInventoryCsv(inventory: HTMLElement) {
    const csvRows = ['Part,Color,Quantity\n'];
    for (const part of inventory.querySelectorAll<HTMLElement>('.inv_img .js-part-data')) {
        const [, partNum] = new RegExp('/parts/(\\w+)/').exec(part.dataset['url']!)!;
        const colorId = part.dataset['color_id']!;
        const quantity = part.dataset['quantity']!;
        csvRows.push(`${partNum},${colorId},${quantity}\n`);
    }
    let suffix = inventory.id;
    if (suffix) {
        suffix = '_' + suffix;
    }
    if (csvRows.length > 1) {
        initiateDownload(csvRows, {filename: `rebrickable_parts${suffix}.csv`, type: 'text/csv;charset=utf-8'});
    } else {
        alert('No parts to export');
    }
}

const timestampsToDarken = new Set([
    // eslint-disable-next-line max-len
    1658325910, 1658327267, 1658360518, 1658402741, 1658421977, 1658593259, 1659332137, 1660677824, 1662004997, 1664337115, 1667885165, 1668930054, 1677488827, 1714159439, 1714159537, 1714336722, 1714971632, 1735206000, 1740507707, 1761194141, 1761194825, 1761325970, 1761776603, 1761778632, 1761780364, 1761780680, 1761780951, 1761781249, 1761781758, 1761782098, 1761857705, 1761860373, 1761860900, 1761861509, 1762305393, 1762305935, 1762315437, 1762315861, 1762316088, 1762323727, 1762410054, 1763446536, 1763542363, 1765446274, 1765543968, 1765545397, 1769340593, 1771567551, 1774485081,
]);
const elementsToDarken = new Set([
    // eslint-disable-next-line max-len
    73667, 75580, 75777, 82281, 82339, 233526, 234626, 237626, 244126, 244426, 244726, 245626, 247926, 255526, 256926, 260726, 281526, 287826, 292126, 292626, 300626, 300726, 304826, 313926, 329826, 330726, 340326, 347526, 362426, 365926, 371126, 373026, 379426, 383026, 384426, 387326, 394026, 395626, 395926, 396226, 408126, 409526, 415126, 428226, 434126, 436026, 448526, 448826, 453026, 458926, 471626, 486426, 601926, 609326, 622126, 655826, 657926, 658326, 3004326, 3004626, 3004826, 4105207, 4105221, 4107081, 4107182, 4107581, 4107585, 4107765, 4107783, 4107784, 4107807, 4107828, 4109969, 4110045, 4111942, 4111944, 4112282, 4112287, 4112804, 4112862, 4113021, 4113027, 4113209, 4113267, 4113299, 4113805, 4113850, 4113870, 4113942, 4114128, 4114131, 4114206, 4114294, 4114295, 4114503, 4114510, 4114634, 4114670, 4114671, 4114689, 4116941, 4118867, 4119020, 4119324, 4119328, 4119333, 4119374, 4120017, 4120182, 4120251, 4120425, 4121610, 4121667, 4121670, 4121697, 4121927, 4124111, 4124172, 4124490, 4124493, 4128603, 4140327, 4140430, 4140670, 4140737, 4141113, 4141120, 4141255, 4141301, 4141810, 4141815, 4141820, 4142236, 4142543, 4142731, 4142816, 4142861, 4143181, 4143247, 4143307, 4143417, 4143419, 4143473, 4143751, 4143982, 4144352, 4144502, 4144521, 4144526, 4144530, 4153013, 4153025, 4153044, 4153393, 4154767, 4155558, 4156150, 4156948, 4156980, 4157286, 4157659, 4157825, 4158029, 4159140, 4159182, 4160393, 4160409, 4162076, 4162163, 4162235, 4162956, 4162966, 4163524, 4163544, 4163904, 4164067, 4164133, 4164422, 4164468, 4164471, 4165974, 4167106, 4167774, 4167796, 4168685, 4168884, 4169047, 4169414, 4170963, 4173668, 4177430, 4177434, 4177441, 4177961, 4179140, 4179876, 4181124, 4183028, 4184300, 4184813, 4185272, 4185652, 4186569, 4186598, 4186713, 4186769, 4186773, 4191459, 4192456, 4192535, 4192604, 4192716, 4192763, 4193529, 4193693, 4194116, 4195378, 4195379, 4198536, 4198613, 4200031, 4200486, 4201224, 4203611, 4206156, 4209729, 4212278, 4212899, 4213241, 4213398, 4213649, 4215149, 4215982, 4217795, 4218083, 4218517, 4218587, 4218982, 4220098, 4221659, 4221663, 4221774, 4226000, 4226509, 4227006, 4227682, 4227853, 4238840, 4239237, 4239365, 4242035, 4242385, 4244953, 4245120, 4246900, 4248956, 4249857, 4249892, 4251781, 4252528, 4262086, 4263506, 4263949, 4275311, 4275338, 4275341, 4275397, 4275460, 4275491, 4275535, 4275826, 4277774, 4278015, 4278585, 4278594, 4278747, 4279235, 4282746, 4283146, 4285385, 4286009, 4287632, 4287672, 4288259, 4288446, 4289369, 4289376, 4289535, 4289839, 4289927, 4290015, 4291178, 4292482, 4292590, 4293076, 4294582, 4294690, 4294996, 4295131, 4295395, 4295400, 4296198, 4296202, 4296203, 4296204, 4296205, 4296268, 4296420, 4297576, 4297719, 4298653, 4299844, 4490248, 4492322, 4496343, 4496674, 4498340, 4500394, 4500440, 4500451, 4500458, 4501048, 4502834, 4504612, 4506832, 4506833, 4507542, 4507700, 4508144, 4509669, 4510072, 4510441, 4512821, 4512823, 4513023, 4514411, 4514560, 4515185, 4516196, 4516431, 4518494, 4520075, 4521072, 4522034, 4525236, 4526085, 4526578, 4526756, 4526761, 4526982, 4527063, 4528915, 4530578, 4535765, 4535771, 4535834, 4535892, 4536184, 4537990, 4538781, 4538782, 4539110, 4539364, 4539385, 4539428, 4540599, 4540890, 4540906, 4543367, 4543490, 4547041, 4547625, 4548726, 4549989, 4550004, 4551168, 4556981, 4558692, 4558775, 4558850, 4560174, 4562009, 4563044, 4563474, 4563681, 4565884, 4566781, 4569087, 4569106, 4570199, 4578958, 4581740, 4582536, 4583859, 4584126, 4584332, 4584550, 4585452, 4586502, 4587312, 4587313, 4587318, 4587904, 4588026, 4589489, 4589495, 4589952, 4589953, 4590766, 4593553, 4593554, 4593555, 4593557, 4593562, 4593567, 4593569, 4593571, 4593576, 4593579, 4594436, 4595443, 4595707, 4595711, 4595820, 4595981, 4596243, 4597267, 4603490, 4609682, 4609820, 4612358, 4612398, 4612482, 4613736, 4614487, 4616245, 4620400, 4621893, 4622310, 4626682, 4632584, 4632595, 4632618, 4632626, 4632637, 4633510, 4636280, 4637372, 4647128, 4648117, 4650145, 4650900, 4652060, 4652069, 4652375, 4652418, 4653226, 4655565, 4655659, 4658977, 4659404, 4667277, 6001664, 6002201, 6003478, 6004944, 6007966, 6008340, 6011382, 6012466, 6015899, 6016824, 6017091, 6018304, 6018492, 6019986, 6019988, 6020265, 6021512, 6021616, 6021952, 6022202, 6022289, 6022290, 6022432, 6022447, 6022562, 6022943, 6023036, 6023720, 6025012, 6029862, 6030249, 6030718, 6032095, 6032136, 6032681, 6033802, 6035141, 6035176, 6036006, 6036787, 6038385, 6038654, 6039134, 6039194, 6039203, 6039762, 6040297, 6040299, 6040336, 6045912, 6047510, 6047885, 6050965, 6052796, 6052851, 6054856, 6055308, 6055382, 6055589, 6055596, 6055605, 6055612, 6055630, 6055879, 6056354, 6056377, 6056379, 6056683, 6057702, 6057727, 6057794, 6057819, 6062098, 6066113, 6070162, 6070733, 6074372, 6076566, 6077866, 6078731, 6078987, 6080458, 6083112, 6083346, 6088065, 6088489, 6089577, 6092446, 6093977, 6096092, 6096129, 6100054, 6100429, 6100627, 6100851, 6102198, 6102367, 6102782, 6106280, 6108553, 6109891, 6110044, 6114392, 6115198, 6117082, 6117084, 6117858, 6121457, 6121725, 6122094, 6122096, 6122656, 6123920, 6123960, 6124610, 6124650, 6124733, 6125683, 6125693, 6127506, 6129249, 6129250, 6129374, 6129476, 6134781, 6135009, 6135125, 6135323, 6138217, 6139451, 6141782, 6142215, 6143430, 6151289, 6151690, 6152437, 6153136, 6153591, 6155220, 6156679, 6156897, 6158192, 6160104, 6161512, 6162511, 6163846, 6167933, 6170808, 6172764, 6172984, 6173926, 6174075, 6174168, 6174502, 6174845, 6175322, 6176748, 6177156, 6179277, 6181749, 6182771, 6187157, 6187578, 6188305, 6190162, 6190398, 6191714, 6192232, 6192276, 6192778, 6192824, 6193903, 6194096, 6194128, 6194233, 6194840, 6211963, 6212341, 6213709, 6213722, 6213729, 6214552, 6222271, 6222278, 6227027, 6227028, 6227031, 6230452, 6235174, 6248533, 6250020, 6250911, 6251143, 6251172, 6251960, 6254809, 6255103, 6262019, 6265699, 6266224, 6266244, 6268899, 6269866, 6270317, 6271133, 6271277, 6271278, 6271736, 6283610, 6284072, 6285530, 6286381, 6286835, 6287400, 6287555, 6293386, 6296345, 6301912, 6302085, 6302092, 6302550, 6302576, 6303189, 6310188, 6315573, 6317524, 6323871, 6325254, 6328408, 6330086, 6331437, 6331935, 6334604, 6336989, 6349964, 6351360, 6352693, 6356162, 6356861, 6359887, 6363252, 6365577, 6366624, 6370536, 6371743, 6371949, 6371960, 6375706, 6375834, 6377025, 6380021, 6380030, 6380639, 6382697, 6390379, 6395354, 6395769, 6401207, 6402958, 6407188, 6408124, 6430722, 6528721, 6534695, 6535029,
]);
const elementsNotAvailable = new Set([
    394202, 4114379, 4114758, 4155062, 4157765, 4169489, 4183051, 4215513, 4227598, 4519317, 4519318, 6296526,
]);
const elementsToReplace = new Map([
    [4159047, 4639775],
    [6450883, 6508150],
    [6548290, 6242241],
]);
const elementsToReplaceAnyway = new Set([  // eslint-disable-next-line max-len
    4119674, 4129848, 4158935, 4159736, 4159737, 4159742, 4162143, 4162507, 4162952, 4163480, 4163532, 4163928, 4164169, 4164237, 4164246, 4164248, 4165521, 4166037, 4166522, 4168885, 4169425, 4171973, 4172149, 4173061, 4173206, 4176634, 4178189, 4179282, 4179822, 4182012, 4183073, 4183106, 4184895, 4186372, 4186528, 4187745, 4194239, 4194240, 4211387, 4211388, 4211394, 4211397, 4211398, 4216217, 4238349, 4238357, 4243827, 4243832, 4243833, 4251149, 4514846, 6093058, 6146863, 6225246, 6337380, 6390673,
]);
for (const el of elementsToReplace.keys()) {
    elementsToReplaceAnyway.add(el);
}

function fixImg(container: HTMLElement, alsoNonLazy = false) {
    const img = (
        container.tagName === 'IMG'
            ? container as HTMLImageElement
            : container.querySelector<HTMLImageElement>('img')
    );
    if (img == null) {
        return;
    }
    let imgSrc = (img.dataset['src'] ?? (alsoNonLazy ? img.src : null))!;
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
        let element = parseInt(elementMatch[1]);
        const timestamp = Math.floor(parseFloat(elementMatch[2]));
        const colorId = container.querySelector<HTMLElement>('[data-color_id]')?.dataset['color_id'];
        if (
            (timestamp >= 1775010000 || elementsToReplaceAnyway.has(element))
            && !elementsNotAvailable.has(element)
        ) {
            if (elementsToReplace.has(element)) {
                element = elementsToReplace.get(element)!;
            }
            replaceImage(`https://www.lego.com/cdn/product-assets/element.img.lod5photo.192x192/${element}.jpg`);
            if (elementsToDarken.has(element)) {
                img.style.filter = 'contrast(1.28)';
            }
        } else if (colorId === '0') {
            if ((timestamp <= 1658354369 && timestamp !== 1658325727) || timestampsToDarken.has(timestamp)) {
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

for (const placeholderContainer of document.querySelectorAll<HTMLElement>('#part_stores_list')) {
    processPartsInventory(placeholderContainer);
}

when('checklist-range-selection', (activated) => {
    for (const checkboxContainer of document.querySelectorAll<HTMLElement>('#part_list_filters, #set_list_filters, #lost_parts_sidebar, #drill_down_filters')) {
        observeChanges(checkboxContainer, () => {
            const checkboxLists = checkboxContainer.querySelectorAll<HTMLUListElement>('ul:has(input.js-drill-down-filter[type=checkbox])');
            for (const checkboxList of checkboxLists) {
                processCheckboxList(checkboxList);
            }
            if (checkboxLists.length > 0) {
                activated();
                return true;
            }
            return false;
        });
    }
});

for (const img of document.querySelectorAll<HTMLElement>('img.img-responsive[data-src]')) {
    fixImg(img);
}

for (const container of document.querySelectorAll<HTMLElement>('div[data-src], div.tab-content>.tab-pane, #set_list_sets, #build_results, #filtered_results')) {
    const observer = new MutationObserver(() => {
        for (const part of container.querySelectorAll<HTMLElement>('div.js-part, div.set-tn')) {
            fixImg(part);
        }
    });
    for (const el of [container, ...container.querySelectorAll('div[id]')]) {
        observer.observe(el, {
            childList: true,
            attributes: true,
        });
    }
}
