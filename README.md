# SchoolSwap

Школьный маркетплейс Braemar College: объявления с фото, поиск и категории, мессенджер в реальном времени, School News в стиле газеты.

**Стек:** React 18 + Vite + TypeScript · React Router · TanStack Query · Supabase (Postgres, Auth, Storage, Realtime) · хостинг Vercel.

## Как устроено

```
Браузер (React SPA на Vercel)
   │  supabase-js: REST + WebSocket
   ▼
Supabase
 ├─ Auth       регистрация/вход, пароли bcrypt, сессия сохраняется в браузере
 ├─ Postgres   profiles, listings, conversations, messages, articles
 │             правила доступа (RLS) в базе: supabase/migrations/*.sql
 ├─ Storage    бакет photos: читать могут все, писать — только в свою папку
 └─ Realtime   изменения таблиц мгновенно приходят всем открытым вкладкам
```

- Переписку видят только её два участника (RLS + Realtime тоже фильтрует по RLS).
- Редактировать/удалять объявление может только продавец; новости — только `role = 'admin'`.
- Роль нельзя поменять с фронтенда: админа назначает только SQL (`supabase/seed.sql`).
- Фото с телефона сжимаются в браузере до 1600 px JPEG перед загрузкой.
- Если сеть блокирует WebSocket, данные всё равно обновляются фоновой проверкой раз в 30 секунд.

### Структура кода

```
src/
  config.ts             название школы, команда, валюта — менять тут
  lib/                  supabase-клиент, константы, форматирование, сжатие фото
  api/                  запросы и хуки React Query: listings, messages, news, storage, realtime
  auth/AuthProvider.tsx сессия, профиль, signUp/signIn/signOut
  components/ui/        Button, Field, Photo, Icon, Avatar, EmptyState, Toast/Confirm
  components/layout/    Header, TabBar, Footer, Intro, AppLayout, RequireAuth
  components/market/    ListingCard, PhotoPicker, useListingActions
  components/news/      NewsShell, Masthead, Story
  pages/                Landing, Auth, Market, ListingPage, SellPage, MyListings, Messages, News, ArticlePage, ArticleEditor
  styles/               tokens.css (цвета/шрифты) → base → ui → layout → страницы
supabase/migrations/    схема БД и правила доступа
supabase/seed.sql       админ School Office + демо-ученики, объявления и DEMO-новости
```

## Запуск в продакшене (≈30 минут)

### 1. Supabase

1. Создай проект на [supabase.com](https://supabase.com), регион поближе к школе (например, Frankfurt).
2. **SQL Editor** → вставь содержимое `supabase/migrations/20261014000000_init.sql` → **Run**.
   (Или через CLI: `npx supabase link --project-ref <ref> && npx supabase db push`.)
3. **Authentication → Sign In / Providers → Email**: выключи **Confirm email**. Минимальная длина пароля — 8.
4. **Authentication → Rate Limits**: подними лимит регистраций и входов. В школе все сидят за одним IP, а по умолчанию лимит — 30 запросов за 5 минут.
5. **Authentication → URL Configuration → Site URL**: адрес сайта, например `https://schoolswap.site`.

### 2. Аккаунт администратора и демо-данные

1. Открой `supabase/seed.sql` и в начале блока `do $$` впиши `admin_email`, `admin_password` и `demo_password`.
   **Не коммить файл с настоящими паролями.**
2. **SQL Editor → New query** → вставь файл целиком → **Run**.

Скрипт создаёт админа **School Office**, 4 демо-учеников (`*.demo@example.com`), 10 демо-объявлений и 8 новостей с пометкой DEMO.
Запускать можно повторно: пароли обновятся, демо-данные пересоздадутся.

### 3. Vercel

1. Залей репозиторий на GitHub.
2. [vercel.com](https://vercel.com) → **Add New → Project** → выбери репозиторий (Vite определится сам).
3. **Environment Variables**: `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` (Project Settings → API Keys → Publishable key).
   Секретный ключ (secret / service_role) сайту не нужен — никуда его не вставляй.
4. **Deploy.** `vercel.json` уже перенаправляет все пути на SPA.

### 4. Домен и HTTPS

1. Купи домен (например, `schoolswap.site`) у Porkbun, Namecheap или Cloudflare.
2. Vercel → проект → **Settings → Domains → Add** → впиши домен.
3. У регистратора добавь DNS-записи, которые покажет Vercel (обычно `A @ 76.76.21.21` и `CNAME www cname.vercel-dns.com`).
4. HTTPS-сертификат Vercel выпустит автоматически. Запасной адрес на время ожидания DNS — `<project>.vercel.app`.

## Локальная разработка

```bash
npm install
npx supabase start          # Supabase в Docker; применяет миграции
cp .env.example .env.local  # вставь API_URL и ANON_KEY из вывода supabase start
# демо-данные: впиши пароли в копию supabase/seed.sql и выполни её через psql
npm run dev                 # http://localhost:5173
```

Проверки: `npm run typecheck`, `npm run lint`, `npm run build`.

## Чек-лист перед презентацией

- [ ] Сайт открывается по домену с телефона **на школьном Wi-Fi** и на мобильном интернете.
- [ ] Два телефона: регистрация → объявление с фото → второй находит его через поиск → **Message seller** → продавец мгновенно видит сообщение и отвечает.
- [ ] Выход и повторный вход: аккаунт, объявления и переписка на месте.
- [ ] Админ School Office публикует новость с флажком «important notice».
- [ ] Имена команды в `src/config.ts` актуальны.

## Убрать демо-данные после презентации

```sql
delete from public.articles where is_demo;
delete from auth.users where email like '%.demo@example.com';  -- удалит демо-учеников и их объявления
```
