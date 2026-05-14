// Copyright (C) 2026 Oleh Prypin

function applyHighContrast() {
    // Special early activation
    if (localStorage.getItem('rbrefined-enable-high-contrast-text') === 'true') {
        document.body.classList.add('text-high-contrast');
    }

    when('enable-high-contrast-text', (activated) => {
        document.body.classList.add('text-high-contrast');
        // Fix a bug on the website - links should also be high-contrast when that's activated.
        const style = document.createElement('style');
        style.textContent = `
            .text-high-contrast .link.green {
                color: var(--primary-high-contrast);
            }
            .text-high-contrast .autosuggest {
                --text-color: var(--text-color-high-contrast);
            }
            .autosuggest .tt-suggestion {
                color: var(--text-color);
            }
        `.replaceAll(';', ' !important;');
        document.head.appendChild(style);
        activated();
    });
}

if (document.body && document.head) {
    applyHighContrast();
} else {
    const observer = new MutationObserver(() => {
        if (document.body && document.head) {
            applyHighContrast();
            observer.disconnect();
        }
    });
    observer.observe(document.documentElement, {childList: true});
}
