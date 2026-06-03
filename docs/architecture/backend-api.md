# Backend and API Architecture

## Общие принципы

- Все endpoint-ы работают под префиксом `/api`.
- Формат обмена: `JSON`.
- Сервер является источником истины для цены, статусов заказа и проверки бизнес-правил.
- Аутентификация строится на серверных сессиях и `httpOnly` cookie.
- Клиент и администратор используют общую таблицу пользователей, но разные endpoint-ы входа.

## Модульная структура backend

| Модуль | Зона ответственности |
| --- | --- |
| `auth` | регистрация клиента, вход клиента, вход администратора, выход, восстановление сессии |
| `catalog` | чтение активных товаров и карточек товара |
| `constructor` | выдача конфигурации конструктора и допустимых опций |
| `pricing` | расчёт цены, проверка обязательных параметров, округление и минимальный чек |
| `cart` | активная корзина пользователя, добавление и удаление элементов |
| `checkout` | создание заказа из корзины, фиксация согласий, запуск платёжного сценария |
| `payments` | mock-подтверждение оплаты и аудит результата |
| `orders` | чтение клиентом своих заказов и их деталей |
| `admin-orders` | чтение списка заказов, детальных данных и смена статусов администратором |
| `admin-catalog` | управление товарами, материалами и option values конструктора |
| `admin-constructor` | управление типами, вариантами, слотами, камнями и связями камней |
| `admin-assets` | управление ассетами и загрузка product/preview изображений |
| `notifications` | генерация email-событий и журнал отправок |
| `i18n` | выбор локали ответа для словарных данных |

## Формат ответа

### Успешный ответ

```json
{
  "success": true,
  "data": {}
}
```

### Ошибка

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Auth API

### `POST /api/auth/register`

Создаёт клиента и открывает сессию.

Тело запроса:

```json
{
  "full_name": "Дарина Гирка",
  "email": "user@example.com",
  "password": "secret123",
  "phone": "+380..."
}
```

Правила:

- `email` уникален;
- `password` хранится только в виде хэша;
- создаётся пользователь с ролью `client`;
- по умолчанию локаль берётся из запроса или выставляется `uk`.

### `POST /api/auth/login`

Логин клиента по email и паролю.

### `POST /api/auth/logout`

Завершает текущую сессию.

### `POST /api/admin/login`

Логин администратора. Запрос совпадает по форме с клиентским логином, но дополнительно требует роль `admin`.

## Catalog API

### `GET /api/catalog/products`

Возвращает только активные товары.

Query-параметры MVP:

- `page`
- `limit`
- `jewelry_type`

Полезная нагрузка элемента:

```json
{
  "id": 101,
  "slug": "silver-heart-necklace",
  "name": "Серебряное сердце",
  "price": 1299.00,
  "currency": "UAH",
  "thumbnail_url": "/assets/images/products/101-main.jpg",
  "is_active": true
}
```

### `GET /api/catalog/products/:id`

Возвращает карточку одного активного товара. Неактивный товар для клиентской зоны должен возвращать `404`.

## Constructor API

### `GET /api/constructor/config`

Возвращает:

- список типов украшений;
- список доступных опций для каждого типа;
- значения опций;
- preview-конфиг для layered rendering.

Минимальная форма ответа:

```json
{
  "jewelry_types": [],
  "options": [],
  "values": []
}
```

### `POST /api/constructor/price`

Проверяет конфигурацию и считает цену.

Тело запроса:

```json
{
  "jewelry_type_id": 1,
  "configuration": {
    "material": "silver",
    "length": "45",
    "stone": "opal",
    "engraving_text": "Love"
  }
}
```

Ответ:

```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "missing_required": [],
    "price": 1599.00,
    "currency": "UAH",
    "preview_layers": []
  }
}
```

## Cart API

### `GET /api/cart`

Возвращает активную корзину пользователя. Если корзины нет, сервер создаёт пустую `active` корзину на лету.

### `POST /api/cart/items`

Добавляет элемент в корзину.

Поддерживаемые формы:

```json
{
  "item_type": "ready_product",
  "product_id": 101,
  "quantity": 1
}
```

```json
{
  "item_type": "custom_design",
  "jewelry_type_id": 1,
  "configuration": {
    "material": "silver",
    "length": "45"
  }
}
```

Правила:

- для `ready_product` товар должен быть активным;
- для `custom_design` сервер пересчитывает цену и проверяет обязательные поля;
- заказ с кастомным товаром нельзя добавить, если нарушены `BRL-01`, `BRL-02`, `BRL-07`, `BRL-12`.

### `PATCH /api/cart/items/:id`

- для `ready_product` можно менять `quantity`;
- для `custom_design` можно заменить `configuration`, если сервер подтвердил валидность;
- количество должно быть `>= 1`.

### `DELETE /api/cart/items/:id`

Удаляет позицию корзины.

## Checkout API

### `POST /api/checkout`

Создаёт заказ из активной корзины.

Тело запроса:

```json
{
  "customer_name": "Дарина Гирка",
  "email": "user@example.com",
  "phone": "+380...",
  "delivery_method": "nova_poshta",
  "delivery_address": "Харьков, отделение 1",
  "accepted_offer": true,
  "accepted_return_policy": true
}
```

Поведение:

- корзина должна быть непустой;
- общая сумма должна быть `>= 500`;
- оба чекбокса обязательны;
- создаётся заказ со статусом `created_pending_payment`;
- фиксируется состав корзины и ценовые снимки в `order_items`;
- возвращается `order_id`, `order_number`, `amount`, `payment_token`.

## Payments API

### `POST /api/payments/mock/confirm`

Подтверждает mock-оплату и переводит заказ в `confirmed`.

Тело запроса:

```json
{
  "order_id": 501,
  "payment_token": "mock-token",
  "payment_result": "success"
}
```

Поведение:

- создаётся запись в `payments`;
- при успехе заказ становится `confirmed`;
- в историю статусов добавляется запись;
- отправляется email об успешном подтверждении заказа.

## Orders API

### `GET /api/orders/me`

Возвращает список заказов текущего клиента.

Поле `overdue` в ответе вычисляется сервером и показывается только для заказов в `in_progress`.

### `GET /api/orders/:id`

Возвращает детали заказа только владельцу заказа.

В ответ входят:

- шапка заказа;
- состав позиций;
- история статусов;
- информация об оплате;
- вычисляемый флаг `overdue`.

## Admin Orders API

### `GET /api/admin/orders`

Возвращает список заказов для администратора.

Query-параметры MVP:

- `status`
- `page`
- `limit`

### `GET /api/admin/orders/:id`

Возвращает полные детали заказа с составом, контактами клиента, историей статусов, оплатой и журналом уведомлений.

### `PATCH /api/admin/orders/:id/status`

Тело запроса:

```json
{
  "next_status": "in_progress"
}
```

Правила:

- доступно только для роли `admin`;
- следующий статус обязан быть строго следующим по цепочке;
- переход `confirmed -> completed` запрещён;
- после изменения статуса создаётся запись в `order_status_history`;
- после изменения статуса отправляется email;
- если email не отправился, статус всё равно сохраняется, а ошибка логируется.

## Бизнес-правила, которые сервер обязан enforce

| Код | Правило | Где проверяется |
| --- | --- | --- |
| `BRL-01` | Только активные элементы конструктора | `constructor`, `pricing`, `cart` |
| `BRL-02` | Длина только из фиксированного списка | `pricing` |
| `BRL-03` | Минимальный чек `500 грн` | `checkout` |
| `BRL-05` | Уникальный номер заказа при создании | `checkout` |
| `BRL-07` | Запрет на добавление неполной конфигурации в корзину | `pricing`, `cart` |
| `BRL-08` | Нужен checkbox условий возврата | `checkout` |
| `BRL-10` | Email после смены статуса | `notifications` |
| `BRL-12` | Округление до `0.01 грн` | `pricing`, `checkout` |
| `BRL-13` | Только активные товары в витрине | `catalog` |
| `BRL-14` | Последовательная смена статусов | `admin-orders` |
| `BRL-17` | Производство только после полной оплаты | `payments`, `admin-orders` |
| `BRL-18` | Нужен checkbox оферты | `checkout` |

## Статусная модель заказа

```text
created_pending_payment -> confirmed -> in_progress -> completed
```

Дополнительные правила:

- заказ нельзя перевести в `in_progress`, если нет успешной оплаты;
- дата перехода в `in_progress` фиксируется отдельно для вычисления `overdue`;
- отмена не включается в MVP, потому что в исходных правилах она ограничена отдельной процедурой.

## Безопасность

- пароли хэшируются с `bcrypt` или эквивалентом;
- сессионный cookie помечается `httpOnly`, `sameSite`, `secure` в production;
- административные endpoint-ы прикрываются role guard;
- все ID из клиентских запросов перепроверяются на принадлежность пользователю;
- сырые ошибки базы не раскрываются наружу.

## Логирование

Нужно логировать:

- входы и выходы пользователей;
- ошибки валидации checkout;
- переходы статусов заказа;
- вызовы mock payment;
- ошибки email-уведомлений;
- попытки доступа в чужой заказ или админские endpoint-ы без роли.

## Admin Catalog API

Все endpoint-ы ниже доступны только роли `admin`.

- `GET /api/admin/catalog/jewelry-types` - список типов украшений для форм.
- `GET /api/admin/catalog/products` - список товаров.
- `POST /api/admin/catalog/products` - создание товара.
- `PATCH /api/admin/catalog/products/:productId` - обновление товара.
- `DELETE /api/admin/catalog/products/:productId` - деактивация товара.
- `POST /api/admin/catalog/uploads/product-image` - загрузка изображения товара.
- `GET /api/admin/catalog/materials` - список материалов.
- `POST /api/admin/catalog/materials` - создание материала.
- `PATCH /api/admin/catalog/materials/:materialId` - обновление материала.
- `DELETE /api/admin/catalog/materials/:materialId` - деактивация материала.
- `GET /api/admin/catalog/constructor` - admin-представление старой модели option values.
- `POST /api/admin/catalog/constructor/values` - создание option value.
- `PATCH /api/admin/catalog/constructor/values/:valueId` - обновление option value.
- `DELETE /api/admin/catalog/constructor/values/:valueId` - деактивация option value.
- `PATCH /api/admin/catalog/constructor/layouts` - обновление preview layout metadata.

## Admin Constructor API

- `GET /api/admin/constructor` - полный studio config.
- `POST /api/admin/constructor/types` - создание типа украшения.
- `PATCH /api/admin/constructor/types/:typeId` - обновление типа.
- `DELETE /api/admin/constructor/types/:typeId` - деактивация типа.
- `POST /api/admin/constructor/variants` - создание варианта.
- `PATCH /api/admin/constructor/variants/:variantId` - обновление варианта.
- `DELETE /api/admin/constructor/variants/:variantId` - деактивация варианта.
- `POST /api/admin/constructor/slots` - создание слота камня.
- `PATCH /api/admin/constructor/slots/:slotId` - обновление слота.
- `DELETE /api/admin/constructor/slots/:slotId` - деактивация слота.
- `POST /api/admin/constructor/stones` - создание камня.
- `PATCH /api/admin/constructor/stones/:stoneId` - обновление камня.
- `DELETE /api/admin/constructor/stones/:stoneId` - деактивация камня.
- `PATCH /api/admin/constructor/variant-stones` - обновление матрицы доступности камней.
- `DELETE /api/admin/constructor/variant-stones/:variantId/:stoneId` - отключение камня для варианта.

## Admin Assets API

- `GET /api/admin/assets` - список ассетов.
- `POST /api/admin/assets` - создание записи ассета.
- `POST /api/admin/assets/upload` - загрузка ассета.
- `DELETE /api/admin/assets/:assetId` - удаление ассета.
