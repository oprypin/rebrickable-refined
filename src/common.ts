// Copyright (C) 2026 Oleh Prypin

/* eslint-disable @typescript-eslint/no-unused-vars */

function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K, options?: Partial<HTMLElementTagNameMap[K]>, children?: Array<string | HTMLElement>,
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tagName);
    for (const key in options) {
        el[key] = options[key]!;
    }
    if (children) {
        el.append(...children);
    }
    return el;
}

const alreadyAddedStyles: Set<string> = new Set();
function addStyle(textContent: string, element: HTMLElement | ShadowRoot = document.head) {
    if (alreadyAddedStyles.has(textContent)) {
        return;
    }
    alreadyAddedStyles.add(textContent);
    element.appendChild(createElement('style', {textContent}));
}

function nestedEventListener<K extends keyof HTMLElementEventMap>(
    container: HTMLElement,
    selector: string,
    eventName: K,
    handler: (e: HTMLElementEventMap[K], target: HTMLElement) => void,
): void {
    container.addEventListener(eventName, (e) => {
        const targetElement = (e.target as Element | null)?.closest<HTMLElement>(selector);
        if (targetElement != null && container.contains(targetElement)) {
            handler(e, targetElement);
        }
    });
}

function observeChanges(container: HTMLElement, action: () => boolean | void, delay: number = 20) {
    let mutationTimer: number | null = null;
    let preventMutations = false;

    function onSequenceFinished() {
        preventMutations = true;
        if (action()) {
            return;
        }
        setTimeout(() => {
            preventMutations = false;
        }, 10);
    }

    const observer = new MutationObserver(() => {
        if (mutationTimer != null) {
            clearTimeout(mutationTimer);
        }
        if (!preventMutations) {
            if (delay > 0) {
                mutationTimer = setTimeout(onSequenceFinished, 20);
            } else {
                onSequenceFinished();
            }
        }
    });
    observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
    });
}

function initiateDownload(
    data: Array<BlobPart>,
    {filename, type}: {filename: string; type: string},
) {
    const blob = new Blob(data, {type: type});
    const url = window.URL.createObjectURL(blob);
    const a = createElement('a', {href: url, download: filename});
    a.style = 'display: "none"';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}
