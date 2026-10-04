/* ============================================================
   ISAstaurant — логика стартовой панели
   Язык · Тема · Выбор филиала · Навигация
   ============================================================ */
(function () {
    'use strict';

    /* --------------------------------------------------------
       1. Конфигурация
       -------------------------------------------------------- */

    // Список филиалов — общий с меню, лежит в branches.js
    var BRANCHES = window.ISA_BRANCHES || [];

    // Словарь переводов. Ключ = значение атрибута data-i18n / data-i18n-aria.
    var TRANSLATIONS = {
        ru: {
            tagline:           'Вкус, который запоминается',
            branchLabel:       'Выберите филиал',
            branchPlaceholder: 'Не выбрано',
            continue:          'Продолжить',
            langToggleLabel:   'Сменить язык',
            themeToggleLabel:  'Сменить тему'
        },
        en: {
            tagline:           'A taste worth remembering',
            branchLabel:       'Choose a branch',
            branchPlaceholder: 'Not selected',
            continue:          'Continue',
            langToggleLabel:   'Switch language',
            themeToggleLabel:  'Switch theme'
        }
    };

    var LANGUAGES = ['ru', 'en'];
    var THEMES = ['dark', 'light'];

    var STORAGE_KEYS = {
        lang:       'isastaurant:lang',
        theme:      'isastaurant:theme',
        branch:     'isastaurant:branch',
        // Переводы названия филиала — их читает шапка меню,
        // чтобы не дублировать справочник BRANCHES во втором файле
        branchName: 'isastaurant:branchName'
    };

    /* --------------------------------------------------------
       2. Состояние + безопасный localStorage
       -------------------------------------------------------- */

    var state = {
        lang: 'ru',
        theme: 'dark',
        branchId: null
    };

    // localStorage может бросать исключение (приватный режим, отключённые cookies)
    function storageGet(key) {
        try { return window.localStorage.getItem(key); }
        catch (e) { return null; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); }
        catch (e) { /* тихо игнорируем */ }
    }

    /* --------------------------------------------------------
       3. DOM-ссылки
       -------------------------------------------------------- */

    var dom = {
        root:          document.documentElement,
        langToggle:    document.getElementById('langToggle'),
        langValue:     document.getElementById('langToggleValue'),
        themeToggle:   document.getElementById('themeToggle'),
        select:        document.getElementById('branchSelect'),
        trigger:       document.getElementById('branchTrigger'),
        selectValue:   document.getElementById('branchValue'),
        list:          document.getElementById('branchList'),
        continueBtn:   document.getElementById('continueBtn')
    };

    /* --------------------------------------------------------
       4. Язык
       -------------------------------------------------------- */

    // Применяет текущий язык ко всем элементам с data-i18n / data-i18n-aria.
    function applyLanguage() {
        var dict = TRANSLATIONS[state.lang];

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-aria');
            if (dict[key]) el.setAttribute('aria-label', dict[key]);
        });

        dom.root.setAttribute('lang', state.lang);
        // Кнопка показывает текущий язык
        dom.langValue.textContent = state.lang.toUpperCase();

        // Названия филиалов и выбранное значение зависят от языка
        renderBranchOptions();
        renderSelectedBranch();
    }

    function setLanguage(lang, persist) {
        if (LANGUAGES.indexOf(lang) === -1) lang = 'ru';
        state.lang = lang;
        applyLanguage();
        if (persist !== false) storageSet(STORAGE_KEYS.lang, lang);
    }

    function toggleLanguage() {
        var next = LANGUAGES[(LANGUAGES.indexOf(state.lang) + 1) % LANGUAGES.length];

        // Небольшая анимация «выезда» старого значения
        dom.langToggle.classList.add('is-switching');
        window.setTimeout(function () {
            setLanguage(next);
            dom.langToggle.classList.remove('is-switching');
        }, 180);
    }

    /* --------------------------------------------------------
       5. Тема
       -------------------------------------------------------- */

    function setTheme(theme, persist) {
        if (THEMES.indexOf(theme) === -1) theme = 'dark';
        state.theme = theme;
        dom.root.setAttribute('data-theme', theme);
        dom.themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
        if (persist !== false) storageSet(STORAGE_KEYS.theme, theme);
    }

    function toggleTheme() {
        setTheme(state.theme === 'dark' ? 'light' : 'dark');
    }

    /* --------------------------------------------------------
       6. Выбор филиала (кастомный select)
       -------------------------------------------------------- */

    // Строит список опций из массива BRANCHES на текущем языке.
    function renderBranchOptions() {
        dom.list.innerHTML = '';

        BRANCHES.forEach(function (branch) {
            var li = document.createElement('li');
            li.className = 'select__option';
            li.setAttribute('role', 'option');
            li.setAttribute('data-id', branch.id);
            li.setAttribute('aria-selected', String(branch.id === state.branchId));
            li.textContent = branch.name[state.lang] || branch.name.ru;

            li.addEventListener('click', function () {
                selectBranch(branch.id);
                closeSelect();
                dom.trigger.focus();
            });

            dom.list.appendChild(li);
        });
    }

    function findBranch(id) {
        for (var i = 0; i < BRANCHES.length; i++) {
            if (BRANCHES[i].id === id) return BRANCHES[i];
        }
        return null;
    }

    // Обновляет текст в шапке select-а.
    function renderSelectedBranch() {
        var branch = findBranch(state.branchId);

        if (branch) {
            dom.selectValue.textContent = branch.name[state.lang] || branch.name.ru;
            dom.selectValue.classList.remove('is-placeholder');
            dom.selectValue.removeAttribute('data-i18n');
        } else {
            dom.selectValue.textContent = TRANSLATIONS[state.lang].branchPlaceholder;
            dom.selectValue.classList.add('is-placeholder');
            dom.selectValue.setAttribute('data-i18n', 'branchPlaceholder');
        }

        dom.continueBtn.classList.toggle('is-idle', !branch);
    }

    function selectBranch(id, persist) {
        var branch = findBranch(id);
        state.branchId = branch ? id : null;
        renderBranchOptions();
        renderSelectedBranch();

        if (persist !== false && branch) {
            storageSet(STORAGE_KEYS.branch, branch.id);
            storageSet(STORAGE_KEYS.branchName, JSON.stringify(branch.name));
        }
    }

    function openSelect() {
        dom.select.classList.remove('is-open-above');

        // Реальная высота списка (скрытый элемент всё равно измеряется).
        // По умолчанию открываем вниз — список ложится поверх кнопки.
        // Вверх уходим только если внизу действительно не хватает экрана.
        var triggerRect = dom.trigger.getBoundingClientRect();
        var listHeight = Math.min(dom.list.scrollHeight, 280) + 8;
        var spaceBelow = window.innerHeight - triggerRect.bottom;
        var spaceAbove = triggerRect.top;

        if (spaceBelow < listHeight && spaceAbove > spaceBelow) {
            dom.select.classList.add('is-open-above');
        }

        dom.select.classList.add('is-open');
        dom.trigger.setAttribute('aria-expanded', 'true');
    }

    function closeSelect() {
        dom.select.classList.remove('is-open');
        dom.select.classList.remove('is-open-above');
        dom.trigger.setAttribute('aria-expanded', 'false');
    }

    function toggleSelect() {
        if (dom.select.classList.contains('is-open')) closeSelect();
        else openSelect();
    }

    // Навигация по списку с клавиатуры (стрелки, Enter, Escape).
    function handleSelectKeydown(event) {
        var options = Array.prototype.slice.call(dom.list.children);
        if (!options.length) return;

        var activeIndex = options.findIndex(function (el) {
            return el.classList.contains('is-active');
        });

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
                event.preventDefault();
                if (!dom.select.classList.contains('is-open')) {
                    openSelect();
                    activeIndex = -1;
                }
                var step = event.key === 'ArrowDown' ? 1 : -1;
                var next = (activeIndex + step + options.length) % options.length;
                options.forEach(function (el) { el.classList.remove('is-active'); });
                options[next].classList.add('is-active');
                options[next].scrollIntoView({ block: 'nearest' });
                break;

            case 'Enter':
            case ' ':
                if (dom.select.classList.contains('is-open') && activeIndex > -1) {
                    event.preventDefault();
                    selectBranch(options[activeIndex].getAttribute('data-id'));
                    closeSelect();
                }
                break;

            case 'Escape':
                closeSelect();
                break;
        }
    }

    /* --------------------------------------------------------
       7. Кнопка «Продолжить»
       -------------------------------------------------------- */

    // Здесь позже подключается настоящая навигация — достаточно
    // заменить console.log на window.location.href = ...
    function handleContinue() {
        var branch = findBranch(state.branchId);

        if (!branch) {
            // Филиал не выбран — подсвечиваем поле и открываем список
            dom.select.classList.add('is-invalid');
            window.setTimeout(function () {
                dom.select.classList.remove('is-invalid');
            }, 420);
            openSelect();
            dom.trigger.focus();
            return;
        }

        console.log('[ISAstaurant] Continue', {
            branchId: branch.id,
            branch: branch.name[state.lang],
            lang: state.lang,
            theme: state.theme
        });

        window.location.href = 'menu.html?branch=' + encodeURIComponent(branch.id);
    }

    /* --------------------------------------------------------
       8. Инициализация
       -------------------------------------------------------- */

    function bindEvents() {
        dom.langToggle.addEventListener('click', toggleLanguage);
        dom.themeToggle.addEventListener('click', toggleTheme);

        dom.trigger.addEventListener('click', toggleSelect);
        dom.trigger.addEventListener('keydown', handleSelectKeydown);

        dom.continueBtn.addEventListener('click', handleContinue);

        // Клик вне select-а закрывает список
        document.addEventListener('click', function (event) {
            if (!dom.select.contains(event.target)) closeSelect();
        });
    }

    function init() {
        // Тема: сохранённая → системная → dark
        var savedTheme = storageGet(STORAGE_KEYS.theme);
        if (!savedTheme && window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: light)').matches) {
            savedTheme = 'light';
        }
        setTheme(savedTheme || 'dark', false);

        // Язык: сохранённый → язык браузера → ru
        var savedLang = storageGet(STORAGE_KEYS.lang);
        if (!savedLang) {
            savedLang = (navigator.language || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
        }
        setLanguage(savedLang, false);

        // Филиал: восстанавливаем последний выбор
        selectBranch(storageGet(STORAGE_KEYS.branch), false);

        bindEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
