# GitHub Releases Subscription Service

Монолітний сервіс, що дозволяє підписуватись на email-сповіщення про нові релізи GitHub-репозиторіїв.

## Що реалізовано

- REST API + Swagger UI (`/docs`) для керування підписками.
- HTML-сторінка підписки (`/`) для ручної перевірки роботи API.
- Валідація репозиторію через GitHub API у форматі `owner/repo`.
- Зберігання даних у PostgreSQL.
- Міграції БД під час старту сервісу.
- Scanner в межах цього ж сервісу, який періодично перевіряє нові релізи.
- Notifier в межах цього ж сервісу, який відправляє email при новому релізі.
- Обробка `429 Too Many Requests` від GitHub API.
- `last_seen_tag` зберігається для кожного репозиторію.
- Unit-тести бізнес-логіки.

## Extra features

- Redis-кешування GitHub API (TTL 10 хв).
- API key auth (заголовок `x-api-key`) для API ендпоїнтів.
- Prometheus-метрики (`/metrics`).
- GitHub Actions CI (`lint + test`).

## Запуск локально

1. Скопіюй файл середовища:

```bash
cp .env.example .env
```

2. Встанови залежності:

```bash
npm install
```

3. Запусти інфраструктуру:

```bash
docker compose up -d db redis mailhog
```

4. Запусти сервіс:

```bash
npm start
```

Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)

MailHog UI: [http://localhost:8025](http://localhost:8025)
HTML сторінка: [http://localhost:3000/](http://localhost:3000/)

## Повний запуск у Docker

```bash
docker compose up --build
```

## Тести

```bash
npm test
```

## Важливо щодо контракту Swagger

У проєкті є `swagger.yaml`. Якщо в тебе є окремий, вже затверджений контракт (з конкретними шляхами/схемами), підстав його без зміни логіки сервісу.
