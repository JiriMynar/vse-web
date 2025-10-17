# VŠE Studio

Kompletní ukázková aplikace s modulárním workspace rozhraním, které kombinuje chat a správu projektů připravené na napojení na externí API.

## Požadavky

- Node.js 18+
- npm

## Instalace

```bash
npm install
```

## Vývoj a spuštění

```bash
npm run start
```

Server se spustí na adrese http://localhost:3000 a zároveň bude k dispozici API pod `/api/*`.

Pro snadnější vývoj můžete využít vestavěný watcher Node.js, který je dostupný přes skript `npm run dev` (vyžaduje Node.js 18+):

```bash
npm run dev
```

## Konfigurace

Konfiguraci lze řídit pomocí souboru `.env` (volitelný). Dostupné proměnné:

- `PORT` – port, na kterém má server poslouchat (výchozí 3000)
- `JWT_SECRET` – tajný klíč pro podepisování autentizačních tokenů (pokud není nastaven, aplikace si vygeneruje bezpečný
  klíč a uloží ho do `data/jwt_secret`)
- `CHAT_API_URL` – URL externího chatovacího API (volitelné)
- `CHAT_API_TOKEN` – token, který se odešle v hlavičce `Authorization` při volání externího API (volitelné)

- `LOG_DIR` – cesta k adresáři pro logy aplikace (doporučeno nastavit na stejný trvalý disk jako `DATA_DIR`)

Příklad souboru `.env`:

```
PORT=3000
JWT_SECRET=super-tajne-heslo
CHAT_API_URL=https://moje-api.cz/chat
CHAT_API_TOKEN=abc123
```

Pokud `CHAT_API_URL` není nastavená, aplikace použije jednoduchého demonstračního bota, který odpovídá lokálně.

## Struktura

- `server.js` – vstupní bod, který startuje aplikaci ve složce `src/`
- `src/app.js` – Express aplikace s bezpečnostními middleware a registrací routerů
- `src/routes/` – REST API rozdělené na domény (auth, chat, projekty, help, health)
- `src/services/` – obchodní logika, včetně orchestrace vláken chatu a projektů
- `src/lib/eventBus.js` – jednoduchý event bus pro realtime notifikace (SSE)
- `db.js` – inicializace SQLite databáze a migrace (uživatelé, chat, projekty, refresh tokeny)
- `auth.js` – práce s JWT a refresh tokeny, nastavení cookies
- `chatService.js` – logika pro získávání odpovědí bota (lokální fallback + volání externí služby)
- `public/` – modulární SPA workspace s chatem, projekty a integrovanou nápovědou
- `docs/help.json` – obsah centra nápovědy zobrazovaný přímo v aplikaci
- `logger.js` – konfigurace logování (soubor `logs/app.log`)

## Funkce

- Registrace, přihlášení a automatické obnovování relace (access + refresh tokeny)
- Realtime synchronizace vláken a zpráv přes Server-Sent Events (bez nutnosti pollingu)
- Workspace s přepínáním mezi moduly Chat, Projekty, Agentkit a Nápověda
- Správa projektů včetně archivace a základních metrik
- Kompletní help centrum s popisem pracovních postupů přímo v aplikaci
- Administrátorské rozhraní pro správu účtů (reset hesla, přidělení role, hromadné vymazání)

## Správa administrátora


- Administrátor může pomocí `PATCH /api/admin/users/:id/role` přepínat role mezi `user` a `admin`.
- Požadavkem `POST /api/admin/users/reset` lze vymazat všechny účty a související data (kromě aktuálně přihlášeného administrátora).
- Všichni uživatelé musí po resetu databáze znovu projít registrací a přihlášením.



## Testovací scénář

1. Spusťte `npm install && npm run start`
2. Otevřete http://localhost:3000
3. Zaregistrujte se nebo přihlaste
4. Projděte hlavní moduly (Chat, Projekty, Agentkit) a vyzkoušejte realtime konverzaci s botem

## Poznámky


- Logy se nacházejí v `logs/app.log` (nebo v `/tmp/vse-web/logs/app.log`)
- Na hostingu s ephemerním souborovým systémem (Render, Railway apod.) přidejte Persistent Disk a přesměrujte proměnné `DATA_DIR`
  a `LOG_DIR` na připojenou cestu (např. `/var/data` nebo `/data` podle zvoleného mount pathu); pouze tak zůstane databáze
  zachovaná mezi deployi. Pokud potřebujete podrobný návod krok za krokem pro Render, podívejte se na dokument
  [`docs/render-persistent-disk-setup.md`](docs/render-persistent-disk-setup.md).
- V produkčním prostředí nezapomeňte nastavit silný `JWT_SECRET` a používat HTTPS
