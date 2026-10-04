/* ============================================================
   ISAstaurant — общие данные для обеих страниц

   Филиалы нужны и стартовой панели, и шапке меню, поэтому список
   живёт здесь: иначе пришлось бы держать две копии и следить,
   чтобы они не разъехались.

   Контакты тоже здесь — номер один и тот же для звонка и WhatsApp.
   ============================================================ */
(function (global) {
    'use strict';

    // Чтобы добавить филиал — один объект в массив, больше нигде править не нужно
    global.ISA_BRANCHES = [
        {
            id: 'almaty-kabenova-16',
            name: {
                ru: 'Алматы, улица Кабенова 16',
                en: 'Almaty, Kabenova street 16'
            }
        },
        {
            id: 'almaty-kaldarov-17',
            name: {
                ru: 'Алматы, улица Калдаров 17',
                en: 'Almaty, Kaldarov street 17'
            }
        }
    ];

    var SUPPORT_DIGITS = '77074200599';

    global.ISA_CONTACTS = {
        // Как показываем человеку
        phone: '+7 707 420 0599',
        // tel: и wa.me требуют номер без пробелов и плюса
        phoneHref: 'tel:+' + SUPPORT_DIGITS,
        whatsappHref: 'https://wa.me/' + SUPPORT_DIGITS,
        instagram: 'https://www.instagram.com/bubetaika/'
    };
})(window);
