/* ============================================================
   Клиент API

   Всё общение с бэкендом идёт через этот модуль: одно место,
   где разбираются ошибки и ловится «сессия кончилась».

   Токена здесь нет намеренно — сессия живёт в HttpOnly-куке,
   которую JavaScript не видит и украсть не может.
   ============================================================ */
(function (global) {
    'use strict';

    var BASE = '/api';

    // Вызывается, когда сервер ответил 401: app.js показывает экран входа
    var onUnauthorized = null;

    /* --------------------------------------------------------
       Ошибка API
       -------------------------------------------------------- */

    function ApiError(status, code, message, details) {
        var error = new Error(message || 'Ошибка запроса');
        error.name = 'ApiError';
        error.status = status;
        error.code = code;
        error.details = details || null;
        return error;
    }

    /* --------------------------------------------------------
       Запрос
       -------------------------------------------------------- */

    function request(method, path, body) {
        var options = {
            method: method,

            // Кука сессии обязана уехать вместе с запросом
            credentials: 'same-origin',

            headers: {}
        };

        if (body !== undefined) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        return fetch(BASE + path, options).then(function (response) {
            // 204 — тела нет
            if (response.status === 204) return null;

            return response.json().catch(function () {
                // Сервер вернул не JSON — обычно это падение прокси или сети
                throw ApiError(response.status, 'bad_response', 'Сервер ответил неожиданно');
            }).then(function (data) {
                if (response.ok) return data;

                var payload = (data && data.error) || {};

                /*
                   401 на любом запросе значит одно: сессия кончилась или
                   её отозвали. Возвращаем пользователя на экран входа,
                   а не показываем «ошибка» посреди пустой таблицы.
                */
                if (response.status === 401 && onUnauthorized) onUnauthorized();

                throw ApiError(response.status, payload.code, payload.message, payload.details);
            });
        });
    }

    /* --------------------------------------------------------
       Загрузка файла

       Отправляем сами байты, без multipart: файл ровно один,
       и обёртка вокруг него ничего бы не добавила.
       -------------------------------------------------------- */

    function upload(blob) {
        return fetch(BASE + '/admin/uploads', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': blob.type || 'image/jpeg' },
            body: blob
        }).then(function (response) {
            return response.json().catch(function () {
                throw ApiError(response.status, 'bad_response', 'Сервер ответил неожиданно');
            }).then(function (data) {
                if (response.ok) return data;

                if (response.status === 401 && onUnauthorized) onUnauthorized();

                var payload = (data && data.error) || {};
                throw ApiError(response.status, payload.code, payload.message, payload.details);
            });
        });
    }

    /* --------------------------------------------------------
       Публичный интерфейс
       -------------------------------------------------------- */

    // Собирает строку запроса, пропуская пустые значения
    function query(params) {
        var parts = [];

        Object.keys(params || {}).forEach(function (key) {
            var value = params[key];
            if (value === null || value === undefined || value === '') return;
            parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
        });

        return parts.length ? '?' + parts.join('&') : '';
    }

    global.API = {
        setUnauthorizedHandler: function (handler) { onUnauthorized = handler; },
        query: query,

        get:    function (path) { return request('GET', path); },
        post:   function (path, body) { return request('POST', path, body || {}); },
        patch:  function (path, body) { return request('PATCH', path, body || {}); },
        remove: function (path) { return request('DELETE', path); },

        /* ---- Вход ---- */

        login:  function (username, password) {
            return request('POST', '/admin/auth/login', { username: username, password: password });
        },
        logout: function () { return request('POST', '/admin/auth/logout', {}); },
        me:     function () { return request('GET', '/admin/auth/me'); },

        /* ---- Справочники ---- */

        categories:     function () { return request('GET', '/admin/categories?with_counts=true'); },
        dishes:         function (params) { return request('GET', '/admin/dishes' + query(params)); },
        branches:       function () { return request('GET', '/admin/branches'); },
        settings:       function () { return request('GET', '/admin/settings'); },
        paymentMethods: function () { return request('GET', '/admin/payment-methods'); },

        /* ---- Фотографии ---- */

        upload: upload,

        // Удаляется только файл, загруженный из админки. Сервер откажет,
        // если фото ещё стоит у другого блюда или категории.
        deleteUpload: function (url) {
            return request('DELETE', '/admin/uploads/' + url.split('/').pop());
        }
    };
})(window);
