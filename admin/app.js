/* ============================================================
   ISAstaurant — админка

   Вход · Меню · Филиалы · Контакты

   Данные берутся только из API. Ничего про блюда и телефоны здесь
   не зашито: меняется база — меняется и панель.

   Заказами эта панель не занимается: она редактирует меню, а приём
   и ведение заказов — дело сайта доставки.
   ============================================================ */
(function () {
    'use strict';

    var el = UI.el;
    var money = UI.money;
    var toast = UI.toast;

    /* --------------------------------------------------------
       Состояние
       -------------------------------------------------------- */

    var state = {
        user: null,
        view: 'menu',

        // Справочники, нужные нескольким экранам сразу
        categories: [],
        branches: [],

        // Фильтр списка блюд
        dishCategory: ''
    };

    var dom = {
        loginScreen: document.getElementById('loginScreen'),
        loginForm: document.getElementById('loginForm'),
        loginUser: document.getElementById('loginUser'),
        loginPassword: document.getElementById('loginPassword'),
        loginError: document.getElementById('loginError'),
        loginSubmit: document.getElementById('loginSubmit'),

        app: document.getElementById('app'),
        tabs: document.getElementById('tabs'),
        view: document.getElementById('view'),
        currentUser: document.getElementById('currentUser'),
        logoutBtn: document.getElementById('logoutBtn')
    };

    /* --------------------------------------------------------
       Вход
       -------------------------------------------------------- */

    function showLogin() {
        state.user = null;
        dom.app.hidden = true;
        dom.loginScreen.hidden = false;
        dom.loginPassword.value = '';
    }

    function showApp(user) {
        state.user = user;
        dom.loginScreen.hidden = true;
        dom.app.hidden = false;
        dom.currentUser.textContent = user.username;

        render();
    }

    function handleLogin(event) {
        event.preventDefault();

        dom.loginError.hidden = true;
        dom.loginSubmit.disabled = true;

        API.login(dom.loginUser.value.trim(), dom.loginPassword.value)
            .then(function (result) { showApp(result.user); })
            .catch(function (error) {
                dom.loginError.textContent = error.message;
                dom.loginError.hidden = false;
                dom.loginPassword.value = '';
                dom.loginPassword.focus();
            })
            .then(function () { dom.loginSubmit.disabled = false; });
    }

    function handleLogout() {
        API.logout()
            .catch(function () { /* сессия уже могла кончиться — всё равно выходим */ })
            .then(showLogin);
    }

    /* --------------------------------------------------------
       Навигация
       -------------------------------------------------------- */

    var VIEWS = {
        menu: renderMenu,
        branches: renderBranches,
        settings: renderSettings
    };

    function setView(name) {
        state.view = VIEWS[name] ? name : 'menu';

        Array.prototype.forEach.call(dom.tabs.children, function (tab) {
            tab.classList.toggle('is-active', tab.getAttribute('data-view') === state.view);
        });

        render();
    }

    function render() {
        UI.clear(dom.view).appendChild(el('div', { class: 'loading', text: 'Загрузка…' }));
        VIEWS[state.view]();
    }

    // Показывает готовый экран целиком — чтобы не мигал наполовину собранный
    function paint(nodes) {
        UI.clear(dom.view);
        [].concat(nodes).forEach(function (node) { if (node) dom.view.appendChild(node); });
    }

    function fail(error) {
        // 401 уже обработан в api.js — там показался экран входа
        if (error.status === 401) return;

        paint(el('div', { class: 'empty', text: 'Не удалось загрузить: ' + error.message }));
        toast(error.message, 'error');
    }

    function section(title, count, actions, content) {
        return el('section', { class: 'section' }, [
            el('div', { class: 'section__head' }, [
                el('h2', { class: 'section__title', text: title }),
                count === null ? null : el('span', { class: 'section__count', text: count }),
                el('div', { class: 'section__actions' }, actions)
            ]),
            content
        ]);
    }

    var yesNo = function (value, labelOn, labelOff) {
        return el('span', {
            class: 'badge ' + (value ? 'badge--ok' : ''),
            text: value ? labelOn : labelOff
        });
    };

    /*
       Маленькое превью в списке. Показывает ровно то, что увидит
       гость: тот же квадрат, что и на сайте. Без фото — значок,
       которым сайт и подменяет отсутствующий снимок.
    */
    function thumb(item) {
        if (!item.image_url) {
            return el('span', { class: 'thumb thumb--empty', text: item.emoji || '—' });
        }

        return el('img', {
            class: 'thumb',
            src: UI.photoUrl(item.image_url),
            alt: '',
            loading: 'lazy',
            onerror: function (event) {
                event.target.replaceWith(el('span', { class: 'thumb thumb--broken', text: '!' }));
            }
        });
    }

    /* ========================================================
       Экран «Меню»
       ======================================================== */

    function renderMenu() {
        Promise.all([API.categories(), API.dishes({ category_id: state.dishCategory })])
            .then(function (results) {
                state.categories = results[0].items;
                paint([categoriesSection(), dishesSection(results[1].items)]);
            })
            .catch(fail);
    }

    /* ---- Категории ---- */

    function categoriesSection() {
        var rows = UI.table({
            columns: [
                { title: '', className: 'thumb-cell', render: thumb },
                {
                    title: 'Категория',
                    render: function (category) {
                        return el('span', {}, [
                            el('span', { class: 'cell-title',
                                text: (category.emoji ? category.emoji + '  ' : '') + category.name_ru }),
                            el('span', { class: 'cell-sub', text: category.name_en })
                        ]);
                    }
                },
                {
                    title: 'Блюд', className: 'num',
                    render: function (category) { return String(category.dish_count || 0); }
                },
                {
                    title: 'Порядок', className: 'num col-optional',
                    render: function (category) { return String(category.sort_order); }
                },
                {
                    title: 'На сайте',
                    render: function (category) {
                        return yesNo(category.is_active, 'видна', 'скрыта');
                    }
                },
                {
                    title: '', className: 'actions',
                    render: function (category) {
                        return el('span', {}, [
                            el('button', {
                                class: 'btn btn--small', type: 'button', text: 'Изменить',
                                onclick: function () { editCategory(category); }
                            }),
                            el('button', {
                                class: 'btn btn--small btn--danger', type: 'button', text: 'Удалить',
                                onclick: function () { removeCategory(category); }
                            })
                        ]);
                    }
                }
            ],
            rows: state.categories,
            rowClass: function (category) { return category.is_active ? null : 'row-muted'; },
            empty: 'Категорий пока нет'
        });

        var add = el('button', {
            class: 'btn', type: 'button', text: '+ Категория',
            onclick: function () { editCategory(null); }
        });

        return section('Категории', state.categories.length, [add], rows);
    }

    function categoryFields() {
        return [
            { type: 'row', fields: [
                { name: 'name_ru', label: 'Название (RU)', type: 'text' },
                { name: 'name_en', label: 'Название (EN)', type: 'text' }
            ] },
            { type: 'row', fields: [
                { name: 'description_ru', label: 'Описание (RU)', type: 'text' },
                { name: 'description_en', label: 'Описание (EN)', type: 'text' }
            ] },
            { type: 'row', fields: [
                { name: 'emoji', label: 'Значок', type: 'text', placeholder: '🍜' },
                { name: 'sort_order', label: 'Порядок', type: 'number', min: 0 }
            ] },
            { name: 'image_url', label: 'Фотография', type: 'image' },
            { name: 'slug', label: 'Ключ', type: 'text',
              hint: 'Латиницей. Оставьте пустым — соберётся из названия.' },
            { name: 'is_active', label: 'Показывать на сайте', type: 'checkbox' }
        ];
    }

    function editCategory(category) {
        var isNew = !category;

        UI.openForm({
            title: isNew ? 'Новая категория' : 'Категория: ' + category.name_ru,
            fields: categoryFields(),
            values: category || { is_active: true, sort_order: nextSortOrder(state.categories) },

            onSubmit: function (values) {
                var request = isNew
                    ? API.post('/admin/categories', values)
                    : API.patch('/admin/categories/' + category.id, values);

                return request.then(function () {
                    toast(isNew ? 'Категория создана' : 'Сохранено');
                    renderMenu();
                });
            }
        });
    }

    function removeCategory(category) {
        if (!UI.confirmAction('Удалить категорию «' + category.name_ru + '»?')) return;

        API.remove('/admin/categories/' + category.id)
            .then(function () { toast('Категория удалена'); renderMenu(); })
            .catch(function (error) { toast(error.message, 'error'); });
    }

    /* ---- Блюда ---- */

    function dishesSection(dishes) {
        var filter = el('select', {
            class: 'select',
            onchange: function (event) {
                state.dishCategory = event.target.value;
                renderMenu();
            }
        }, [el('option', { value: '', text: 'Все категории' })].concat(
            state.categories.map(function (category) {
                return el('option', {
                    value: String(category.id),
                    text: category.name_ru,
                    selected: String(category.id) === String(state.dishCategory)
                });
            })
        ));

        var add = el('button', {
            class: 'btn btn--primary', type: 'button', text: '+ Блюдо',
            onclick: function () { editDish(null); }
        });

        var table = UI.table({
            columns: [
                { title: '', className: 'thumb-cell', render: thumb },
                {
                    title: 'Блюдо',
                    render: function (dish) {
                        return el('span', {}, [
                            el('span', { class: 'cell-title',
                                text: (dish.emoji ? dish.emoji + '  ' : '') + dish.name_ru }),
                            el('span', { class: 'cell-sub',
                                text: dish.category ? dish.category.name_ru : 'без категории' })
                        ]);
                    }
                },
                {
                    title: 'Цена', className: 'num',
                    render: function (dish) { return money(dish.price); }
                },
                {
                    title: 'Вес', className: 'num col-optional',
                    render: function (dish) {
                        return dish.weight_value ? dish.weight_value + ' ' + unitLabel(dish.weight_unit) : '—';
                    }
                },
                {
                    title: 'Порядок', className: 'num col-optional',
                    render: function (dish) { return String(dish.sort_order); }
                },
                {
                    title: 'В продаже',
                    render: function (dish) { return yesNo(dish.is_available, 'да', 'нет'); }
                },
                {
                    title: '', className: 'actions',
                    render: function (dish) {
                        return el('span', {}, [
                            el('button', {
                                class: 'btn btn--small', type: 'button', text: 'Изменить',
                                onclick: function () { editDish(dish); }
                            }),
                            el('button', {
                                class: 'btn btn--small btn--danger', type: 'button', text: 'Удалить',
                                onclick: function () { removeDish(dish); }
                            })
                        ]);
                    }
                }
            ],
            rows: dishes,
            rowClass: function (dish) { return dish.is_available ? null : 'row-muted'; },
            empty: 'В этой категории пока нет блюд'
        });

        return section('Блюда', dishes.length, [filter, add], table);
    }

    var UNITS = [
        { value: '', label: '—' },
        { value: 'g', label: 'г' },
        { value: 'kg', label: 'кг' },
        { value: 'ml', label: 'мл' },
        { value: 'l', label: 'л' },
        { value: 'pcs', label: 'шт' }
    ];

    function unitLabel(code) {
        for (var i = 0; i < UNITS.length; i++) {
            if (UNITS[i].value === code) return UNITS[i].label;
        }
        return code || '';
    }

    function dishFields() {
        return [
            { name: 'category_id', label: 'Категория', type: 'select',
              options: state.categories.map(function (category) {
                  return { value: category.id, label: category.name_ru };
              }) },

            { type: 'row', fields: [
                { name: 'name_ru', label: 'Название (RU)', type: 'text' },
                { name: 'name_en', label: 'Название (EN)', type: 'text' }
            ] },

            { name: 'description_ru', label: 'Описание (RU)', type: 'textarea' },
            { name: 'description_en', label: 'Описание (EN)', type: 'textarea' },
            { name: 'ingredients_ru', label: 'Состав (RU)', type: 'textarea' },
            { name: 'ingredients_en', label: 'Состав (EN)', type: 'textarea' },

            { type: 'group', label: 'Цена и подача' },

            { type: 'row', fields: [
                { name: 'price', label: 'Цена, ₸', type: 'number', min: 0 },
                { name: 'emoji', label: 'Значок', type: 'text', placeholder: '🍜' }
            ] },

            { type: 'row', fields: [
                { name: 'weight_value', label: 'Вес или объём', type: 'number', min: 0, step: '0.1' },
                { name: 'weight_unit', label: 'Единица', type: 'select', options: UNITS }
            ] },

            { name: 'image_url', label: 'Фотография', type: 'image' },

            { type: 'group', label: 'Служебное' },

            { type: 'row', fields: [
                { name: 'sort_order', label: 'Порядок', type: 'number', min: 0 },
                { name: 'slug', label: 'Ключ', type: 'text', placeholder: 'auto' }
            ] },

            { name: 'is_available', label: 'В продаже', type: 'checkbox' }
        ];
    }

    function editDish(dish) {
        if (!state.categories.length) {
            toast('Сначала создайте хотя бы одну категорию', 'error');
            return;
        }

        var isNew = !dish;

        var values = dish || {
            is_available: true,
            sort_order: 0,
            weight_unit: 'g',
            category_id: state.dishCategory || state.categories[0].id
        };

        UI.openForm({
            title: isNew ? 'Новое блюдо' : values.name_ru,
            fields: dishFields(),
            values: values,

            onSubmit: function (form) {
                // select отдаёт строку — база ждёт число
                form.category_id = Number(form.category_id);

                var request = isNew
                    ? API.post('/admin/dishes', form)
                    : API.patch('/admin/dishes/' + dish.id, form);

                return request.then(function () {
                    toast(isNew ? 'Блюдо создано' : 'Сохранено');
                    renderMenu();
                });
            }
        });
    }

    function removeDish(dish) {
        if (!UI.confirmAction('Удалить блюдо «' + dish.name_ru + '»?\n\n'
            + 'Оно исчезнет из меню, но останется в старых заказах.')) return;

        API.remove('/admin/dishes/' + dish.id)
            .then(function () { toast('Блюдо удалено'); renderMenu(); })
            .catch(function (error) { toast(error.message, 'error'); });
    }

    // Новый элемент ставим в конец списка
    function nextSortOrder(items) {
        return items.reduce(function (max, item) {
            return Math.max(max, item.sort_order || 0);
        }, 0) + 10;
    }

    /* ========================================================
       Экран «Филиалы»
       ======================================================== */

    function renderBranches() {
        API.branches()
            .then(function (result) {
                state.branches = result.items;

                var table = UI.table({
                    columns: [
                        {
                            title: 'Филиал',
                            render: function (branch) {
                                return el('span', {}, [
                                    el('span', { class: 'cell-title', text: branch.name_ru }),
                                    el('span', { class: 'cell-sub', text: branch.address_ru })
                                ]);
                            }
                        },
                        {
                            title: 'Телефон',
                            render: function (branch) { return branch.phone || '—'; }
                        },
                        {
                            title: 'График', className: 'col-optional',
                            render: function (branch) { return scheduleSummary(branch.working_hours); }
                        },
                        {
                            title: 'Работает',
                            render: function (branch) { return yesNo(branch.is_active, 'да', 'нет'); }
                        },
                        {
                            title: '', className: 'actions',
                            render: function (branch) {
                                return el('span', {}, [
                                    el('button', {
                                        class: 'btn btn--small', type: 'button', text: 'Изменить',
                                        onclick: function () { editBranch(branch); }
                                    }),
                                    el('button', {
                                        class: 'btn btn--small btn--danger', type: 'button', text: 'Удалить',
                                        onclick: function () { removeBranch(branch); }
                                    })
                                ]);
                            }
                        }
                    ],
                    rows: state.branches,
                    rowClass: function (branch) { return branch.is_active ? null : 'row-muted'; },
                    empty: 'Филиалов пока нет'
                });

                var add = el('button', {
                    class: 'btn btn--primary', type: 'button', text: '+ Филиал',
                    onclick: function () { editBranch(null); }
                });

                paint(section('Филиалы', state.branches.length, [add], table));
            })
            .catch(fail);
    }

    // «Пн–Пт 10:00–23:00» либо «по дням», если график разный
    function scheduleSummary(hours) {
        var working = (hours || []).filter(function (day) { return !day.is_day_off; });
        if (!working.length) return '—';

        var first = working[0];
        var same = working.every(function (day) {
            return day.opens_at === first.opens_at && day.closes_at === first.closes_at;
        });

        if (!same) return 'по дням';

        var offDays = (hours || []).length - working.length;

        return first.opens_at + '–' + first.closes_at + (offDays ? ', вых ' + offDays : '');
    }

    function branchFields() {
        return [
            { type: 'row', fields: [
                { name: 'name_ru', label: 'Название (RU)', type: 'text' },
                { name: 'name_en', label: 'Название (EN)', type: 'text' }
            ] },
            { type: 'row', fields: [
                { name: 'address_ru', label: 'Адрес (RU)', type: 'text' },
                { name: 'address_en', label: 'Адрес (EN)', type: 'text' }
            ] },
            { name: 'phone', label: 'Телефон', type: 'text', placeholder: '+7 707 420 0599' },

            { type: 'row', fields: [
                { name: 'latitude', label: 'Широта', type: 'number', step: 'any' },
                { name: 'longitude', label: 'Долгота', type: 'number', step: 'any' }
            ] },

            { type: 'group', label: 'Часы работы' },
            { name: 'working_hours', label: '', type: 'hours' },

            { type: 'group', label: 'Служебное' },
            { type: 'row', fields: [
                { name: 'sort_order', label: 'Порядок', type: 'number', min: 0 },
                { name: 'slug', label: 'Ключ', type: 'text', placeholder: 'auto' }
            ] },
            { name: 'is_active', label: 'Филиал работает', type: 'checkbox' }
        ];
    }

    function editBranch(branch) {
        var isNew = !branch;

        UI.openForm({
            title: isNew ? 'Новый филиал' : branch.name_ru,
            fields: branchFields(),
            values: branch || { is_active: true, sort_order: nextSortOrder(state.branches) },

            onSubmit: function (values) {
                var request = isNew
                    ? API.post('/admin/branches', values)
                    : API.patch('/admin/branches/' + branch.id, values);

                return request.then(function () {
                    toast(isNew ? 'Филиал создан' : 'Сохранено');
                    renderBranches();
                });
            }
        });
    }

    function removeBranch(branch) {
        if (!UI.confirmAction('Удалить филиал «' + branch.name_ru + '»?')) return;

        API.remove('/admin/branches/' + branch.id)
            .then(function () { toast('Филиал удалён'); renderBranches(); })
            .catch(function (error) { toast(error.message, 'error'); });
    }

    /* ========================================================
       Экран «Контакты» — настройки и способы оплаты
       ======================================================== */

    // Человеческие подписи; описание из базы используется как запасное
    var SETTING_LABELS = {
        support_phone:      'Телефон поддержки',
        whatsapp_phone:     'WhatsApp',
        instagram_url:      'Instagram',
        delivery_fee:       'Стоимость доставки, ₸',
        delivery_free_from: 'Бесплатная доставка от, ₸'
    };

    function renderSettings() {
        Promise.all([API.settings(), API.get('/admin/payment-methods')])
            .then(function (results) {
                paint([
                    settingsSection(results[0].items),
                    paymentsSection(results[1].items)
                ]);
            })
            .catch(fail);
    }

    function settingsSection(settings) {
        var rows = settings.map(function (setting) { return settingRow(setting); });

        return section('Контакты и доставка', null, [], el('div', { class: 'table-wrap' }, [
            el('table', { class: 'table' }, [
                el('thead', {}, [
                    el('tr', {}, [
                        el('th', { text: 'Настройка' }),
                        el('th', { text: 'Значение' }),
                        el('th', { text: 'Показывать' }),
                        el('th', { class: 'actions', text: '' })
                    ])
                ]),
                el('tbody', {}, rows)
            ])
        ]));
    }

    /*
       Каждая настройка редактируется прямо в строке: поле, галочка
       и кнопка «Сохранить». Отдельный диалог ради одного значения
       был бы лишним шагом.
    */
    function settingRow(setting) {
        var input = el('input', {
            class: 'input',
            type: setting.value_type === 'integer' ? 'number' : 'text',
            value: setting.value == null ? '' : setting.value,
            min: setting.value_type === 'integer' ? 0 : null
        });

        var active = el('input', { type: 'checkbox', checked: setting.is_active });

        var save = el('button', {
            class: 'btn btn--small', type: 'button', text: 'Сохранить',
            onclick: function () {
                save.disabled = true;

                API.patch('/admin/settings/' + setting.code, {
                    value: input.value,
                    is_active: active.checked
                })
                    .then(function (updated) {
                        // Сервер мог привести значение к своему виду —
                        // например, телефон к +7XXXXXXXXXX
                        input.value = updated.value == null ? '' : updated.value;
                        input.classList.remove('is-invalid');
                        toast('Сохранено');
                    })
                    .catch(function (error) {
                        input.classList.add('is-invalid');
                        toast(error.message, 'error');
                    })
                    .then(function () { save.disabled = false; });
            }
        });

        // Enter в поле сохраняет — привычнее, чем тянуться к кнопке
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') save.click();
        });

        return el('tr', {}, [
            el('td', {}, [
                el('span', { class: 'cell-title',
                    text: SETTING_LABELS[setting.code] || setting.description || setting.code }),
                el('span', { class: 'cell-sub', text: setting.code })
            ]),
            el('td', {}, [input]),
            el('td', {}, [el('label', { class: 'check' }, [active])]),
            el('td', { class: 'actions' }, [save])
        ]);
    }

    function paymentsSection(methods) {
        var table = UI.table({
            columns: [
                {
                    title: 'Способ оплаты',
                    render: function (method) {
                        return el('span', {}, [
                            el('span', { class: 'cell-title', text: method.name_ru }),
                            el('span', { class: 'cell-sub', text: method.code })
                        ]);
                    }
                },
                {
                    title: 'Состояние',
                    render: function (method) {
                        return yesNo(method.is_active, 'доступен', 'выключен');
                    }
                },
                {
                    title: '', className: 'actions',
                    render: function (method) {
                        return el('button', {
                            class: 'btn btn--small', type: 'button',
                            text: method.is_active ? 'Выключить' : 'Включить',
                            onclick: function () { togglePayment(method); }
                        });
                    }
                }
            ],
            rows: methods,
            rowClass: function (method) { return method.is_active ? null : 'row-muted'; },
            empty: 'Способов оплаты нет'
        });

        return section('Способы оплаты', null, [], el('div', {}, [
            table,
            el('p', { class: 'field__hint',
                text: 'Выключенный способ исчезает с сайта. Уже оформленные заказы не меняются.' })
        ]));
    }

    function togglePayment(method) {
        API.patch('/admin/payment-methods/' + method.code, { is_active: !method.is_active })
            .then(function () {
                toast(method.is_active ? 'Выключено' : 'Включено');
                renderSettings();
            })
            .catch(function (error) { toast(error.message, 'error'); });
    }

    /* ========================================================
       Запуск
       ======================================================== */

    function init() {
        API.setUnauthorizedHandler(showLogin);

        dom.loginForm.addEventListener('submit', handleLogin);
        dom.logoutBtn.addEventListener('click', handleLogout);

        dom.tabs.addEventListener('click', function (event) {
            var tab = event.target.closest('.tab');
            if (tab) setView(tab.getAttribute('data-view'));
        });

        Array.prototype.forEach.call(dom.tabs.children, function (tab) {
            tab.classList.toggle('is-active', tab.getAttribute('data-view') === state.view);
        });

        // Сессия могла остаться с прошлого раза — проверяем, прежде
        // чем зря показывать форму входа
        API.me()
            .then(function (result) { showApp(result.user); })
            .catch(showLogin);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
