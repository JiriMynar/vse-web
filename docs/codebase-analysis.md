# Technická analýza kódu aplikace VŠE Studio

## Vstupní body a start serveru
- `server.js` je minimalistický spouštěcí skript, který pouze importuje funkci `startServer` ze složky `src` a ihned ji spouští. 【F:server.js†L1-L4】
- `src/server.js` provádí načtení proměnných z `.env`, vytvoření HTTP serveru nad Express aplikací a spouští inicializační úlohy (např. vytvoření administrátorského účtu). 【F:src/server.js†L1-L22】
- Při startu se port bere z `process.env.PORT` nebo padá na 3000, což usnadňuje nasazení na platformách typu Render. 【F:src/server.js†L11-L19】

## Express aplikace a middleware
- `src/app.js` sestavuje Express aplikaci, přidává bezpečnostní middleware (`helmet`, rate limiting), CORS a JSON parser s limitem 1 MB. 【F:src/app.js†L1-L33】
- Statický obsah se obsluhuje z adresáře `public`, poté se registrují aplikační routery a nakonec vlastní obsluha chyb. 【F:src/app.js†L34-L40】

## Registrace tras a kontrolery
- Funkce `registerRoutes` slučuje doménové routery pod prefix `/api`, včetně health-check endpointu. 【F:src/routes/index.js†L1-L24】
- Samostatné routery pokrývají autentizaci, chat, projekty, help centrum, administraci i uživatelské operace. 【F:src/routes/index.js†L4-L22】
- Kontrolery (např. `authController`) slouží jako tenká vrstva nad servisní logikou a standardizují odpovědi nebo práci s cookies. 【F:src/controllers/authController.js†L1-L41】

## Datová vrstva a migrace
- `db.js` vytváří (případně migruje) SQLite databázi v adresáři zajištěném funkcí `ensureWritableDir`, která preferuje trvalý disk (`DATA_DIR`) a jinak používá bezpečné fallbacky. 【F:db.js†L1-L100】【F:pathUtils.js†L14-L111】
- Migrační skripty definují tabulky pro uživatele, chat, projekty i refresh tokeny a postupně se aplikují podle `PRAGMA user_version`. 【F:db.js†L18-L123】【F:db.js†L206-L239】

## Autentizace a správa relací
- Modul `auth.js` řeší JWT tokeny, uložení tajného klíče na disk a práci s refresh tokeny, včetně rotace a logování bezpečnostních událostí. 【F:auth.js†L1-L123】
- Servis `authService` zodpovídá za registraci, přihlášení, obnovu relace i normalizaci uživatelských dat; používá `zod` pro validaci vstupů a `bcryptjs` pro hashování hesel. 【F:src/services/authService.js†L1-L110】
- API nastavuje HTTP-only cookies pro access i refresh tokeny a korektně je odstraňuje při odhlášení. 【F:auth.js†L81-L123】

## Doménové služby
- Chat využívá externí API (OpenAI, AI Foundry) s robustním parsováním odpovědí a lokálními fallbacky, aby se zabránilo pádu při nečekaném formátu odpovědi. 【F:chatService.js†L1-L119】
- Admin služba automaticky vytváří nebo povyšuje administrátorský účet, chrání před nebezpečnými operacemi (odebrání vlastní role, mazání jiných adminů) a loguje zásahy. 【F:src/services/adminService.js†L12-L118】
- Ostatní služby (`projectService`, `userService`, `helpService`, `chatApiService`) dělí logiku na spravovatelné celky a sdílí přístup k databázi pomocí `getDb()`.

## Události a realtime kanály
- `src/lib/eventBus.js` implementuje jednoduchý publish/subscribe mechanismus pro server-sent events, který se využívá v chatové části a u projektů. (viz soubor pro detailní implementaci).

## Veřejné rozhraní a dokumentace
- Složka `public/` obsahuje single-page aplikaci s moduly Chat, Projekty, Agentkit a Nápověda; obsah nápovědy je ukládán v `docs/help.json`, takže jej lze verzovat a lokalizovat. 【F:docs/help.json†L1-L120】
- Repozitář doplňují podrobné průvodce pro nasazení na Renderu, včetně řešení perzistentního disku a scénářů ztráty dat. 【F:docs/render-persistent-disk-setup.md†L1-L120】【F:docs/render-data-loss-analysis.md†L1-L22】

## Logování a sledování stavu
- `logger.js` využívá Winston, ukládá logy na disk zajištěný `ensureWritableDir` a v neprodukčním režimu přidává barevný výstup do konzole. 【F:logger.js†L1-L23】
- Health-check endpoint `/api/health` umožňuje platformám ověřit běh aplikace bez nutnosti autentizace. 【F:src/routes/statusRoutes.js†L1-L9】

## Analýza chyby „Exited with status 127“
- Dřívější skript `npm run dev` spouštěl `nodemon`. Na hostingu (nebo CI), kde jsou instalovány pouze produkční závislosti, příkaz `nodemon` není dostupný, což vede k ukončení procesu se stavem 127. 【F:package.json†L8-L13】【F:f4488c†L5-L8】
- Úprava skriptu na použití `node --watch server.js` odstraňuje závislost na externím nástroji a vyžaduje jen Node.js ≥ 18, který je pro projekt stejně minimem. 【F:package.json†L8-L13】

## Doporučené další kroky
1. **Perzistentní úložiště:** na produkci vždy nastavit `DATA_DIR` a `LOG_DIR` na připojený disk, jinak hrozí ztráta dat po redeployi. 【F:pathUtils.js†L18-L109】
2. **Bezpečnost JWT:** v produkci nezapomenout definovat silný `JWT_SECRET` nebo sledovat logy, zda nedochází k jeho automatickému generování. 【F:auth.js†L43-L79】
3. **Monitoring chyb:** rozšířit `errorHandler` o zasílání chyb do externího monitoringu (Sentry apod.) pro lepší dohled nad provozem. 【F:src/middleware/errorHandlers.js†L1-L80】
4. **Testy:** doplnit integrační testy pro klíčové scénáře (registrace, přihlášení, chat) – v repozitáři zatím chybí automatizované testy.

## Shrnutí
Aplikace je členěna do přehledných vrstev (entry point → server → Express app → routery → služby → databáze). Důraz je kladen na bezpečnost (rate limiting, JWT, role admina), perzistenci dat a modularitu. Nejčastějším zdrojem problémů při nasazení je chybějící persistent disk a – před úpravou – také vývojový skript závislý na `nodemon`, který na produkci vedl k chybě „Exited with status 127“.
