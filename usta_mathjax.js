/**
 * USTA Template - MathJax Configuration and Utilities
 */

// ─────────────────────────────────────────────────────────────
// tagCodeBlocks()
// Lee la clase de lenguaje que Pandoc pone en <code class="sourceCode r">
// y la propaga al div.sourceCode padre como data-lang="R".
// ─────────────────────────────────────────────────────────────
const LANG_MAP = {
    r: 'R', rscript: 'R',
    python: 'Python', py: 'Python',
    bash: 'Bash', sh: 'Shell',
    sql: 'SQL', javascript: 'JS', js: 'JS',
    css: 'CSS', html: 'HTML',
    yaml: 'YAML', json: 'JSON',
    cpp: 'C++', c: 'C', julia: 'Julia'
};

function detectLangFromClasses(el) {
    for (const cls of el.classList) {
        const key = cls.toLowerCase().replace('language-', '');
        if (LANG_MAP[key]) return { key, label: LANG_MAP[key] };
    }
    return null;
}

function detectLangFromSource(src) {
    if (/<-\s|library\s*\(|ggplot|data\.frame|tibble|dplyr|%>%|\|>/.test(src))
        return { key: 'r', label: 'R' };
    if (/\bimport\s+\w|\bdef\s+\w|print\s*\(|pandas|numpy|plt\./.test(src))
        return { key: 'python', label: 'Python' };
    return null;
}

function pandocHasSpans(codeEl) {
    return codeEl.querySelector('span[class]') !== null;
}

function tagCodeBlocks() {
    document.querySelectorAll('div.sourceCode').forEach(function (block) {
        const codeEl = block.querySelector('code');
        const preEl = block.querySelector('pre');
        if (!codeEl) return;

        let detected = detectLangFromClasses(codeEl)
            || (preEl && detectLangFromClasses(preEl));

        if (!detected) {
            detected = detectLangFromSource(codeEl.textContent || '');
        }

        if (detected) {
            block.setAttribute('data-lang', detected.label);
            if (!block.classList.contains(detected.key))
                block.classList.add(detected.key);
        }

        if (!pandocHasSpans(codeEl) && typeof hljs !== 'undefined') {
            const langKey = detected ? detected.key : null;
            const rawCode = codeEl.textContent;
            let result;
            try {
                result = langKey
                    ? hljs.highlight(rawCode, { language: langKey, ignoreIllegals: true })
                    : hljs.highlightAuto(rawCode);
                codeEl.innerHTML = result.value;
                codeEl.classList.add('hljs');
            } catch (e) {
                try {
                    result = hljs.highlightAuto(rawCode);
                    codeEl.innerHTML = result.value;
                    codeEl.classList.add('hljs');
                } catch (e2) { /* dejar como está */ }
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────
// fixRawMath()
// Convierte delimitadores LaTeX crudos en elementos MathJax
// ─────────────────────────────────────────────────────────────
function fixRawMath() {
    if (typeof MathJax === 'undefined') return;

    const container = document.querySelector('.main-container') || document.body;
    let changed = false;

    const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName;
                if (['PRE', 'CODE', 'SCRIPT', 'STYLE', 'TEXTAREA'].includes(tag))
                    return NodeFilter.FILTER_REJECT;
                if (parent.classList.contains('MathJax') ||
                    parent.classList.contains('math') ||
                    parent.tagName === 'MJX-CONTAINER')
                    return NodeFilter.FILTER_REJECT;
                if (/\\\(|\\\[/.test(node.textContent))
                    return NodeFilter.FILTER_ACCEPT;
                return NodeFilter.FILTER_SKIP;
            }
        }
    );

    const nodesToWrap = [];
    let node;
    while ((node = walker.nextNode())) nodesToWrap.push(node);

    nodesToWrap.forEach(function (textNode) {
        const text = textNode.textContent;
        let wrapped = text;

        // Display math: \[ ... \] -> wrap preserving delimiters for MathJax
        wrapped = wrapped.replace(/\\\[([\s\S]*?)\\\]/g,
            function (match) {
                return '<span class="math display">' + match + '</span>';
            });

        // Inline math: \( ... \) -> wrap preserving delimiters for MathJax
        wrapped = wrapped.replace(/\\\(([\s\S]*?)\\\)/g,
            function (match) {
                return '<span class="math inline">' + match + '</span>';
            });

        if (wrapped !== text) {
            const span = document.createElement('span');
            span.innerHTML = wrapped;
            textNode.parentNode.replaceChild(span, textNode);
            changed = true;
        }
    });

    if (MathJax.typesetPromise) {
        MathJax.typesetPromise([container])
            .then(() => {
                console.log('MathJax typeset completed successfully');
            })
            .catch((err) => {
                console.warn('MathJax typeset error:', err);
            });
    }
}

// Toggle TOC function
function toggleTOC() {
    document.body.classList.toggle('toc-collapsed');
    const icon = document.querySelector('#tocToggle i');
    if (document.body.classList.contains('toc-collapsed')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-arrow-right');
    } else {
        icon.classList.remove('fa-arrow-right');
        icon.classList.add('fa-bars');
    }
    localStorage.setItem('toc-collapsed', document.body.classList.contains('toc-collapsed'));
}

// Add lesson headers to sections
function addLessonHeaders() {
    const mainContent = document.querySelector('.main-content, .main-container, body');
    const sections = mainContent.querySelectorAll('h1, h2:not(.toc-title)');

    const mainSections = [];
    sections.forEach(header => {
        if (header.closest('#TOC') || header.closest('.usta-header-banner')) return;
        mainSections.push(header);
    });

    const totalSections = mainSections.length;

    const icons = [
        'fa-book-open', 'fa-chart-line', 'fa-calculator', 'fa-database',
        'fa-brain', 'fa-lightbulb', 'fa-graduation-cap', 'fa-file-alt',
        'fa-cogs', 'fa-chart-bar', 'fa-microscope', 'fa-rocket'
    ];

    mainSections.forEach((header, index) => {
        if (header.parentElement.querySelector('.lesson-header')) return;

        const iconIndex = index % icons.length;
        const icon = icons[iconIndex];

        const lessonHeader = document.createElement('div');
        lessonHeader.className = 'lesson-header';
        lessonHeader.innerHTML = '<span class="lesson-badge">' +
            '<i class="fas ' + icon + '"></i>' +
            '<span>Lección ' + (index + 1) + ' de ' + totalSections + '</span>' +
            '</span>';

        header.parentNode.insertBefore(lessonHeader, header);
    });
}

// Restore TOC state from localStorage
document.addEventListener('DOMContentLoaded', function () {
    const isMobile = window.innerWidth < 768;
    const savedState = localStorage.getItem('toc-collapsed');

    const shouldCollapse = isMobile
        ? savedState !== 'false'
        : savedState === 'true';

    if (shouldCollapse) {
        document.body.classList.add('toc-collapsed');
        const icon = document.querySelector('#tocToggle i');
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-arrow-right');
        }
    } else {
        if (!isMobile) {
            const icon = document.querySelector('#tocToggle i');
            if (icon) {
                icon.classList.remove('fa-arrow-right');
                icon.classList.add('fa-bars');
            }
        }
    }

    tagCodeBlocks();
    addLessonHeaders();
    fixRawMath();

    const tocLinks = document.querySelectorAll('#TOC a');
    const sections = document.querySelectorAll('.section, h1, h2, h3, h4');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id || entry.target.querySelector('[id]')?.id;
                if (id) {
                    tocLinks.forEach(link => {
                        link.parentElement.classList.remove('active');
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.parentElement.classList.add('active');
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                if (window.innerWidth < 768) {
                    document.body.classList.add('toc-collapsed');
                    const icon = document.querySelector('#tocToggle i');
                    if (icon) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-arrow-right');
                    }
                }
            }
        });
    });

    document.getElementById('tocOverlay')?.addEventListener('click', function () {
        document.body.classList.add('toc-collapsed');
        const icon = document.querySelector('#tocToggle i');
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-arrow-right');
        }
    });
});
