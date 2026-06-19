# Kalkulačka ceny dopravy

Porovnání cen dopravy **Raben**, **DNP** a **Vnitro** (Kostelec nad Orlicí).

## Pro kolegy (webový odkaz)

Aplikace běží jako statická webová stránka — stačí odkaz v prohlížeči, nic se neinstaluje.

**Nasazení na GitHub Pages:** viz [DEPLOY.md](DEPLOY.md)

## Lokální použití

### Aktualizace dat z Excelu

```powershell
py -3 build_data.py "e:\AI\vnitro dopravy\Vnitro_Kostelec.xlsx"
```

### Spuštění na počítači

```powershell
py -3 server.py
```

Otevřete `http://localhost:8080`

## Logika výpočtu

| Dopravce | Zóna | Cena |
|----------|------|------|
| **Raben** | Vlastní mapování PSČ → zóny 1–3 | Tarif podle hmotnostního pásma (kg) |
| **DNP** | Vlastní mapování PSČ → zóny 1–12 | Tarif podle hmotnostního pásma (kg) |
| **Vnitro** | Pásmo ze listu ZONY | Sloupce „limit - cena do CN“ a „Minimum“ |

Ceny jsou v **Kč bez DPH**. Nejlevnější doprava je zvýrazněna zeleně.
