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

## Nasazení na Render.com

1. Propojte Render s vaším GitHub účtem a vyberte repozitář s touto aplikací.
2. Vytvořte novou **Web Service** a v průvodci vyplňte:
   - **Name**: libovolný název služby (např. `vse-web`).
   - **Region**: nejbližší region koncovým uživatelům (např. `Frankfurt (EU)`).
   - **Branch**: větev, kterou chcete nasazovat (typicky `main`).
   - **Root Directory**: ponechte prázdné nebo `.` (repozitář už obsahuje `package.json` v kořeni).
   - **Runtime**: **nezapomeňte vybrat `Node`**. Pokud by Render omylem nabídl Python runtime, přepište jej na Node – jinak se pokusí hledat soubor `requirements.txt` a build skončí chybou.
   - **Build Command**: `npm install`.
   - **Start Command**: `npm run start`.
3. V sekci **Environment Variables** doplňte potřebné proměnné, např. `JWT_SECRET`, `CHAT_API_URL` a `CHAT_API_TOKEN`.
4. V části **Instance Type** zvolte tarif podle potřeby (pro testování stačí `Free`).
5. Potvrďte tlačítkem **Create Web Service** – Render spustí build a aplikace bude dostupná na vygenerované URL.

### Automatické nastavení přes `render.yaml`

Pokud chcete mít konfiguraci Renderu zapsanou přímo v repozitáři, využijte soubor [`render.yaml`](render.yaml). Stačí jej nechat v kořeni repozitáře a při vytváření služby zvolit možnost **Use existing Render Blueprint**. Render poté načte:

- typ služby `web` s Node runtime,
- příkazy `npm install` a `npm run start`,
- výchozí proměnné prostředí, které můžete bezpečně doplnit v UI.

Tento blueprint také zabrání tomu, aby Render použil Python build se souborem `requirements.txt`.
