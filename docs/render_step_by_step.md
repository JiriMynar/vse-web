# Render nasazení – krok za krokem

Tento návod předpokládá, že už máte účet na Render.com a repozitář s aplikací na GitHubu.

1. **Připravte si proměnné prostředí**
   - Na GitHubu klikněte na tlačítko *Code* a zkopírujte URL repozitáře (HTTPS).
   - V souboru `.env` ve vašem lokálním projektu si nastavte hodnoty `JWT_SECRET` a volitelně `OPENAI_API_KEY` (nebo jiný klíč pro chatbot API). Při nasazení na Render tyto hodnoty zadáte do *Environment Variables*.

2. **Spusťte průvodce na Renderu**
   - Přihlaste se na [https://dashboard.render.com](https://dashboard.render.com).
   - Klikněte na **New +** a vyberte **Web Service**.
   - V sekci **Connect a repository** povolte Renderu přístup ke svému GitHub účtu (pokud jste to ještě neudělali) a vyberte repozitář s touto aplikací.

3. **Vyplňte základní údaje**
   - **Name**: libovolný název služby (např. `vse-chat-app`).
   - **Region**: vyberte region nejblíže vašim uživatelům (např. Frankfurt).
   - **Branch**: `main` (nebo jinou větev, kterou chcete nasazovat).

4. **Nastavte runtime a build**
   - **Runtime**: zvolte `Node`. Pokud vidíte možnost *Use existing Blueprint*, můžete vybrat soubor `render.yaml`, který je součástí repozitáře – průvodce se předvyplní.
   - **Build Command**: `npm install` (Render jej doplní automaticky).
   - **Start Command**: `npm start` (také se doplní automaticky, případně zadejte ručně).

5. **Zadejte Environment Variables**
   - Klikněte na **Add Environment Variable** a zadejte:
     - `JWT_SECRET`: nastavte libovolný dlouhý řetězec (např. generovaný na [https://www.random.org/strings/](https://www.random.org/strings/)).
     - `OPENAI_API_KEY` nebo jiný klíč podle toho, jaké chatbot API budete používat (volitelné – můžete doplnit později).
   - Ponechte ostatní hodnoty prázdné; aplikace si databázi a logy uloží do `/tmp` automaticky.

6. **Spusťte nasazení**
   - Klikněte na tlačítko **Create Web Service**.
   - Render spustí build (`npm install`) a následně start služby (`npm start`). Na stránce služby sledujte logy. Úspěšné nasazení končí hláškou `Server listening on port 10000` (nebo na portu, který Render přidělí).

7. **Otestujte aplikaci**
   - Po dokončení nasazení klikněte na tlačítko **Open in Browser**.
   - Otevře se stránka s přihlášením/registrací. Vytvořte si první účet, přihlaste se a zkuste odeslat zprávu v chatu. Bez API klíče se odpovědi bota nezobrazí, ale historie zpráv se uloží.

8. **Aktualizace a nové deploye**
   - Při každém pushi na vybranou větev (např. `main`) Render automaticky spustí nový build a nasazení.
   - Pokud potřebujete změnit proměnné prostředí, najdete je v záložce **Environment** na stránce služby. Po změně klikněte na **Save Changes** a poté na **Manual Deploy → Deploy Latest Commit**.

## Časté problémy

- **Chyba s `requirements.txt`**: znamená, že byla omylem zvolena Python služba. Zastavte službu, klikněte na **Settings → Delete Web Service** a založte ji znovu s runtime `Node`.
- **Chyba `EROFS` nebo `SQLITE_CANTOPEN`**: vznikala, když aplikace chtěla zapisovat do read-only adresáře. Aktuální verze aplikace ukládá data do `/tmp`, takže se chyba už neobjeví. Pokud chcete trvalé úložiště, vytvořte v Renderu *Persistent Disk* a hodnoty `DATA_DIR`/`LOG_DIR` nastavte na připojenou cestu.

