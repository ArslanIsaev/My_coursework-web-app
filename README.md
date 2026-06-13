# SportShop — Интернет-магазин спортивных товаров

Учебный курсовой проект: Next.js + Go + JSON-хранилище, развёртывание в Docker.

## Стек

| Слой       | Технология                              |
|------------|-----------------------------------------|
| Frontend   | Next.js 14, React, TypeScript, Tailwind |
| Backend    | Go 1.22, stdlib (net/http)              |
| Хранение   | JSON-файл (db.json)                     |
| Прокси     | Nginx                                   |
| Деплой     | Docker Compose                          |

## Структура проекта

```
sportshop/
├── backend/           # Go API
│   ├── cmd/server/    # точка входа
│   └── internal/
│       ├── handlers/  # HTTP-обработчики
│       ├── middleware/ # JWT, CORS
│       ├── models/    # типы данных
│       └── storage/   # JSON-хранилище
├── frontend/          # Next.js приложение
│   └── src/
│       ├── app/       # страницы (App Router)
│       ├── components/
│       └── lib/       # API-клиент, store
├── docker-compose.yml
├── nginx.conf
└── deploy.sh          # скрипт деплоя
```

## Роли и возможности

**Покупатель**
- Просмотр каталога с фильтрацией по категориям и поиском
- Страница товара с выбором количества
- Корзина (добавление, изменение, удаление)
- Оформление заказа (форма доставки)
- Личный кабинет: история заказов, редактирование профиля

**Администратор**
- Дашборд со статистикой (заказы, выручка, товары, пользователи)
- Управление заказами (изменение статусов)
- CRUD товаров и категорий
- Список пользователей

## API (бекэнд на :8080)

```
POST /api/auth/register     — регистрация
POST /api/auth/login        — вход
GET  /api/auth/me           — профиль (auth)
PUT  /api/auth/me           — обновить профиль (auth)

GET  /api/categories        — список категорий
POST /api/categories        — создать (admin)
PUT  /api/categories/:id    — обновить (admin)
DEL  /api/categories/:id    — удалить (admin)

GET  /api/products          — каталог (?category_id=&search=&page=&limit=)
GET  /api/products/:id      — товар
POST /api/products          — создать (admin)
PUT  /api/products/:id      — обновить (admin)
DEL  /api/products/:id      — удалить (admin)

GET  /api/cart              — корзина (auth)
POST /api/cart              — добавить товар (auth)
PUT  /api/cart/:id          — изменить количество (auth)
DEL  /api/cart/:id          — убрать товар (auth)

GET  /api/orders            — мои заказы (auth)
POST /api/orders            — оформить заказ (auth)
GET  /api/orders/:id        — заказ (auth)

GET  /api/admin/stats       — статистика (admin)
GET  /api/admin/orders      — все заказы (admin)
PATCH /api/admin/orders/:id/status — статус заказа (admin)
GET  /api/admin/users       — пользователи (admin)
DEL  /api/admin/users/:id   — удалить пользователя (admin)
```

## Локальный запуск (Docker)

```bash
cp .env.example .env
# Отредактируй .env при необходимости

docker compose up --build
```

Сайт: http://localhost  
Администратор по умолчанию: `admin@sportshop.ru` / `Admin123!`

## Деплой на сервер (macOS M3 → Ubuntu)

```bash
# Убедись что docker buildx работает
docker buildx ls

# Задай IP сервера и (опционально) URL API
export NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP/api

# Запусти деплой
./deploy.sh YOUR_SERVER_IP root
```

Скрипт:
1. Собирает образы с таргетом `linux/amd64` (совместимо с Ubuntu x86_64)
2. Сжимает и копирует их на сервер по SSH
3. Загружает образы и поднимает `docker compose up -d`

## Переменные окружения

| Переменная           | По умолчанию              | Описание              |
|----------------------|---------------------------|-----------------------|
| `JWT_SECRET`         | `changeme_in_production`  | Секрет для JWT        |
| `ADMIN_EMAIL`        | `admin@sportshop.ru`      | Email администратора  |
| `ADMIN_PASSWORD`     | `Admin123!`               | Пароль администратора |
| `NEXT_PUBLIC_API_URL`| `http://localhost/api`    | URL API для фронта    |

## Данные

Все данные хранятся в `/app/data/db.json` внутри контейнера бекэнда.  
Для персистентности используется Docker volume `backend_data`.

При первом запуске автоматически создаются:
- Аккаунт администратора
- 4 категории (Бег, Фитнес, Велоспорт, Плавание)
- 8 товаров-примеров
