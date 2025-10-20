# Analýza mazání dat po redeployi na Render.com

## Shrnutí
Po každém redeployi běží aplikace v novém kontejneru, který má prázdný lokální disk. Aplikace ukládá uživatele, relace i historii Rádce do databázového souboru SQLite v adresáři `data`. Pokud tento adresář není namapovaný na trvalý disk (persistent disk), vytvoří se v dočasném umístění kontejneru a při redeployi zmizí. Výsledkem je ztráta všech uživatelských účtů a historie Rádce.

## Detailní rozbor
- V `db.js` se databáze otevírá jako soubor `app.db` v adresáři vráceném funkcí `ensureWritableDir` s parametrem `defaultSubdir: 'data'`. Pokud není nastaveno `DATA_DIR`, uloží se tak do lokálního adresáře uvnitř kontejneru. 【F:db.js†L7-L12】

- Protože je databáze pouze soubor (`app.db`), při startu nového kontejneru dostane aplikace čisté prostředí bez předchozího souboru. Migrační skripty databázi znovu vytvoří, čímž zmizí všechny existující účty i rozhovory Rádce. 【F:db.js†L14-L120】
- Stejný mechanismus používá i správa JWT tajného klíče – při nasazení bez trvalého úložiště se vygeneruje nový soubor s tajemstvím, takže i existující refresh tokeny přestávají platit. 【F:auth.js†L19-L78】

## Doporučení

- Ověřit v administraci Renderu, že je disk opravdu připojen ke službě (u free tarifu není persistent disk dostupný, takže bude potřeba alespoň Starter plán).
- Po úspěšném připojení disku zkontrolovat, že proměnná `DATA_DIR` ukazuje na mount point disku a že soubor `app.db` se skutečně ukládá na trvalé úložiště.
