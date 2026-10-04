/* ============================================================
   Мелкие кирпичи интерфейса

   Построение DOM, таблицы, диалог с формой и уведомления.
   Здесь нет ничего про рестораны — только общий инструмент,
   которым app.js собирает экраны.
   ============================================================ */
(function (global) {
    'use strict';

    /* --------------------------------------------------------
       Создание элементов
       -------------------------------------------------------- */

    /**
     * el('div', { class: 'x' }, [дети])
     * Значение null/undefined среди детей пропускается — удобно
     * для условных кусков разметки.
     */
    function el(tag, props, children) {
        var node = document.createElement(tag);

        Object.keys(props || {}).forEach(function (key) {
            var value = props[key];
            if (value === null || value === undefined || value === false) return;

            if (key === 'class') node.className = value;
            else if (key === 'text') node.textContent = value;
            else if (key === 'html') node.innerHTML = value;
            else if (key === 'hidden') node.hidden = Boolean(value);
            else if (key.indexOf('on') === 0) node.addEventListener(key.slice(2).toLowerCase(), value);
            else if (key in node && key !== 'list') node[key] = value;
            else node.setAttribute(key, value);
        });

        [].concat(children || []).forEach(function (child) {
            if (child === null || child === undefined || child === false) return;
            node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
        });

        return node;
    }

    function clear(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
        return node;
    }

    /* --------------------------------------------------------
       Форматирование
       -------------------------------------------------------- */

    // 8260 → «8 260 ₸». Пробел неразрывный, чтобы сумма не переносилась
    function money(value) {
        return String(value == null ? 0 : value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
    }

    /*
       Адрес картинки для показа в админке.

       В базе пути хранятся так, как их видит сайт: относительными
       от его корня — images/lagman.jpg. Админка лежит в /admin/,
       и тот же путь браузер искал бы в /admin/images/. Ведущий слэш
       возвращает адрес к корню сайта.
    */
    function photoUrl(value) {
        if (!value) return '';

        var url = String(value).trim();
        if (/^(https?:)?\/\//i.test(url) || url.charAt(0) === '/') return url;

        return '/' + url;
    }

    /* --------------------------------------------------------
       Уведомления
       -------------------------------------------------------- */

    var toastNode = document.getElementById('toast');
    var toastTimer = null;

    function toast(message, kind) {
        toastNode.textContent = message;
        toastNode.className = 'toast' + (kind === 'error' ? ' toast--error' : '');
        toastNode.hidden = false;

        // Перерисовка перед добавлением класса, иначе анимации не будет
        requestAnimationFrame(function () { toastNode.classList.add('is-visible'); });

        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastNode.classList.remove('is-visible');
            setTimeout(function () { toastNode.hidden = true; }, 200);
        }, kind === 'error' ? 4200 : 2200);
    }

    /* --------------------------------------------------------
       Таблица
       -------------------------------------------------------- */

    /**
     * table({
     *   columns: [{ title, className, render(row) }],
     *   rows: [...],
     *   empty: 'Пока пусто',
     *   rowClass(row)
     * })
     */
    function table(config) {
        if (!config.rows.length) {
            return el('div', { class: 'empty', text: config.empty || 'Пока пусто' });
        }

        var head = el('tr', {}, config.columns.map(function (column) {
            return el('th', { class: column.className || null, text: column.title });
        }));

        var body = config.rows.map(function (row) {
            var cells = config.columns.map(function (column) {
                var content = column.render(row);

                return el('td', { class: column.className || null },
                    typeof content === 'string' ? [content] : [content]);
            });

            return el('tr', { class: config.rowClass ? config.rowClass(row) : null }, cells);
        });

        return el('div', { class: 'table-wrap' }, [
            el('table', { class: 'table' }, [
                el('thead', {}, [head]),
                el('tbody', {}, body)
            ])
        ]);
    }

    /* --------------------------------------------------------
       Поля формы
       -------------------------------------------------------- */

    var WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    // Строит одно поле по описанию и возвращает { node, read() }
    function buildField(spec, value) {
        var control;

        if (spec.type === 'group') {
            return { node: el('div', { class: 'form-group', text: spec.label }), read: null };
        }

        if (spec.type === 'checkbox') {
            control = el('input', { type: 'checkbox', checked: Boolean(value) });

            return {
                node: el('label', { class: 'check' }, [control, el('span', { text: spec.label })]),
                control: control,
                read: function () { return control.checked; }
            };
        }

        if (spec.type === 'select') {
            control = el('select', { class: 'select' }, spec.options.map(function (option) {
                return el('option', {
                    value: String(option.value),
                    text: option.label,
                    selected: String(option.value) === String(value)
                });
            }));
        } else if (spec.type === 'textarea') {
            control = el('textarea', { class: 'textarea', value: value == null ? '' : String(value) });
        } else {
            control = el('input', {
                class: 'input',
                type: spec.type === 'number' ? 'number' : 'text',
                value: value == null ? '' : String(value),
                step: spec.step || null,
                min: spec.min === undefined ? null : spec.min,
                placeholder: spec.placeholder || null
            });
        }

        var error = el('p', { class: 'field__error', hidden: true });

        var node = el('label', { class: 'field' }, [
            el('span', { class: 'field__label', text: spec.label }),
            control,
            spec.hint ? el('span', { class: 'field__hint', text: spec.hint }) : null,
            error
        ]);

        return {
            node: node,
            control: control,
            error: error,

            read: function () {
                var raw = control.value;

                if (spec.type === 'number') {
                    // Пустое числовое поле — это «значение не задано», а не 0
                    if (raw.trim() === '') return null;
                    return Number(raw);
                }

                return raw;
            }
        };
    }

    /* --------------------------------------------------------
       Кадрирование фотографии

       На сайте фото блюда стоит в квадратной рамке с object-fit:
       cover — браузер сам обрезает лишнее по центру. Если блюдо
       в кадре не по центру, ему срезает край, и повлиять на это
       из вёрстки нельзя.

       Поэтому кадрируем здесь: пользователь двигает и приближает
       снимок в такой же квадратной рамке, а на сервер уходит уже
       готовый квадрат. Тогда cover на сайте ничего не отрезает.
       -------------------------------------------------------- */

    var cropDialog = document.getElementById('cropper');
    var cropFrame = document.getElementById('cropFrame');
    var cropImage = document.getElementById('cropImage');
    var cropZoom = document.getElementById('cropZoom');
    var cropApply = document.getElementById('cropApply');
    var cropCancel = document.getElementById('cropCancel');
    var cropClose = document.getElementById('cropClose');

    // Сторона сохраняемого квадрата. На сайте фото показывается
    // примерно в 400 px, 900 хватает и на экраны с двойной плотностью.
    var CROP_OUTPUT = 900;

    var crop = null;

    // Раскладывает картинку по текущим масштабу и смещению
    function cropRender() {
        var size = crop.frame;
        var scale = crop.base * crop.zoom;

        var width = crop.naturalWidth * scale;
        var height = crop.naturalHeight * scale;

        // Рамка всегда должна быть заполнена: пустых полей по краям
        // быть не может, иначе на сайте там окажется фон
        crop.x = Math.min(0, Math.max(size - width, crop.x));
        crop.y = Math.min(0, Math.max(size - height, crop.y));

        cropImage.style.width = width + 'px';
        cropImage.style.height = height + 'px';
        cropImage.style.left = crop.x + 'px';
        cropImage.style.top = crop.y + 'px';
    }

    // Меняет масштаб, оставляя центр кадра на месте
    function cropSetZoom(zoom) {
        var size = crop.frame;
        var previous = crop.base * crop.zoom;

        crop.zoom = Math.min(4, Math.max(1, zoom));

        var next = crop.base * crop.zoom;
        var ratio = next / previous;

        crop.x = size / 2 - (size / 2 - crop.x) * ratio;
        crop.y = size / 2 - (size / 2 - crop.y) * ratio;

        cropZoom.value = String(crop.zoom);
        cropRender();
    }

    /**
     * Показывает диалог кадрирования. Источник — выбранный файл
     * или адрес уже сохранённой картинки (тогда кадр правят заново).
     *
     * Возвращает Promise с готовым квадратным Blob или null,
     * если человек передумал.
     */
    function openCropper(source) {
        return new Promise(function (resolve) {
            var isFile = typeof source !== 'string';
            var objectUrl = isFile ? URL.createObjectURL(source) : source;

            cropImage.onload = function () {
                var size = cropFrame.clientWidth;

                crop = {
                    frame: size,
                    naturalWidth: cropImage.naturalWidth,
                    naturalHeight: cropImage.naturalHeight,

                    // Масштаб, при котором меньшая сторона равна рамке:
                    // с него картинка ровно закрывает квадрат
                    base: size / Math.min(cropImage.naturalWidth, cropImage.naturalHeight),
                    zoom: 1,
                    x: 0,
                    y: 0
                };

                // Начинаем по центру — обычно это уже нужный кадр
                crop.x = (size - crop.naturalWidth * crop.base) / 2;
                crop.y = (size - crop.naturalHeight * crop.base) / 2;

                cropZoom.value = '1';
                cropRender();
            };

            cropImage.src = objectUrl;

            function finish(blob) {
                cropDialog.close();
                if (isFile) URL.revokeObjectURL(objectUrl);
                cropImage.onload = null;
                crop = null;
                resolve(blob);
            }

            cropApply.onclick = function () {
                var scale = crop.base * crop.zoom;

                // Что именно попало в рамку, в координатах исходника
                var side = crop.frame / scale;
                var sourceX = -crop.x / scale;
                var sourceY = -crop.y / scale;

                var canvas = document.createElement('canvas');
                canvas.width = CROP_OUTPUT;
                canvas.height = CROP_OUTPUT;

                var context = canvas.getContext('2d');

                // JPEG не умеет прозрачность: без заливки прозрачные
                // области PNG стали бы чёрными
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, CROP_OUTPUT, CROP_OUTPUT);

                context.drawImage(
                    cropImage,
                    sourceX, sourceY, side, side,
                    0, 0, CROP_OUTPUT, CROP_OUTPUT
                );

                canvas.toBlob(function (blob) { finish(blob); }, 'image/jpeg', 0.85);
            };

            cropCancel.onclick = function () { finish(null); };
            cropClose.onclick = function () { finish(null); };

            // Esc закрывает диалог сам — промис при этом должен ответить
            cropDialog.addEventListener('cancel', function () { finish(null); }, { once: true });

            cropDialog.showModal();
        });
    }

    /* ---- Перетаскивание и масштаб ---- */

    var dragging = null;

    cropFrame.addEventListener('pointerdown', function (event) {
        if (!crop) return;

        dragging = { pointerId: event.pointerId, x: event.clientX - crop.x, y: event.clientY - crop.y };

        // Захват удерживает перетаскивание, даже если курсор ушёл за
        // рамку. Не для всякого указателя он доступен, и отказ в нём
        // не повод ронять само перетаскивание.
        try { cropFrame.setPointerCapture(event.pointerId); } catch (error) { /* обойдёмся */ }

        cropFrame.classList.add('is-dragging');
    });

    cropFrame.addEventListener('pointermove', function (event) {
        if (!dragging || !crop || event.pointerId !== dragging.pointerId) return;

        crop.x = event.clientX - dragging.x;
        crop.y = event.clientY - dragging.y;
        cropRender();
    });

    function endDrag(event) {
        if (!dragging || event.pointerId !== dragging.pointerId) return;

        dragging = null;
        cropFrame.classList.remove('is-dragging');
    }

    cropFrame.addEventListener('pointerup', endDrag);
    cropFrame.addEventListener('pointercancel', endDrag);

    // passive: false — иначе браузер не даст отменить прокрутку страницы
    cropFrame.addEventListener('wheel', function (event) {
        if (!crop) return;

        event.preventDefault();
        cropSetZoom(crop.zoom * (event.deltaY < 0 ? 1.12 : 1 / 1.12));
    }, { passive: false });

    cropZoom.addEventListener('input', function () {
        if (crop) cropSetZoom(Number(cropZoom.value));
    });

    /* --------------------------------------------------------
       Поле «фотография»
       -------------------------------------------------------- */

    /*
       Значение поля — путь к картинке. Он же показан в маленькой
       строке под превью: её можно править руками, чтобы поставить
       фото, уже лежащее на сайте, или ссылку со стороны.

       Файлы, загруженные за время работы диалога, убираются за
       собой: commit() чистит заменённое фото после сохранения,
       rollback() — загруженное зря, если форму закрыли.
    */
    function buildImageField(spec, value) {
        var initial = value || '';

        var path = el('input', {
            class: 'input input--path',
            type: 'text',
            value: initial,
            placeholder: 'images/dish.jpg'
        });

        var preview = el('div', { class: 'photo__frame' });
        var picker = el('input', { type: 'file', accept: 'image/*', hidden: true });

        var uploadBtn = el('button', { class: 'btn btn--small', type: 'button', text: 'Загрузить' });
        var cropBtn = el('button', { class: 'btn btn--small', type: 'button', text: 'Кадр' });
        var clearBtn = el('button', {
            class: 'btn btn--small btn--danger', type: 'button', text: 'Убрать'
        });

        var error = el('p', { class: 'field__error', hidden: true });

        // Загруженное в этом диалоге: если форму закроют, всё это мусор
        var uploaded = [];

        function refresh() {
            clear(preview);

            var url = path.value.trim();

            if (url) {
                preview.appendChild(el('img', {
                    src: photoUrl(url),
                    alt: '',
                    onerror: function (event) {
                        // Битая ссылка не должна выглядеть как «фото есть»
                        event.target.replaceWith(el('span', {
                            class: 'photo__empty', text: 'не открывается'
                        }));
                    }
                }));
            } else {
                preview.appendChild(el('span', { class: 'photo__empty', text: 'нет фото' }));
            }

            uploadBtn.textContent = url ? 'Заменить' : 'Загрузить';
            clearBtn.hidden = !url;

            /*
               Перекадрировать умеем только свои картинки. Чужой домен
               «пачкает» canvas, и выгрузить из него готовый файл
               браузер уже не даст — кнопка бы просто не сработала.
            */
            cropBtn.hidden = !url || /^https?:\/\//i.test(url);
        }

        function busy(state) {
            uploadBtn.disabled = state;
            cropBtn.disabled = state;
            clearBtn.disabled = state;
        }

        // Общий хвост: показать кадр, загрузить результат, подставить путь
        function reframe(source) {
            error.hidden = true;

            return openCropper(source).then(function (blob) {
                if (!blob) return;

                busy(true);

                return API.upload(blob)
                    .then(function (result) {
                        uploaded.push(result.url);
                        path.value = result.url;
                        refresh();
                    })
                    .catch(function (uploadError) { fail(uploadError.message); })
                    .then(function () { busy(false); });
            });
        }

        function fail(message) {
            error.textContent = message;
            error.hidden = false;
        }

        uploadBtn.addEventListener('click', function () { picker.click(); });

        picker.addEventListener('change', function () {
            var file = picker.files && picker.files[0];

            // Сброс: иначе повторный выбор того же файла не вызовет change
            picker.value = '';
            if (file) reframe(file);
        });

        // Кадр уже сохранённого фото: можно приблизить нужную часть,
        // не отыскивая исходный снимок заново
        cropBtn.addEventListener('click', function () {
            var url = path.value.trim();
            if (url) reframe(photoUrl(url));
        });

        clearBtn.addEventListener('click', function () {
            path.value = '';
            refresh();
        });

        path.addEventListener('change', refresh);

        var node = el('div', { class: 'field' }, [
            el('span', { class: 'field__label', text: spec.label || 'Фотография' }),

            el('div', { class: 'photo' }, [
                preview,
                el('div', { class: 'photo__side' }, [
                    el('div', { class: 'photo__actions' }, [uploadBtn, cropBtn, clearBtn]),
                    path,
                    el('span', {
                        class: 'field__hint',
                        text: 'Фото обрезается в квадрат — так же, как показывается на сайте'
                    })
                ])
            ]),

            picker,
            error
        ]);

        refresh();

        return {
            node: node,
            control: path,
            error: error,

            read: function () {
                var url = path.value.trim();
                return url === '' ? null : url;
            },

            // Форму сохранили: заменённое фото больше не нужно
            commit: function () {
                var kept = path.value.trim();

                if (initial && initial !== kept) removeUpload(initial);

                uploaded.forEach(function (url) {
                    if (url !== kept) removeUpload(url);
                });
            },

            // Форму закрыли: всё загруженное за это время — мусор
            rollback: function () {
                uploaded.forEach(removeUpload);
            }
        };
    }

    /*
       Удаляем молча. Сервер сам откажет, если фото ещё стоит
       у другого блюда, и это правильный исход, а не ошибка,
       о которой стоит сообщать.
    */
    function removeUpload(url) {
        if (!url || url.indexOf('images/uploads/') !== 0) return;
        API.deleteUpload(url).catch(function () { /* занято или уже удалено */ });
    }

    /*
       График работы филиала: семь строк «день — выходной — с — по».
       Отдельный тип поля, потому что это не одно значение, а таблица.
    */
    function buildHoursField(spec, value) {
        var byWeekday = {};
        (value || []).forEach(function (day) { byWeekday[day.weekday] = day; });

        var rows = WEEKDAYS.map(function (name, index) {
            var weekday = index + 1;
            var saved = byWeekday[weekday] || {};

            var opens = el('input', { class: 'input', type: 'time', value: saved.opens_at || '10:00' });
            var closes = el('input', { class: 'input', type: 'time', value: saved.closes_at || '23:00' });
            var off = el('input', { type: 'checkbox', checked: Boolean(saved.is_day_off) });

            var row = el('div', { class: 'hours__row' + (off.checked ? ' is-off' : '') }, [
                el('span', { class: 'hours__day', text: name }),
                opens,
                closes,
                el('label', { class: 'check' }, [off, el('span', { text: 'вых' })])
            ]);

            // В выходной поля времени гасим — их значения всё равно не уйдут
            off.addEventListener('change', function () {
                row.classList.toggle('is-off', off.checked);
            });

            return { weekday: weekday, row: row, opens: opens, closes: closes, off: off };
        });

        var node = el('div', { class: 'field' }, [
            el('span', { class: 'field__label', text: spec.label }),
            el('div', { class: 'hours' }, rows.map(function (item) { return item.row; }))
        ]);

        return {
            node: node,
            read: function () {
                return rows.map(function (item) {
                    return {
                        weekday: item.weekday,
                        is_day_off: item.off.checked,
                        opens_at: item.off.checked ? null : item.opens.value,
                        closes_at: item.off.checked ? null : item.closes.value
                    };
                });
            }
        };
    }

    /* --------------------------------------------------------
       Диалог
       -------------------------------------------------------- */

    var modal = document.getElementById('modal');
    var modalForm = document.getElementById('modalForm');
    var modalTitle = document.getElementById('modalTitle');
    var modalBody = document.getElementById('modalBody');
    var modalSubmit = document.getElementById('modalSubmit');
    var modalCancel = document.getElementById('modalCancel');

    var activeSubmit = null;

    /**
     * openForm({
     *   title, fields: [спецификации], values, submitLabel,
     *   onSubmit(values) -> Promise
     * })
     *
     * Диалог сам показывает ошибки валидации с сервера рядом с полями.
     */
    // Выбор конструктора по типу поля
    function makeField(spec, value) {
        if (spec.type === 'hours') return buildHoursField(spec, value);
        if (spec.type === 'image') return buildImageField(spec, value);
        return buildField(spec, value);
    }

    function openForm(config) {
        modalTitle.textContent = config.title;
        modalSubmit.textContent = config.submitLabel || 'Сохранить';
        modalSubmit.hidden = false;
        modalCancel.textContent = 'Отмена';

        clear(modalBody);

        var fields = {};
        var values = config.values || {};

        config.fields.forEach(function (spec) {
            // Пара полей в строку: { type: 'row', fields: [...] }
            if (spec.type === 'row') {
                var row = el('div', { class: 'row-2' });

                spec.fields.forEach(function (inner) {
                    var built = makeField(inner, values[inner.name]);

                    if (built.read) fields[inner.name] = built;
                    row.appendChild(built.node);
                });

                modalBody.appendChild(row);
                return;
            }

            var built = makeField(spec, values[spec.name]);

            if (built.read) fields[spec.name] = built;
            modalBody.appendChild(built.node);
        });

        /*
           Загруженные файлы надо убрать за собой в обоих исходах:
           после сохранения лишним оказывается заменённое фото,
           после закрытия формы — загруженное впустую.
        */
        var saved = false;

        function eachField(method) {
            Object.keys(fields).forEach(function (name) {
                if (fields[name][method]) fields[name][method]();
            });
        }

        modal.addEventListener('close', function () {
            if (!saved) eachField('rollback');
        }, { once: true });

        activeSubmit = function () {
            var payload = {};
            Object.keys(fields).forEach(function (name) { payload[name] = fields[name].read(); });

            clearFieldErrors(fields);
            modalSubmit.disabled = true;

            return Promise.resolve(config.onSubmit(payload))
                .then(function () {
                    saved = true;
                    eachField('commit');
                    modal.close();
                })
                .catch(function (error) {
                    showFieldErrors(fields, error);
                    toast(error.message, 'error');
                })
                .then(function () { modalSubmit.disabled = false; });
        };

        modal.showModal();
    }

    /**
     * Диалог только для чтения: произвольное содержимое, одна кнопка «Закрыть».
     */
    function openView(title, content) {
        modalTitle.textContent = title;
        modalSubmit.hidden = true;

        // Отменять в режиме просмотра нечего — единственная кнопка закрывает
        modalCancel.textContent = 'Закрыть';
        activeSubmit = null;

        clear(modalBody);
        [].concat(content).forEach(function (node) { if (node) modalBody.appendChild(node); });

        modal.showModal();
    }

    function clearFieldErrors(fields) {
        Object.keys(fields).forEach(function (name) {
            var field = fields[name];
            if (!field.error) return;

            field.error.hidden = true;
            field.control.classList.remove('is-invalid');
        });
    }

    // Раскладывает details от сервера ({ price: 'минимум 0' }) по полям
    function showFieldErrors(fields, error) {
        if (!error.details) return;

        Object.keys(error.details).forEach(function (name) {
            var field = fields[name];
            if (!field || !field.error) return;

            field.error.textContent = error.details[name];
            field.error.hidden = false;
            field.control.classList.add('is-invalid');
        });
    }

    modalForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (activeSubmit) activeSubmit();
    });

    document.getElementById('modalClose').addEventListener('click', function () { modal.close(); });
    document.getElementById('modalCancel').addEventListener('click', function () { modal.close(); });

    /* --------------------------------------------------------
       Подтверждение удаления
       -------------------------------------------------------- */

    // Удаление необратимо для человека, поэтому спрашиваем всегда
    function confirmAction(message) {
        return global.confirm(message);
    }

    global.UI = {
        el: el,
        clear: clear,
        money: money,
        photoUrl: photoUrl,
        toast: toast,
        table: table,
        openForm: openForm,
        openView: openView,
        confirmAction: confirmAction,
        WEEKDAYS: WEEKDAYS
    };
})(window);
