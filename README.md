# vse-web

Kompletní ukázková aplikace s registrací, přihlášením a chatovacím botem připraveným na napojení na externí API.

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

Pro snadnější vývoj můžete použít automatický restart serveru:

```bash
npm run dev
```

## Konfigurace

Konfiguraci lze řídit pomocí souboru `.env` (volitelný). Dostupné proměnné:

- `PORT` – port, na kterém má server poslouchat (výchozí 3000)
- `JWT_SECRET` – tajný klíč pro podepisování autentizačních tokenů
- `CHAT_API_URL` – URL externího chatovacího API (volitelné)
- `CHAT_API_TOKEN` – token, který se odešle v hlavičce `Authorization` při volání externího API (volitelné)

Příklad souboru `.env`:

```
PORT=3000
JWT_SECRET=super-tajne-heslo
CHAT_API_URL=https://moje-api.cz/chat
CHAT_API_TOKEN=abc123
```

Pokud `CHAT_API_URL` není nastavená, aplikace použije jednoduchého demonstračního bota, který odpovídá lokálně.

## Struktura

- `server.js` – hlavní Express server, obsluhuje API a statické soubory
- `db.js` – inicializace SQLite databáze (uživatelé a historie chatu)
- `auth.js` – pomocné funkce pro práci s JWT tokenem a middleware pro autorizaci
- `chatService.js` – logika pro získávání odpovědí bota (lokální fallback + volání externí služby)
- `public/` – statická SPA s registrací, přihlášením a chatovacím rozhraním
- `logger.js` – konfigurace logování (soubor `logs/app.log`)

## Funkce

- Registrace uživatelů včetně logování událostí
- Přihlášení a odhlášení (HTTP-only cookie s JWT)
- Ověření aktuální relace přes `/api/me`
- Uložení a načtení historie chatu pro každého uživatele
- Připravený endpoint `/api/chat` pro napojení na vlastní AI/chat API

## Testovací scénář

1. Spusťte `npm install && npm run start`
2. Otevřete http://localhost:3000
3. Zaregistrujte se novým e-mailem
4. Začněte komunikovat s botem

## Poznámky

- Databáze SQLite se ukládá do adresáře `data/`
- Logy se nacházejí v `logs/app.log`
- V produkčním prostředí nezapomeňte nastavit silný `JWT_SECRET` a používat HTTPS
