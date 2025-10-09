# Analýza mazání dat po redeployi na Render.com

## Shrnutí
Po každém redeployi běží aplikace v novém kontejneru, který má prázdný lokální disk. Aplikace ukládá uživatele, relace i historii chatu do databázového souboru SQLite v adresáři `data`. Pokud tento adresář není namapovaný na trvalý disk (persistent disk), vytvoří se v dočasném umístění kontejneru a při redeployi zmizí. Výsledkem je ztráta všech uživatelských účtů a historie chatu.

## Detailní rozbor
- V `db.js` se databáze otevírá jako soubor `app.db` v adresáři vráceném funkcí `ensureWritableDir` s parametrem `defaultSubdir: 'data'`. Pokud není nastaveno `DATA_DIR`, uloží se tak do lokálního adresáře uvnitř kontejneru. 【F:db.js†L7-L12】
- `ensureWritableDir` prohledává několik kandidátů a pokud žádný trvalý disk není dostupný, skončí u `os.tmpdir()`. To je dočasné úložiště kontejneru, které se mezi deployi nevytváří znovu se stejným obsahem. 【F:pathUtils.js†L14-L36】
- Protože je databáze pouze soubor (`app.db`), při startu nového kontejneru dostane aplikace čisté prostředí bez předchozího souboru. Migrační skripty databázi znovu vytvoří, čímž zmizí všechny existující účty i chaty. 【F:db.js†L14-L120】
- Stejný mechanismus používá i správa JWT tajného klíče – při nasazení bez trvalého úložiště se vygeneruje nový soubor s tajemstvím, takže i existující refresh tokeny přestávají platit. 【F:auth.js†L19-L78】

## Doporučení
- Na Render.com připojit persistent disk (např. přes `render.yaml` nastavit `disk` a proměnnou `DATA_DIR`) – aplikace nyní při běhu v produkci bez této proměnné skončí chybou, aby neuložila databázi do dočasného úložiště.【F:pathUtils.js†L1-L48】【F:db.js†L5-L13】
- Ověřit v administraci Renderu, že je disk opravdu připojen ke službě (u free tarifu není persistent disk dostupný, takže bude potřeba alespoň Starter plán).
- Po úspěšném připojení disku zkontrolovat, že proměnná `DATA_DIR` ukazuje na mount point disku a že soubor `app.db` se skutečně ukládá na trvalé úložiště.
