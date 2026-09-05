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
            .link.green {
                color: var(--primary-high-contrast);
            }
            .text-high-contrast {
                --text-color: var(--text-color-high-contrast);
            }
            .autosuggest .tt-suggestion {
                color: var(--text-color) !important;
            }
            a {
                font-weight: normal !important;
            }
            .text-muted {
                color: #666;
            }
            .dark-mode .text-muted {
                color: #bbb;
            }
            h1 .small, h2 small, h3 small, h4 small, h5 small {
                color: #555;
            }
            .dark-mode h1 .small, .dark-mode h2 small, .dark-mode h3 small, .dark-mode h4 small, .dark-mode h5 small {
                color: #999;
            }
        `;
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
