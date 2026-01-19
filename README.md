# FestFlow

Local-first event ordering system (waiter / kitchen / bar / admin) designed to run on a small box + local WiFi.

## Dev

```sh
pnpm install
cp apps/server/.env.example apps/server/.env
pnpm db:setup
pnpm dev
```

Open `http://localhost:3000`.

## Default demo users (seed)

- Waiter: `Mia` / `1111`
- Waiter: `Noah` / `2222`
- Kitchen: `Kitchen` / `3333`
- Bar: `Bar` / `4444`
- Admin: `Admin` / `0000`

## Prod

```sh
pnpm install
pnpm build
pnpm start
```
