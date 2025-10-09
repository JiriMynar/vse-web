# Render Persistent Disk: co nastavit

Pokud se vám při nasazení na Render.com objeví chyba související se zápisem na disk (např. hláška o `DATA_DIR`, `LOG_DIR`, `EROFS` nebo "nemůžu zapisovat do adresáře"), udělejte toto:

1. **Otevřete stránku své služby** na Renderu a přejděte do záložky **Disks**.
2. Klikněte na **Add Disk** a zadejte:
   - **Name**: například `data` (název je libovolný).
   - **Size**: minimálně 1 GB.
   - **Mount Path**: `/var/data` nebo `/data` – Render umožňuje obě varianty, důležité je jen držet se stejného zápisu i v proměnných prostředí.
3. Uložte změny a počkejte, až Render disk připojí (stav `Provisioned`).
4. Přejděte do záložky **Environment** a nastavte (nebo zkontrolujte):
   - `DATA_DIR=<váš_mount_path>/data` (např. `/var/data/data` nebo `/data/data`)
   - `LOG_DIR=<váš_mount_path>/logs`
   Pokud proměnné ještě neexistují, přidejte je tlačítkem **Add Environment Variable**. V `<váš_mount_path>` použijte přesně tu cestu, kterou jste zadali v předchozím kroku (Render ji také poskytuje v proměnné `RENDER_DISK_ROOT`).
5. Klikněte na **Save Changes** a poté na **Manual Deploy → Deploy Latest Commit**. Tím se služba restartuje s novým diskem.

> 💡 Aplikace si v rámci `DATA_DIR` sama vytvoří potřebné podadresáře (např. `sqlite.db`, `jwt_secret`). Stačí tedy jen zajistit, aby `DATA_DIR` a `LOG_DIR` mířily na připojený disk.

### Jak poznám, že disk funguje?
- Ve webovém logu uvidíte, že aplikace vytváří soubory v `DATA_DIR` (např. `/var/data/...` nebo `/data/...`) bez chyb.
- V záložce **Logs** už se neobjevují hlášky o neschopnosti zapisovat do `data/` nebo `/tmp`.
- Po redeployi nebo restartu služby zůstanou data zachovaná (uživatelé, chaty, logy).

### Co když disk nepotřebuji?
Pokud vám nevadí, že se všechna data smažou při každém redeployi, můžete disk vynechat. V takovém případě se nic nastavovat nemusí a aplikace použije fallback do `/tmp`, ale data budou dočasná.
