/* ============================================================
   ISAstaurant — страница меню
   Категории · Блюда · Корзина · Язык · Тема
   ============================================================ */
(function () {
    'use strict';

    /* --------------------------------------------------------
       1. Данные
       -------------------------------------------------------- */

    // Категории. Порядок здесь = порядок чипов и секций.
    // 'all' — служебная, показывает всё сразу.
    var CATEGORIES = [
        { id: 'all',    emoji: '🍽',  name: { ru: 'Все',      en: 'All'     } },
        { id: 'lagman', emoji: '🍜', name: { ru: 'Лагман',   en: 'Lagman'  } },
        { id: 'soup',   emoji: '🍲', name: { ru: 'Супы',     en: 'Soups'   } },
        { id: 'kebab',  emoji: '🍢', name: { ru: 'Шашлыки',  en: 'Kebabs'  } },
        { id: 'salad',  emoji: '🥗', name: { ru: 'Салаты',   en: 'Salads'  } },
        { id: 'roll',   emoji: '🍣', name: { ru: 'Роллы',    en: 'Rolls'   } }
    ];

    // Блюда. Чтобы добавить позицию — один объект в массив.
    var DISHES = [
        { id: 'dima-lagman',  category: 'lagman', price: 2890, weight: '450г', emoji: '🍜',
          image: 'images/lagman.jpg',
          name: { ru: 'Дима лагман',  en: 'Dima lagman'  },
          description: {
            ru: 'Традиционный лагман с домашней лапшой, нежным мясом и овощами.',
            en: 'Traditional lagman with homemade noodles, tender meat and vegetables.'
          },
          ingredients: {
            ru: 'Лапша пшеничная, говядина, лук, сладкий перец, морковь, помидоры, чеснок, специи',
            en: 'Wheat noodles, beef, onion, bell pepper, carrot, tomato, garlic, spices'
          }
        },

        { id: 'isa-soup',     category: 'soup',   price: 2190, weight: '380г', emoji: '🍲',
          image: 'images/soups.jpg',
          name: { ru: 'Иса суп',      en: 'Isa soup'     },
          description: {
            ru: 'Пикантный суп с говядиной, картофелем и пряными травами.',
            en: 'Spicy soup with beef, potatoes and aromatic herbs.'
          },
          ingredients: {
            ru: 'Бульон, говядина, картофель, помидоры, лук, тмин, кориандр, петрушка',
            en: 'Broth, beef, potato, tomato, onion, cumin, coriander, parsley'
          }
        },

        { id: 'yers-kebab',   category: 'kebab',  price: 3490, weight: '320г', emoji: '🍢',
          image: 'images/kebabs.jpg',
          name: { ru: 'Ерс шашлык',   en: 'Yers kebab'   },
          description: {
            ru: 'Сочный шашлык из маринованной говядины с дымком от углей.',
            en: 'Juicy kebab from marinated beef with charcoal smoke.'
          },
          ingredients: {
            ru: 'Говядина, лук, помидоры, специи, зелень',
            en: 'Beef, onion, tomato, spices, fresh herbs'
          }
        },

        { id: 'nurda-roll',   category: 'roll',   price: 3990, weight: '280г', emoji: '🍣',
          image: 'images/rolls.jpg',
          name: { ru: 'Нурда ролл',   en: 'Nurda roll'   },
          description: {
            ru: 'Изысканный ролл с лососем, авокадо и соусом унаги.',
            en: 'Exquisite roll with salmon, avocado and unagi sauce.'
          },
          ingredients: {
            ru: 'Рис, нори, лосось, авокадо, огурец, соус унаги, кунжут',
            en: 'Rice, nori, salmon, avocado, cucumber, unagi sauce, sesame'
          }
        },

        { id: 'mukha-salad',  category: 'salad',  price: 2390, weight: '250г', emoji: '🥗',
          image: 'images/salads.jpg',
          name: { ru: 'Муха салат',   en: 'Mukha salad'  },
          description: {
            ru: 'Свежий овощной салат с хрустящими ингредиентами и лёгкой заправкой.',
            en: 'Fresh vegetable salad with crispy ingredients and light dressing.'
          },
          ingredients: {
            ru: 'Микс листьев, помидоры, огурец, морковь, редис, оливковое масло, лимон',
            en: 'Mixed greens, tomato, cucumber, carrot, radish, olive oil, lemon'
          }
        }
    ];

    // Доставка: фиксированная цена, бесплатно от порога
    var DELIVERY = { price: 990, freeFrom: 12000 };

    /*
       Адреса проверяет наш бэкенд (backend/server.js): он ходит в 2GIS
       со своим ключом и пускает только адреса внутри города Алматы.
       Ключа здесь нет намеренно — иначе проверку обошли бы из DevTools.

       Пустая строка = бэкенд отдаёт и статику, и /api с того же адреса.
       Если фронтенд открыт отдельно, впишите сюда 'http://localhost:3000'.
    */
    var API_BASE = '';
    var SUGGEST_MIN = 3;        // с какой длины запрашивать подсказки
    var SUGGEST_DELAY = 300;    // пауза после набора, мс

    var PAYMENTS = ['kaspi', 'card', 'cash'];
    var MODES = ['delivery', 'pickup'];

    // Справочники из branches.js — общие со стартовой страницей
    var BRANCHES = window.ISA_BRANCHES || [];
    var CONTACTS = window.ISA_CONTACTS || {};

    var TRANSLATIONS = {
        ru: {
            categoriesTitle:  'Категории',
            emptyState:       'В этой категории пока нет блюд',
            addedToCart:      'Добавлено в корзину',
            cartEmpty:        'Корзина пуста',
            cartEmptyHint:    'Добавьте блюда из меню',
            cartSummary:      'В корзине {count} · {sum}',
            addLabel:         'Добавить: {dish}',
            addToCart:        'Добавить в корзину',
            cartLabel:        'Корзина',
            cartTitle:        'Корзина',
            cartCount:        '{count} · {sum}',
            cartSubtotal:     'Сумма заказа',
            cartDelivery:     'Доставка',
            cartTotal:        'Итого',
            cartFree:         'Бесплатно',
            cartPayment:      'Способ оплаты',
            cartPhone:        'Номер телефона',
            phoneNote:        'Скоро свяжемся с вами для подтверждения заказа',
            phoneError:       'Введите все 10 цифр номера',
            cartAddress:      'Адрес доставки',
            addressPlaceholder: 'Улица и дом',
            addressNote:      'Доставляем только по городу Алматы',
            addressOptions:   'Варианты адреса',
            addressRequired:  'Укажите адрес доставки',
            addressOutside:   'Этот адрес вне Алматы — доставка недоступна',
            addressNotFound:  'Адрес не найден. Уточните улицу и номер дома',
            addressFailed:    'Не удалось проверить адрес. Попробуйте ещё раз',
            addressOffline:   'Сервер подсказок недоступен — не запущен backend',
            housingTitle:     'Тип дома',
            housingPrivate:   'Частный дом',
            housingFlat:      'Жилой дом',
            flatLabel:        'Квартира',
            entranceLabel:    'Подъезд',
            entranceNote:     'Подъезд можно не указывать',
            flatRequired:     'Укажите номер квартиры',
            flatShort:        'кв. {flat}',
            entranceShort:    'подъезд {entrance}',
            payCard:          'Картой',
            payCash:          'Наличные',
            cartMode:         'Способ получения',
            modeDelivery:     'Доставка',
            modePickup:       'Самовывоз',
            pickupFrom:       'Забрать из филиала',
            checkout:         'Оформить заказ',
            freeDeliveryHint: 'До бесплатной доставки — {sum}',
            orderPlaced:      'Заказ оформлен · оплата: {method}',
            orderAccepted:    'Заказ принят',
            orderContact:     'Скоро свяжемся с вами по номеру',
            orderPayTotal:    'Оплата: {method} · {sum}',
            backToMenu:       'Вернуться в меню',
            closeLabel:       'Закрыть',
            increaseLabel:    'Добавить ещё: {dish}',
            decreaseLabel:    'Убрать одну порцию: {dish}',
            removeLabel:      'Удалить из корзины: {dish}',
            dishDescription:  'Описание',
            dishIngredients:  'Состав',
            branchSwitchLabel: 'Сменить филиал',
            branchOptions:    'Филиалы',
            branchChanged:    'Филиал изменён: {branch}',
            supportTitle:     'Служба поддержки',
            supportHint:      'Ответим на вопросы по заказу и доставке',
            supportPhoneLabel: 'Телефон',
            whatsappLabel:    'Написать в WhatsApp',
            instagramLabel:   'Мы в Instagram',
            langToggleLabel:  'Сменить язык',
            themeToggleLabel: 'Сменить тему'
        },
        en: {
            categoriesTitle:  'Categories',
            emptyState:       'No dishes in this category yet',
            addedToCart:      'Added to cart',
            cartEmpty:        'Your cart is empty',
            cartEmptyHint:    'Add dishes from the menu',
            cartSummary:      '{count} in cart · {sum}',
            addLabel:         'Add: {dish}',
            addToCart:        'Add to cart',
            cartLabel:        'Cart',
            cartTitle:        'Cart',
            cartCount:        '{count} · {sum}',
            cartSubtotal:     'Subtotal',
            cartDelivery:     'Delivery',
            cartTotal:        'Total',
            cartFree:         'Free',
            cartPayment:      'Payment method',
            cartPhone:        'Phone number',
            phoneNote:        'We will contact you shortly to confirm the order',
            phoneError:       'Enter all 10 digits',
            cartAddress:      'Delivery address',
            addressPlaceholder: 'Street and building',
            addressNote:      'We deliver within Almaty city only',
            addressOptions:   'Address options',
            addressRequired:  'Enter the delivery address',
            addressOutside:   'This address is outside Almaty — delivery unavailable',
            addressNotFound:  'Address not found. Check the street and building number',
            addressFailed:    'Could not verify the address. Please try again',
            addressOffline:   'Suggestion service is down — backend is not running',
            housingTitle:     'Building type',
            housingPrivate:   'Private house',
            housingFlat:      'Apartment building',
            flatLabel:        'Apartment',
            entranceLabel:    'Entrance',
            entranceNote:     'Entrance is optional',
            flatRequired:     'Enter the apartment number',
            flatShort:        'apt. {flat}',
            entranceShort:    'entrance {entrance}',
            payCard:          'Card',
            payCash:          'Cash',
            cartMode:         'How to get it',
            modeDelivery:     'Delivery',
            modePickup:       'Pickup',
            pickupFrom:       'Pick up from the branch',
            checkout:         'Place order',
            freeDeliveryHint: '{sum} more for free delivery',
            orderPlaced:      'Order placed · payment: {method}',
            orderAccepted:    'Order accepted',
            orderContact:     'We will call you shortly at',
            orderPayTotal:    'Payment: {method} · {sum}',
            backToMenu:       'Back to menu',
            closeLabel:       'Close',
            increaseLabel:    'Add one more: {dish}',
            decreaseLabel:    'Remove one: {dish}',
            removeLabel:      'Remove from cart: {dish}',
            dishDescription:  'Description',
            dishIngredients:  'Ingredients',
            branchSwitchLabel: 'Change branch',
            branchOptions:    'Branches',
            branchChanged:    'Branch changed: {branch}',
            supportTitle:     'Customer support',
            supportHint:      'We answer questions about orders and delivery',
            supportPhoneLabel: 'Phone',
            whatsappLabel:    'Message us on WhatsApp',
            instagramLabel:   'Follow us on Instagram',
            langToggleLabel:  'Switch language',
            themeToggleLabel: 'Switch theme'
        }
    };

    // Названия способов оплаты для тоста
    var PAYMENT_NAMES = {
        kaspi: { ru: 'Kaspi',     en: 'Kaspi' },
        card:  { ru: 'Картой',    en: 'Card'  },
        cash:  { ru: 'Наличные',  en: 'Cash'  }
    };

    var LANGUAGES = ['ru', 'en'];
    var THEMES = ['dark', 'light'];

    // Те же ключи, что и на стартовой странице — настройки общие
    var STORAGE_KEYS = {
        lang:       'isastaurant:lang',
        theme:      'isastaurant:theme',
        branch:     'isastaurant:branch',
        branchName: 'isastaurant:branchName',
        cart:       'isastaurant:cart',
        payment:    'isastaurant:payment',
        mode:       'isastaurant:mode',
        phone:      'isastaurant:phone',
        address:    'isastaurant:address',
        housing:    'isastaurant:housing'
    };

    /* --------------------------------------------------------
       2. Состояние и хранилище
       -------------------------------------------------------- */

    var state = {
        lang: 'ru',
        theme: 'dark',
        category: 'all',
        cart: {},          // { dishId: количество }
        payment: 'kaspi',
        // delivery — как было; pickup — забирают сами из филиала
        mode: 'delivery',
        phone: '',         // только цифры, без +7
        // ok становится true только после подтверждения бэкендом
        address: { text: '', lat: null, lon: null, ok: false },

        // private — как было раньше; flat — с квартирой и подъездом
        housing: 'private',
        flat: '',
        entrance: '',

        branchId: null
    };

    var HOUSING_TYPES = ['private', 'flat'];

    function storageGet(key) {
        try { return window.localStorage.getItem(key); }
        catch (e) { return null; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); }
        catch (e) { /* приватный режим — просто не сохраняем */ }
    }

    var dom = {
        root:        document.documentElement,
        header:      document.getElementById('header'),
        branch:        document.getElementById('headerBranch'),
        branchSwitch:  document.getElementById('branchSwitch'),
        branchTrigger: document.getElementById('branchTrigger'),
        branchList:    document.getElementById('branchList'),
        branchArrow:   document.querySelector('.branch__arrow'),
        whatsappLink:    document.getElementById('whatsappLink'),
        supportPhone:    document.getElementById('supportPhone'),
        supportWhatsapp: document.getElementById('supportWhatsapp'),
        langToggle:  document.getElementById('langToggle'),
        langValue:   document.getElementById('langToggleValue'),
        themeToggle: document.getElementById('themeToggle'),
        cartBtn:     document.getElementById('cartBtn'),
        cartBadge:   document.getElementById('cartBadge'),
        cartText:    document.getElementById('cartCountText'),
        chips:       document.getElementById('categoryChips'),
        sections:    document.getElementById('menuSections'),
        empty:       document.getElementById('emptyState'),
        toast:       document.getElementById('toast'),
        modal:       document.getElementById('dishModal'),
        modalClose:  document.getElementById('modalClose'),
        modalOverlay: document.getElementById('modalOverlay'),
        modalMedia:  document.getElementById('dishModalMedia'),
        modalTitle:  document.getElementById('dishModalTitle'),
        modalWeight: document.getElementById('dishModalWeight'),
        modalDesc:   document.getElementById('dishModalDescription'),
        modalIngr:   document.getElementById('dishModalIngredients'),
        modalPrice:  document.getElementById('dishModalPrice'),
        modalAdd:    document.getElementById('dishModalAdd'),

        // Корзина
        cart:        document.getElementById('cartPanel'),
        cartOverlay: document.getElementById('cartOverlay'),
        cartClose:   document.getElementById('cartClose'),
        cartList:    document.getElementById('cartList'),
        cartEmpty:   document.getElementById('cartEmptyState'),
        cartFoot:    document.getElementById('cartFoot'),
        cartHeadCount: document.getElementById('cartHeadCount'),
        subtotal:    document.getElementById('cartSubtotal'),
        delivery:    document.getElementById('cartDelivery'),
        total:       document.getElementById('cartTotal'),
        cartHint:    document.getElementById('cartHint'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        payOptions:  document.querySelectorAll('.pay__option'),

        // Телефон и экран подтверждения
        cartScroll:   document.getElementById('cartScroll'),
        phoneField:   document.getElementById('phoneField'),
        phoneInput:   document.getElementById('phoneInput'),
        phoneError:   document.getElementById('phoneError'),
        cartForm:      document.getElementById('cartForm'),
        modeOptions:    document.querySelectorAll('.mode__option'),
        pickupInfo:     document.getElementById('pickupInfo'),
        pickupBranch:   document.getElementById('pickupBranch'),
        deliveryFields: document.getElementById('deliveryFields'),
        deliveryRow:    document.getElementById('deliveryRow'),
        addressField:  document.getElementById('addressField'),
        addressInput:  document.getElementById('addressInput'),
        addressList:   document.getElementById('addressList'),
        addressError:  document.getElementById('addressError'),
        housingOptions: document.querySelectorAll('.housing__option'),
        flatFields:    document.getElementById('flatFields'),
        flatInput:     document.getElementById('flatInput'),
        entranceInput: document.getElementById('entranceInput'),
        flatError:     document.getElementById('flatError'),
        cartSuccess:  document.getElementById('cartSuccess'),
        successText:  document.getElementById('successText'),
        successPay:   document.getElementById('successPay'),
        successClose: document.getElementById('successClose')
    };

    function t(key, vars) {
        var str = TRANSLATIONS[state.lang][key] || '';
        if (vars) {
            Object.keys(vars).forEach(function (name) {
                str = str.replace('{' + name + '}', vars[name]);
            });
        }
        return str;
    }

    function formatPrice(value) {
        // Разряды неразрывными пробелами: 2 745 ₸
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
    }

    /* --------------------------------------------------------
       3. Появление карточек при скролле
       -------------------------------------------------------- */

    var observer = null;

    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
    }

    function observeDishes() {
        var cards = dom.sections.querySelectorAll('.dish');
        if (!observer) {
            // Без поддержки observer просто показываем всё
            cards.forEach(function (card) { card.classList.add('is-visible'); });
            return;
        }
        cards.forEach(function (card) { observer.observe(card); });
    }

    /* --------------------------------------------------------
       4. Рендер категорий и блюд
       -------------------------------------------------------- */

    function renderChips() {
        dom.chips.innerHTML = '';

        CATEGORIES.forEach(function (category, index) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip';
            chip.style.setProperty('--i', index);
            chip.setAttribute('data-category', category.id);
            chip.setAttribute('aria-pressed', String(category.id === state.category));

            var emoji = document.createElement('span');
            emoji.className = 'chip__emoji';
            emoji.setAttribute('aria-hidden', 'true');
            emoji.textContent = category.emoji;

            var label = document.createElement('span');
            label.className = 'chip__label';
            label.textContent = category.name[state.lang];

            chip.appendChild(emoji);
            chip.appendChild(label);

            chip.addEventListener('click', function () {
                setCategory(category.id);
            });

            dom.chips.appendChild(chip);
        });
    }

    // Обновляет только состояние нажатия — без перерисовки (чтобы не терять анимацию)
    function updateChipsState() {
        dom.chips.querySelectorAll('.chip').forEach(function (chip) {
            var isActive = chip.getAttribute('data-category') === state.category;
            chip.setAttribute('aria-pressed', String(isActive));
        });
    }

    function createEmoji(dish) {
        var emoji = document.createElement('span');
        emoji.className = 'dish__emoji';
        emoji.setAttribute('aria-hidden', 'true');
        emoji.textContent = dish.emoji;
        return emoji;
    }

    var currentDish = null;  // текущее блюдо в модали

    function openDishModal(dish) {
        currentDish = dish;

        // Фото или emoji
        dom.modalMedia.innerHTML = '';
        if (dish.image) {
            var img = document.createElement('img');
            img.src = dish.image;
            img.alt = '';
            img.style.display = 'block';
            dom.modalMedia.appendChild(img);
        } else {
            var emoji = document.createElement('span');
            emoji.setAttribute('aria-hidden', 'true');
            emoji.textContent = dish.emoji;
            dom.modalMedia.appendChild(emoji);
        }

        dom.modalTitle.textContent = dish.name[state.lang];
        dom.modalWeight.textContent = dish.weight;
        dom.modalDesc.textContent = dish.description[state.lang];
        dom.modalIngr.textContent = dish.ingredients[state.lang];
        dom.modalPrice.textContent = formatPrice(dish.price);
        dom.modalAdd.textContent = t('addToCart');

        dom.modal.classList.add('is-open');
        updateScrollLock();
    }

    function closeDishModal() {
        dom.modal.classList.remove('is-open');
        currentDish = null;
        updateScrollLock();
    }

    function createDishCard(dish, index) {
        var card = document.createElement('article');
        card.className = 'dish';
        card.style.setProperty('--i', index % 8);   // сброс задержки каждые 8 карточек

        var media = document.createElement('div');
        media.className = 'dish__media';
        media.style.cursor = 'pointer';
        media.addEventListener('click', function () {
            openDishModal(dish);
        });

        var visual;
        if (dish.image) {
            // alt пустой: название дублируется заголовком рядом — фото декоративное
            visual = document.createElement('img');
            visual.className = 'dish__photo';
            visual.src = dish.image;
            visual.alt = '';
            visual.loading = 'lazy';
            visual.decoding = 'async';
            // Если файл не найден — показываем emoji вместо битой картинки
            visual.addEventListener('error', function () {
                visual.remove();
                media.insertBefore(createEmoji(dish), media.firstChild);
            });
        } else {
            visual = createEmoji(dish);
        }

        var add = document.createElement('button');
        add.type = 'button';
        add.className = 'dish__add';
        add.textContent = '+';
        add.setAttribute('aria-label', t('addLabel', { dish: dish.name[state.lang] }));
        add.addEventListener('click', function (event) {
            // Кнопка лежит внутри .dish__media — без этого клик открыл бы ещё и модалку
            event.stopPropagation();
            addToCart(dish);
        });

        media.appendChild(visual);
        media.appendChild(add);

        var body = document.createElement('div');
        body.className = 'dish__body';

        var name = document.createElement('h3');
        name.className = 'dish__name';
        name.textContent = dish.name[state.lang];

        var price = document.createElement('p');
        price.className = 'dish__price';
        price.textContent = formatPrice(dish.price);

        body.appendChild(name);
        body.appendChild(price);

        card.appendChild(media);
        card.appendChild(body);

        return card;
    }

    function renderSections() {
        dom.sections.innerHTML = '';

        // 'all' — все категории подряд, иначе только выбранная
        var visible = CATEGORIES.filter(function (category) {
            if (category.id === 'all') return false;
            return state.category === 'all' || state.category === category.id;
        });

        var total = 0;

        visible.forEach(function (category) {
            var dishes = DISHES.filter(function (dish) {
                return dish.category === category.id;
            });
            if (!dishes.length) return;

            total += dishes.length;

            var section = document.createElement('section');
            section.className = 'section';

            var title = document.createElement('h2');
            title.className = 'section__title section__title--category';
            title.textContent = category.name[state.lang];

            var grid = document.createElement('div');
            grid.className = 'dish-grid';

            dishes.forEach(function (dish, index) {
                grid.appendChild(createDishCard(dish, index));
            });

            section.appendChild(title);
            section.appendChild(grid);
            dom.sections.appendChild(section);
        });

        dom.empty.hidden = total > 0;
        observeDishes();
    }

    function setCategory(id) {
        if (state.category === id) return;
        state.category = id;
        updateChipsState();
        renderSections();
    }

    /* --------------------------------------------------------
       5. Корзина
       -------------------------------------------------------- */

    function loadCart() {
        var raw = storageGet(STORAGE_KEYS.cart);
        if (!raw) return {};
        try {
            var parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function saveCart() {
        storageSet(STORAGE_KEYS.cart, JSON.stringify(state.cart));
    }

    function cartCount() {
        return Object.keys(state.cart).reduce(function (sum, id) {
            return sum + state.cart[id];
        }, 0);
    }

    function cartSum() {
        return Object.keys(state.cart).reduce(function (sum, id) {
            var dish = findDish(id);
            return dish ? sum + dish.price * state.cart[id] : sum;
        }, 0);
    }

    function findDish(id) {
        for (var i = 0; i < DISHES.length; i++) {
            if (DISHES[i].id === id) return DISHES[i];
        }
        return null;
    }

    function updateCartBadge() {
        var count = cartCount();
        dom.cartBadge.textContent = count > 99 ? '99+' : String(count);
        dom.cartBadge.classList.toggle('is-visible', count > 0);
        // Дублируем счётчик текстом для скринридеров
        dom.cartText.textContent = count > 0
            ? t('cartSummary', { count: count, sum: formatPrice(cartSum()) })
            : t('cartEmpty');
    }

    function addToCart(dish) {
        state.cart[dish.id] = (state.cart[dish.id] || 0) + 1;
        saveCart();
        updateCartBadge();

        // Толчок иконки корзины
        dom.cartBtn.classList.remove('is-bumped');
        void dom.cartBtn.offsetWidth;          // перезапуск анимации
        dom.cartBtn.classList.add('is-bumped');

        // Если панель открыта — сразу показываем новую позицию
        if (isCartOpen()) renderCart();

        showToast(t('addedToCart') + ' — ' + dish.name[state.lang]);
    }

    /* --------------------------------------------------------
       6. Панель корзины
       -------------------------------------------------------- */

    // Позиции в порядке меню: { dish, qty }
    function cartItems() {
        var items = [];
        DISHES.forEach(function (dish) {
            var qty = state.cart[dish.id];
            if (qty > 0) items.push({ dish: dish, qty: qty });
        });
        return items;
    }

    // Бесплатно от порога; пустая корзина и самовывоз — тоже без доставки
    function deliveryPrice() {
        if (isPickup()) return 0;

        var sum = cartSum();
        if (sum === 0 || sum >= DELIVERY.freeFrom) return 0;
        return DELIVERY.price;
    }

    // Иконка корзины в пустом состоянии
    function createRemoveIcon() {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M5 7h14M10 7V5.5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 14 5.5V7' +
                               'M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '1.7');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');

        svg.appendChild(path);
        return svg;
    }

    // Одна позиция корзины. Кнопки меняют DOM на месте — без перерисовки списка,
    // чтобы не сбрасывать анимацию появления соседних карточек.
    function createCartItem(item, index) {
        var dish = item.dish;

        var li = document.createElement('li');
        li.className = 'cart-item';
        li.style.setProperty('--i', index);

        /* --- Фото --- */
        var media = document.createElement('div');
        media.className = 'cart-item__media';

        if (dish.image) {
            var img = document.createElement('img');
            img.src = dish.image;
            img.alt = '';
            img.loading = 'lazy';
            img.addEventListener('error', function () {
                img.remove();
                media.appendChild(createEmoji(dish));
            });
            media.appendChild(img);
        } else {
            media.appendChild(createEmoji(dish));
        }

        /* --- Название и кнопка удаления --- */
        var body = document.createElement('div');
        body.className = 'cart-item__body';

        var top = document.createElement('div');
        top.className = 'cart-item__top';

        var name = document.createElement('h4');
        name.className = 'cart-item__name';
        name.textContent = dish.name[state.lang];

        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'cart-item__remove';
        remove.setAttribute('aria-label', t('removeLabel', { dish: dish.name[state.lang] }));
        remove.appendChild(createRemoveIcon());
        remove.addEventListener('click', function () { removeItem(dish, li); });

        top.appendChild(name);
        top.appendChild(remove);

        /* --- Цена за порцию и вес --- */
        var unit = document.createElement('p');
        unit.className = 'cart-item__unit';
        unit.textContent = formatPrice(dish.price) + ' · ' + dish.weight;

        /* --- Счётчик и сумма строки --- */
        var bottom = document.createElement('div');
        bottom.className = 'cart-item__bottom';

        var qty = document.createElement('div');
        qty.className = 'qty';

        var minus = document.createElement('button');
        minus.type = 'button';
        minus.className = 'qty__btn';
        minus.textContent = '−';
        minus.setAttribute('aria-label', t('decreaseLabel', { dish: dish.name[state.lang] }));

        var value = document.createElement('span');
        value.className = 'qty__value';
        value.textContent = String(item.qty);

        var plus = document.createElement('button');
        plus.type = 'button';
        plus.className = 'qty__btn';
        plus.textContent = '+';
        plus.setAttribute('aria-label', t('increaseLabel', { dish: dish.name[state.lang] }));

        var sum = document.createElement('span');
        sum.className = 'cart-item__sum';
        sum.textContent = formatPrice(dish.price * item.qty);

        minus.addEventListener('click', function () { changeQty(dish, -1, li, value, sum); });
        plus.addEventListener('click',  function () { changeQty(dish,  1, li, value, sum); });

        qty.appendChild(minus);
        qty.appendChild(value);
        qty.appendChild(plus);

        bottom.appendChild(qty);
        bottom.appendChild(sum);

        body.appendChild(top);
        body.appendChild(unit);
        body.appendChild(bottom);

        li.appendChild(media);
        li.appendChild(body);

        return li;
    }

    // Плюс / минус. Ноль означает удаление позиции.
    function changeQty(dish, delta, li, valueEl, sumEl) {
        var next = (state.cart[dish.id] || 0) + delta;

        if (next <= 0) {
            removeItem(dish, li);
            return;
        }

        state.cart[dish.id] = next;
        saveCart();

        valueEl.textContent = String(next);
        sumEl.textContent = formatPrice(dish.price * next);

        // Толчок суммы, чтобы изменение было заметно
        sumEl.classList.remove('is-bumped');
        void sumEl.offsetWidth;
        sumEl.classList.add('is-bumped');

        updateCartBadge();
        updateTotals();
    }

    // Удаление с анимацией: сначала карточка уезжает, потом список перерисовывается
    function removeItem(dish, li) {
        delete state.cart[dish.id];
        saveCart();
        updateCartBadge();
        updateTotals();

        li.classList.add('is-removing');
        window.setTimeout(renderCart, 280);
    }

    // Суммы, подсказка о бесплатной доставке и счётчик в шапке панели
    function updateTotals() {
        var sum = cartSum();
        var count = cartCount();
        var ship = deliveryPrice();

        dom.subtotal.textContent = formatPrice(sum);
        dom.total.textContent = formatPrice(sum + ship);

        if (ship === 0) {
            dom.delivery.textContent = t('cartFree');
            dom.delivery.classList.add('is-free');
        } else {
            dom.delivery.textContent = formatPrice(ship);
            dom.delivery.classList.remove('is-free');
        }

        dom.cartHeadCount.textContent = count
            ? t('cartCount', { count: count, sum: formatPrice(sum) })
            : t('cartEmpty');

        // Сколько осталось добрать до бесплатной доставки.
        // При самовывозе подсказка бессмысленна — платить за доставку нечего
        var left = DELIVERY.freeFrom - sum;
        if (!isPickup() && sum > 0 && left > 0) {
            dom.cartHint.textContent = t('freeDeliveryHint', { sum: formatPrice(left) });
            dom.cartHint.hidden = false;
        } else {
            dom.cartHint.hidden = true;
        }
    }

    // Полная перерисовка списка (добавление, удаление, смена языка)
    function renderCart() {
        // Показан экран «заказ принят» — список и итоги сейчас скрыты
        if (showingSuccess) { renderSuccess(); return; }

        var items = cartItems();

        dom.cartList.innerHTML = '';
        items.forEach(function (item, index) {
            dom.cartList.appendChild(createCartItem(item, index));
        });

        // Пустая корзина — прячем форму и итоги, оформлять нечего
        dom.cartEmpty.hidden = items.length > 0;
        dom.cartForm.hidden = items.length === 0;
        dom.cartFoot.hidden = items.length === 0;

        updateTotals();
    }

    function isCartOpen() {
        return dom.cart.classList.contains('is-open');
    }

    function openCart() {
        closeDishModal();          // две панели одновременно не нужны
        if (showingSuccess) hideSuccess();
        renderCart();
        dom.cart.classList.add('is-open');
        updateScrollLock();
        dom.cartClose.focus();
    }

    function closeCart() {
        dom.cart.classList.remove('is-open');
        updateScrollLock();
        dom.cartBtn.focus();

        // Сбрасываем экран подтверждения, когда панель уже уехала
        if (showingSuccess) window.setTimeout(hideSuccess, 500);
    }

    function toggleCart() {
        if (isCartOpen()) closeCart();
        else openCart();
    }

    // Общая блокировка прокрутки: корзина и модалка блюда делят её между собой
    function updateScrollLock() {
        var locked = isCartOpen() || dom.modal.classList.contains('is-open');
        document.body.style.overflow = locked ? 'hidden' : '';
    }

    /* ---------- Способ оплаты ---------- */

    function setPayment(method, persist) {
        if (PAYMENTS.indexOf(method) === -1) method = 'kaspi';
        state.payment = method;

        Array.prototype.forEach.call(dom.payOptions, function (option) {
            var isActive = option.getAttribute('data-method') === method;
            option.setAttribute('aria-checked', String(isActive));
            // Только выбранный доступен с Tab — стандартное поведение radiogroup
            option.tabIndex = isActive ? 0 : -1;
        });

        if (persist !== false) storageSet(STORAGE_KEYS.payment, method);
    }

    // Стрелками переключаем способ оплаты, как в настоящей группе радиокнопок
    function handlePaymentKeydown(event) {
        var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        if (keys.indexOf(event.key) === -1) return;

        event.preventDefault();
        var step = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : -1;
        var index = PAYMENTS.indexOf(state.payment);
        var next = (index + step + PAYMENTS.length) % PAYMENTS.length;

        setPayment(PAYMENTS[next]);
        dom.payOptions[next].focus();
    }

    /* ---------- Адрес доставки (через бэкенд → 2GIS) ---------- */

    var suggestTimer = null;
    var suggestSeq = 0;        // ответы на устаревшие запросы игнорируем
    var validateSeq = 0;

    var warnedOffline = false;

    function apiGet(path, query) {
        return fetch(API_BASE + path + '?q=' + encodeURIComponent(query))
            // Отдельно помечаем «сервер не ответил» — сообщение пользователю
            // должно отличаться от «2GIS не нашёл такой адрес»
            .catch(function () {
                var offline = new Error('offline');
                offline.offline = true;
                throw offline;
            })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            });
    }

    // Подсказка в консоль — один раз, чтобы не засорять её при каждом нажатии
    function warnOffline(error) {
        if (!error || !error.offline || warnedOffline) return;
        warnedOffline = true;
        console.warn('[ISAstaurant] Бэкенд не отвечает. Запустите его: cd backend && npm start');
    }

    // idle | loading | ok | invalid
    function setAddressState(mode, messageKey) {
        var field = dom.addressField;
        field.classList.toggle('is-loading', mode === 'loading');
        field.classList.toggle('is-ok', mode === 'ok');
        field.classList.toggle('is-invalid', mode === 'invalid');

        if (messageKey) {
            dom.addressError.textContent = t(messageKey);
            dom.addressError.hidden = false;
        } else {
            dom.addressError.hidden = true;
        }
    }

    function saveAddress() {
        storageSet(STORAGE_KEYS.address, JSON.stringify(state.address));
    }

    function loadAddress() {
        var raw = storageGet(STORAGE_KEYS.address);
        if (!raw) return;
        try {
            var saved = JSON.parse(raw);
            if (saved && typeof saved.text === 'string') {
                state.address = {
                    text: saved.text,
                    lat: saved.lat != null ? saved.lat : null,
                    lon: saved.lon != null ? saved.lon : null,
                    ok: !!saved.ok
                };
                dom.addressInput.value = saved.text;
                if (state.address.ok) setAddressState('ok');
            }
        } catch (e) { /* повреждённая запись — просто игнорируем */ }
    }

    function closeSuggests() {
        dom.addressField.classList.remove('is-open');
        dom.addressInput.setAttribute('aria-expanded', 'false');
    }

    function renderSuggests(items) {
        dom.addressList.innerHTML = '';

        if (!items.length) { closeSuggests(); return; }

        items.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'address__option';
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');
            li.textContent = item.address;

            // mousedown, а не click: blur сработал бы раньше и закрыл список
            li.addEventListener('mousedown', function (event) {
                event.preventDefault();
                chooseAddress(item);
            });

            dom.addressList.appendChild(li);
        });

        dom.addressField.classList.add('is-open');
        dom.addressInput.setAttribute('aria-expanded', 'true');
    }

    function chooseAddress(item) {
        state.address = { text: item.address, lat: item.lat, lon: item.lon, ok: true };
        dom.addressInput.value = item.address;
        saveAddress();
        closeSuggests();
        setAddressState('ok');
    }

    function handleAddressInput() {
        var query = dom.addressInput.value.trim();

        // Текст изменили — прежнее подтверждение больше не действует
        state.address = { text: query, lat: null, lon: null, ok: false };
        setAddressState('idle');

        window.clearTimeout(suggestTimer);

        if (query.length < SUGGEST_MIN) { closeSuggests(); return; }

        suggestTimer = window.setTimeout(function () {
            var seq = ++suggestSeq;
            apiGet('/api/address/suggest', query)
                .then(function (data) {
                    if (seq !== suggestSeq) return;
                    renderSuggests((data && data.items) || []);
                })
                .catch(function (error) {
                    if (seq !== suggestSeq) return;
                    closeSuggests();
                    // Молчать нельзя: иначе «подсказок просто нет» без объяснения
                    setAddressState('idle', error && error.offline ? 'addressOffline' : null);
                    warnOffline(error);
                });
        }, SUGGEST_DELAY);
    }

    /*
       Проверка адреса на бэкенде. Вызывается, когда пользователь ушёл из
       поля, не выбрав подсказку, и ещё раз перед оформлением заказа.
       onDone(ok) — чтобы «Оформить заказ» дождался ответа.
    */
    function validateAddress(onDone) {
        var query = dom.addressInput.value.trim();

        if (!query) {
            state.address = { text: '', lat: null, lon: null, ok: false };
            setAddressState('idle');
            if (onDone) onDone(false);
            return;
        }

        // Уже подтверждён и текст не менялся — второй запрос не нужен
        if (state.address.ok && state.address.text === query) {
            if (onDone) onDone(true);
            return;
        }

        var seq = ++validateSeq;
        setAddressState('loading');

        apiGet('/api/address/validate', query)
            .then(function (data) {
                if (seq !== validateSeq) return;

                if (data && data.ok) {
                    // Показываем адрес так, как его понял 2GIS
                    state.address = { text: data.address, lat: data.lat, lon: data.lon, ok: true };
                    dom.addressInput.value = data.address;
                    saveAddress();
                    setAddressState('ok');
                    if (onDone) onDone(true);
                    return;
                }

                state.address.ok = false;
                saveAddress();
                setAddressState('invalid',
                    (data && data.reason === 'outside_almaty') ? 'addressOutside' : 'addressNotFound');
                if (onDone) onDone(false);
            })
            .catch(function (error) {
                if (seq !== validateSeq) return;
                state.address.ok = false;
                setAddressState('invalid', error && error.offline ? 'addressOffline' : 'addressFailed');
                warnOffline(error);
                if (onDone) onDone(false);
            });
    }

    // Стрелками ходим по подсказкам, Enter выбирает активную
    function handleAddressKeydown(event) {
        var options = Array.prototype.slice.call(dom.addressList.children);
        var isOpen = dom.addressField.classList.contains('is-open');

        if (event.key === 'Escape') { closeSuggests(); return; }

        if (event.key === 'Enter') {
            var active = dom.addressList.querySelector('.address__option.is-active');
            if (isOpen && active) {
                event.preventDefault();
                active.dispatchEvent(new MouseEvent('mousedown'));
            }
            return;
        }

        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        if (!isOpen || !options.length) return;

        event.preventDefault();
        var index = options.findIndex(function (el) { return el.classList.contains('is-active'); });
        var step = event.key === 'ArrowDown' ? 1 : -1;
        var next = (index + step + options.length) % options.length;

        options.forEach(function (el) {
            el.classList.remove('is-active');
            el.setAttribute('aria-selected', 'false');
        });
        options[next].classList.add('is-active');
        options[next].setAttribute('aria-selected', 'true');
        options[next].scrollIntoView({ block: 'nearest' });
    }

    /* ---------- Доставка или самовывоз ---------- */

    function isPickup() {
        return state.mode === 'pickup';
    }

    function setMode(mode, persist) {
        if (MODES.indexOf(mode) === -1) mode = 'delivery';
        state.mode = mode;

        Array.prototype.forEach.call(dom.modeOptions, function (option) {
            var isActive = option.getAttribute('data-mode') === mode;
            option.setAttribute('aria-checked', String(isActive));
            option.tabIndex = isActive ? 0 : -1;
        });

        // При самовывозе адрес, тип дома и квартира не нужны
        var pickup = isPickup();
        dom.deliveryFields.hidden = pickup;
        dom.pickupInfo.hidden = !pickup;
        dom.deliveryRow.hidden = pickup;

        if (pickup) {
            // Ошибки полей доставки больше не актуальны
            setAddressState('idle');
            setFlatError(false);
            closeSuggests();
        }

        renderPickupBranch();
        updateTotals();

        if (persist !== false) storageSet(STORAGE_KEYS.mode, mode);
    }

    // Куда приезжать — это выбранный в шапке филиал
    function renderPickupBranch() {
        var branch = findBranch(state.branchId);
        dom.pickupBranch.textContent = branch
            ? (branch.name[state.lang] || branch.name.ru)
            : '';
    }

    function handleModeKeydown(event) {
        var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        if (keys.indexOf(event.key) === -1) return;

        event.preventDefault();
        var step = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : -1;
        var index = MODES.indexOf(state.mode);
        var next = (index + step + MODES.length) % MODES.length;

        setMode(MODES[next]);
        dom.modeOptions[next].focus();
    }

    /* ---------- Тип дома: частный / жилой ---------- */

    function setHousing(type, persist) {
        if (HOUSING_TYPES.indexOf(type) === -1) type = 'private';
        state.housing = type;

        Array.prototype.forEach.call(dom.housingOptions, function (option) {
            var isActive = option.getAttribute('data-housing') === type;
            option.setAttribute('aria-checked', String(isActive));
            // Только выбранный доступен с Tab — поведение группы радиокнопок
            option.tabIndex = isActive ? 0 : -1;
        });

        // Для частного дома квартира и подъезд не нужны — как было раньше
        dom.flatFields.hidden = (type !== 'flat');
        if (type !== 'flat') setFlatError(false);

        if (persist !== false) saveHousing();
    }

    function setFlatError(show) {
        dom.flatFields.classList.toggle('is-invalid', !!show);
        dom.flatError.hidden = !show;
    }

    function isFlatValid() {
        // Частному дому проверять нечего
        return state.housing !== 'flat' || state.flat.length > 0;
    }

    function saveHousing() {
        storageSet(STORAGE_KEYS.housing, JSON.stringify({
            housing: state.housing,
            flat: state.flat,
            entrance: state.entrance
        }));
    }

    function loadHousing() {
        var raw = storageGet(STORAGE_KEYS.housing);
        var saved = null;

        if (raw) {
            try { saved = JSON.parse(raw); } catch (e) { saved = null; }
        }

        if (saved) {
            state.flat = String(saved.flat || '');
            state.entrance = String(saved.entrance || '');
            dom.flatInput.value = state.flat;
            dom.entranceInput.value = state.entrance;
        }

        setHousing(saved ? saved.housing : 'private', false);
    }

    // Стрелками переключаем тип дома, как в настоящей группе радиокнопок
    function handleHousingKeydown(event) {
        var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        if (keys.indexOf(event.key) === -1) return;

        event.preventDefault();
        var step = (event.key === 'ArrowRight' || event.key === 'ArrowDown') ? 1 : -1;
        var index = HOUSING_TYPES.indexOf(state.housing);
        var next = (index + step + HOUSING_TYPES.length) % HOUSING_TYPES.length;

        setHousing(HOUSING_TYPES[next]);
        dom.housingOptions[next].focus();
    }

    // «Алматы, Абая 150, кв. 12, подъезд 3» — для заказа и экрана подтверждения.
    // При самовывозе показываем филиал, куда приезжать.
    function fullAddress() {
        if (isPickup()) {
            var branch = findBranch(state.branchId);
            var name = branch ? (branch.name[state.lang] || branch.name.ru) : '';
            return name ? t('modePickup') + ': ' + name : t('modePickup');
        }

        var parts = [state.address.text];

        if (state.housing === 'flat') {
            if (state.flat) parts.push(t('flatShort', { flat: state.flat }));
            if (state.entrance) parts.push(t('entranceShort', { entrance: state.entrance }));
        }

        return parts.filter(Boolean).join(', ');
    }

    /* ---------- Телефон ---------- */

    // 7001234567 -> «700 123 45 67»
    function formatPhone(digits) {
        var parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];
        return parts.filter(function (part) { return part; }).join(' ');
    }

    // Оставляем только цифры и подставляем пробелы, сохраняя позицию курсора
    function handlePhoneInput() {
        var input = dom.phoneInput;
        var caret = input.selectionStart;
        // Сколько цифр стояло левее курсора — по ним вернём его на место
        var digitsBefore = input.value.slice(0, caret).replace(/\D/g, '').length;

        var digits = input.value.replace(/\D/g, '');
        // Вставили номер целиком (+7 700… или 8 700…) — код страны убираем.
        // Ровно 11 цифр: иначе у случайного набора отрежется первая значащая.
        if (digits.length === 11 && (digits.charAt(0) === '7' || digits.charAt(0) === '8')) {
            digits = digits.slice(1);
        }
        digits = digits.slice(0, 10);

        state.phone = digits;
        input.value = formatPhone(digits);
        storageSet(STORAGE_KEYS.phone, digits);

        var pos = 0, seen = 0;
        while (pos < input.value.length && seen < digitsBefore) {
            if (/\d/.test(input.value.charAt(pos))) seen++;
            pos++;
        }
        input.setSelectionRange(pos, pos);

        // Пока пользователь печатает — не ругаемся; проверим на blur
        setPhoneError(false);
    }

    function isPhoneValid() {
        return state.phone.length === 10;
    }

    function setPhoneError(show) {
        dom.phoneField.classList.toggle('is-invalid', !!show);
        dom.phoneError.hidden = !show;
    }

    /* ---------- Оформление заказа ---------- */

    function shake(element) {
        element.classList.remove('is-shake');
        void element.offsetWidth;      // перезапуск анимации
        element.classList.add('is-shake');
    }

    function handleCheckout() {
        if (!cartCount()) return;

        // При самовывозе адрес не нужен — заказ забирают из филиала
        if (isPickup()) {
            if (!isPhoneValid()) {
                setPhoneError(true);
                shake(dom.phoneField);
                dom.phoneInput.focus();
                return;
            }
            placeOrder();
            return;
        }

        // Сначала мгновенные проверки, потом сетевая — иначе пользователь
        // ждёт ответ 2GIS только чтобы увидеть ошибку в телефоне
        if (!dom.addressInput.value.trim()) {
            setAddressState('invalid', 'addressRequired');
            shake(dom.addressField);
            dom.addressInput.focus();
            return;
        }

        // Для жилого дома без номера квартиры курьеру некуда идти
        if (!isFlatValid()) {
            setFlatError(true);
            shake(dom.flatFields);
            dom.flatInput.focus();
            return;
        }

        if (!isPhoneValid()) {
            setPhoneError(true);
            shake(dom.phoneField);
            dom.phoneInput.focus();
            return;
        }

        // Адрес подтверждает бэкенд: он и решает, входит ли он в зону доставки
        dom.checkoutBtn.disabled = true;
        validateAddress(function (ok) {
            dom.checkoutBtn.disabled = false;

            if (!ok) {
                shake(dom.addressField);
                dom.addressInput.focus();
                return;
            }

            placeOrder();
        });
    }

    function placeOrder() {
        var method = PAYMENT_NAMES[state.payment][state.lang];
        var total = cartSum() + deliveryPrice();

        console.log('[ISAstaurant] Order', {
            items: cartItems().map(function (item) {
                return { id: item.dish.id, qty: item.qty };
            }),
            subtotal: cartSum(),
            delivery: deliveryPrice(),
            total: total,
            payment: state.payment,
            phone: '+7' + state.phone,
            mode: state.mode,
            branch: state.branchId,
            // Всё, что ниже, имеет смысл только для доставки
            address: isPickup() ? null : state.address.text,
            housing: isPickup() ? null : state.housing,
            flat: (!isPickup() && state.housing === 'flat') ? state.flat : null,
            entrance: (!isPickup() && state.housing === 'flat') ? (state.entrance || null) : null,
            point: isPickup() ? null : { lat: state.address.lat, lon: state.address.lon }
        });

        // Корзина очищается — заказ ушёл
        state.cart = {};
        saveCart();
        updateCartBadge();
        setPhoneError(false);

        showSuccess(method, total);
    }

    /* ---------- Экран «заказ принят» ---------- */

    var showingSuccess = false;
    var lastOrder = null;      // чтобы перерисовать экран при смене языка

    function renderSuccess() {
        if (!lastOrder) return;

        // Текст + номер отдельной строкой, поэтому собираем через <b>
        dom.successText.textContent = t('orderContact') + ' ';
        var phone = document.createElement('b');
        phone.textContent = '+7 ' + formatPhone(lastOrder.phone);
        dom.successText.appendChild(phone);

        dom.successPay.textContent = lastOrder.address
            ? lastOrder.address + ' · ' + t('orderPayTotal', {
                  method: PAYMENT_NAMES[lastOrder.payment][state.lang],
                  sum: formatPrice(lastOrder.total)
              })
            : t('orderPayTotal', {
                  method: PAYMENT_NAMES[lastOrder.payment][state.lang],
                  sum: formatPrice(lastOrder.total)
              });
    }

    function showSuccess(method, total) {
        lastOrder = {
            phone: state.phone,
            payment: state.payment,
            total: total,
            address: fullAddress()
        };
        showingSuccess = true;

        renderSuccess();
        dom.cartScroll.hidden = true;
        dom.cartFoot.hidden = true;
        dom.cartSuccess.hidden = false;
        dom.cartHeadCount.textContent = '';
        dom.successClose.focus();
    }

    // Возврат к обычному виду корзины
    function hideSuccess() {
        showingSuccess = false;
        dom.cartSuccess.hidden = true;
        dom.cartScroll.hidden = false;
        renderCart();
    }

    function handleCartClick() {
        toggleCart();
    }

    /* --------------------------------------------------------
       7. Тост
       -------------------------------------------------------- */

    var toastTimer = null;

    function showToast(text) {
        dom.toast.textContent = text;
        dom.toast.classList.add('is-visible');

        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            dom.toast.classList.remove('is-visible');
        }, 2200);
    }

    /* --------------------------------------------------------
       8. Язык и тема
       -------------------------------------------------------- */

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

        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.setAttribute('placeholder', dict[key]);
        });

        dom.root.setAttribute('lang', state.lang);
        dom.langValue.textContent = state.lang.toUpperCase();

        renderBranch();
        renderChips();
        renderSections();
        updateCartBadge();
        renderCart();          // названия блюд и подписи в корзине тоже переводятся

        // Если модаль открыта — обновляем её текст
        if (currentDish && dom.modal.classList.contains('is-open')) {
            openDishModal(currentDish);
        }
    }

    function setLanguage(lang, persist) {
        if (LANGUAGES.indexOf(lang) === -1) lang = 'ru';
        state.lang = lang;
        applyLanguage();
        if (persist !== false) storageSet(STORAGE_KEYS.lang, lang);
    }

    function toggleLanguage() {
        var next = LANGUAGES[(LANGUAGES.indexOf(state.lang) + 1) % LANGUAGES.length];

        dom.langToggle.classList.add('is-switching');
        window.setTimeout(function () {
            setLanguage(next);
            dom.langToggle.classList.remove('is-switching');
        }, 180);
    }

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
       9. Филиал в шапке
       -------------------------------------------------------- */

    function findBranch(id) {
        for (var i = 0; i < BRANCHES.length; i++) {
            if (BRANCHES[i].id === id) return BRANCHES[i];
        }
        return null;
    }

    /*
       Какой филиал показывать. Приоритет:
       1) сохранённый id (его пишет и стартовая страница, и этот переключатель)
       2) ?branch= из ссылки, по которой пришли с главной
       3) первый филиал из справочника — чтобы шапка не была пустой
    */
    function resolveBranch() {
        var saved = findBranch(storageGet(STORAGE_KEYS.branch));
        if (saved) return saved;

        var match = /[?&]branch=([^&]+)/.exec(window.location.search);
        var fromUrl = match ? findBranch(decodeURIComponent(match[1])) : null;
        if (fromUrl) return fromUrl;

        return BRANCHES[0] || null;
    }

    function renderBranch() {
        var branch = findBranch(state.branchId);
        dom.branch.textContent = branch ? (branch.name[state.lang] || branch.name.ru) : '';

        // Список филиалов зависит от языка — перерисовываем целиком
        dom.branchList.innerHTML = '';

        BRANCHES.forEach(function (item) {
            var li = document.createElement('li');
            li.className = 'branch__option';
            li.setAttribute('role', 'option');
            li.setAttribute('data-id', item.id);
            li.setAttribute('aria-selected', String(item.id === state.branchId));
            li.textContent = item.name[state.lang] || item.name.ru;

            li.addEventListener('click', function () {
                selectBranch(item.id);
                closeBranchList();
                dom.branchTrigger.focus();
            });

            dom.branchList.appendChild(li);
        });

        // Один филиал переключать не в чем — прячем стрелку
        var single = BRANCHES.length < 2;
        dom.branchTrigger.disabled = single;
        if (dom.branchArrow) dom.branchArrow.hidden = single;

        // Самовывоз идёт из этого же филиала — держим подпись в синхроне
        renderPickupBranch();
    }

    function selectBranch(id, notify) {
        var branch = findBranch(id);
        if (!branch || branch.id === state.branchId) return;

        state.branchId = branch.id;
        storageSet(STORAGE_KEYS.branch, branch.id);
        // Дублируем переводы названия: стартовая страница читает именно их
        storageSet(STORAGE_KEYS.branchName, JSON.stringify(branch.name));

        renderBranch();

        if (notify !== false) {
            showToast(t('branchChanged', { branch: branch.name[state.lang] || branch.name.ru }));
        }
    }

    function openBranchList() {
        if (BRANCHES.length < 2) return;
        dom.branchSwitch.classList.add('is-open');
        dom.branchTrigger.setAttribute('aria-expanded', 'true');
    }

    function closeBranchList() {
        dom.branchSwitch.classList.remove('is-open');
        dom.branchTrigger.setAttribute('aria-expanded', 'false');
    }

    function toggleBranchList() {
        if (dom.branchSwitch.classList.contains('is-open')) closeBranchList();
        else openBranchList();
    }

    // Стрелки и Enter — навигация по списку филиалов с клавиатуры
    function handleBranchKeydown(event) {
        var options = Array.prototype.slice.call(dom.branchList.children);
        var isOpen = dom.branchSwitch.classList.contains('is-open');

        if (event.key === 'Escape') { closeBranchList(); return; }

        if (event.key === 'Enter' || event.key === ' ') {
            var active = dom.branchList.querySelector('.branch__option.is-active');
            if (isOpen && active) {
                event.preventDefault();
                active.click();
            }
            return;
        }

        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();

        if (!isOpen) { openBranchList(); return; }
        if (!options.length) return;

        var index = options.findIndex(function (el) { return el.classList.contains('is-active'); });
        var step = event.key === 'ArrowDown' ? 1 : -1;
        var next = (index + step + options.length) % options.length;

        options.forEach(function (el) { el.classList.remove('is-active'); });
        options[next].classList.add('is-active');
        options[next].scrollIntoView({ block: 'nearest' });
    }

    /* ---------- Контакты поддержки ---------- */

    // Номер задан в branches.js — здесь только подставляем его в разметку
    function renderContacts() {
        if (!CONTACTS.phone) return;

        // Ссылки и подписи могли поменяться в вёрстке — не падаем, если их нет
        function setLink(link, href) {
            if (!link) return;
            link.href = href;
            var value = link.querySelector('.contact__value');
            if (value) value.textContent = CONTACTS.phone;
        }

        setLink(dom.supportPhone, CONTACTS.phoneHref);
        setLink(dom.supportWhatsapp, CONTACTS.whatsappHref);
        if (dom.whatsappLink) dom.whatsappLink.href = CONTACTS.whatsappHref;
    }

    /* --------------------------------------------------------
       10. Инициализация
       -------------------------------------------------------- */

    function handleScroll() {
        dom.header.classList.toggle('is-scrolled', window.scrollY > 8);
    }

    function bindEvents() {
        dom.langToggle.addEventListener('click', toggleLanguage);
        dom.themeToggle.addEventListener('click', toggleTheme);

        // Филиал
        dom.branchTrigger.addEventListener('click', toggleBranchList);
        dom.branchTrigger.addEventListener('keydown', handleBranchKeydown);
        document.addEventListener('click', function (event) {
            if (!dom.branchSwitch.contains(event.target)) closeBranchList();
        });
        dom.cartBtn.addEventListener('click', handleCartClick);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Модаль
        dom.modalClose.addEventListener('click', closeDishModal);
        dom.modalOverlay.addEventListener('click', closeDishModal);
        dom.modalAdd.addEventListener('click', function () {
            if (currentDish) {
                addToCart(currentDish);
                closeDishModal();
            }
        });

        // Корзина
        dom.cartClose.addEventListener('click', closeCart);
        dom.cartOverlay.addEventListener('click', closeCart);
        dom.checkoutBtn.addEventListener('click', handleCheckout);
        dom.successClose.addEventListener('click', closeCart);

        // Адрес
        dom.addressInput.addEventListener('input', handleAddressInput);
        dom.addressInput.addEventListener('keydown', handleAddressKeydown);
        dom.addressInput.addEventListener('blur', function () {
            closeSuggests();
            // Ушли из поля, не выбрав подсказку — проверяем что набрали
            if (dom.addressInput.value.trim() && !state.address.ok) validateAddress();
        });

        // Доставка / самовывоз
        Array.prototype.forEach.call(dom.modeOptions, function (option) {
            option.addEventListener('click', function () {
                setMode(option.getAttribute('data-mode'));
            });
            option.addEventListener('keydown', handleModeKeydown);
        });

        // Тип дома
        Array.prototype.forEach.call(dom.housingOptions, function (option) {
            option.addEventListener('click', function () {
                setHousing(option.getAttribute('data-housing'));
                // Сразу отправляем в поле квартиры — за этим сюда и нажали
                if (state.housing === 'flat') dom.flatInput.focus();
            });
            option.addEventListener('keydown', handleHousingKeydown);
        });

        // Квартира и подъезд: только цифры и буквы вроде «12А»
        dom.flatInput.addEventListener('input', function () {
            dom.flatInput.value = dom.flatInput.value.replace(/[^\dA-Za-zА-Яа-я]/g, '');
            state.flat = dom.flatInput.value;
            saveHousing();
            setFlatError(false);
        });

        dom.entranceInput.addEventListener('input', function () {
            dom.entranceInput.value = dom.entranceInput.value.replace(/\D/g, '');
            state.entrance = dom.entranceInput.value;
            saveHousing();
        });

        dom.flatInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') handleCheckout();
        });

        // Телефон
        dom.phoneInput.addEventListener('input', handlePhoneInput);
        dom.phoneInput.addEventListener('blur', function () {
            // Ругаемся только на начатый и брошенный номер; пустое поле — чисто
            setPhoneError(state.phone.length > 0 && !isPhoneValid());
        });
        dom.phoneInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') handleCheckout();
        });

        Array.prototype.forEach.call(dom.payOptions, function (option) {
            option.addEventListener('click', function () {
                setPayment(option.getAttribute('data-method'));
            });
            option.addEventListener('keydown', handlePaymentKeydown);
        });

        // ESC закрывает верхний слой: сначала корзину, потом модаль блюда
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;

            if (isCartOpen()) closeCart();
            else if (dom.modal.classList.contains('is-open')) closeDishModal();
        });
    }

    function init() {
        var savedTheme = storageGet(STORAGE_KEYS.theme);
        if (!savedTheme && window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: light)').matches) {
            savedTheme = 'light';
        }
        setTheme(savedTheme || 'dark', false);

        var savedLang = storageGet(STORAGE_KEYS.lang);
        if (!savedLang) {
            savedLang = (navigator.language || 'ru').toLowerCase().indexOf('en') === 0 ? 'en' : 'ru';
        }

        state.cart = loadCart();
        setPayment(storageGet(STORAGE_KEYS.payment) || 'kaspi', false);

        // Филиал и контакты — до setLanguage, он их отрисует
        var branch = resolveBranch();
        state.branchId = branch ? branch.id : null;
        if (branch) {
            storageSet(STORAGE_KEYS.branch, branch.id);
            storageSet(STORAGE_KEYS.branchName, JSON.stringify(branch.name));
        }
        renderContacts();

        // Телефон и адрес запоминаем между визитами — не набирать заново
        state.phone = (storageGet(STORAGE_KEYS.phone) || '').replace(/\D/g, '').slice(0, 10);
        dom.phoneInput.value = formatPhone(state.phone);
        loadAddress();
        loadHousing();
        setMode(storageGet(STORAGE_KEYS.mode) || 'delivery', false);

        // applyLanguage сам рисует чипы, секции и корзину
        setLanguage(savedLang, false);

        bindEvents();
        handleScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
