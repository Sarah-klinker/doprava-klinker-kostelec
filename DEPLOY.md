# Nasazení na GitHub Pages (odkaz pro kolegy)

Aplikace je čistě statická (HTML + JS + JSON). Na GitHubu ji můžete hostovat zdarma — kolegové jen otevřou odkaz v prohlížeči, nic nemusí instalovat.

## Důležité upozornění

- Do gitu **neposílejte Excel** (`Vnitro_Kostelec.xlsx`) — zůstane jen u vás na disku.
- Do gitu **ano posílejte** `data/shipping.json` — z něj aplikace čte ceny.
- Pokud bude repozitář **veřejný**, ceníky uvidí kdokoli s odkazem. Pro interní ceny zvažte **soukromý repozitář** (GitHub Pages funguje i u privátních repů na placeném plánu) nebo nasazení na firemní server.

---

## Krok 1: Připravte data z Excelu

Na svém počítači (jednorázově před prvním nahráním a při každé aktualizaci cen):

```powershell
cd "c:\Users\skocourkova\Documents\Marketing\AI\vibe coding_1\doprava-kalkulacka"
py -3 build_data.py "e:\AI\vnitro dopravy\Kostelec\Vnitro_Kostelec.xlsx"
```

Tím se přegeneruje soubor `data/shipping.json`.

---

## Krok 2: Složka pro nový GitHub repozitář

Do nového repa na GitHubu nahrajte **obsah složky** `doprava-kalkulacka/`:

```
doprava-kalkulacka/
  index.html
  app.js
  styles.css
  build_data.py          ← jen pro vás (aktualizace cen), na webu se nepoužívá
  data/
    shipping.json        ← nutné pro běh aplikace
  README.md
  DEPLOY.md
  .gitignore
```

Soubor `server.py` na GitHub Pages **nepotřebujete** — slouží jen pro lokální testování.

---

## Krok 3: Nový repozitář na jiném GitHub účtu

1. Přihlaste se na **váš nový GitHub účet** (ne ten propojený s tímto projektem).
2. Klikněte **New repository**.
3. Název např. `doprava-kalkulacka`.
4. Zvolte **Private** (doporučeno) nebo Public.
5. **Nevytvářejte** README ani .gitignore — máte je lokálně.
6. Vytvořte prázdný repozitář.

---

## Krok 4: Nahrání kódu (vy, ne automaticky)

V PowerShellu ve složce `doprava-kalkulacka`:

```powershell
cd "c:\Users\skocourkova\Documents\Marketing\AI\vibe coding_1\doprava-kalkulacka"

git init
git add index.html app.js styles.css data/shipping.json README.md DEPLOY.md .gitignore
git commit -m "Přidat kalkulačku ceny dopravy"

git branch -M main
git remote add origin https://github.com/VASE_UZIVATELSKE_JMENO/doprava-kalkulacka.git
git push -u origin main
```

`VASE_UZIVATELSKE_JMENO` a název repa nahraďte skutečnými hodnotami.

Při prvním push vás GitHub vyzve k přihlášení (prohlížeč nebo token).

---

## Krok 5: Zapnutí GitHub Pages

1. V repozitáři na GitHubu: **Settings** → **Pages**.
2. U **Build and deployment** → Source: **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)**.
4. Uložte (**Save**).
5. Za 1–2 minuty se objeví odkaz, typicky:

   `https://VASE_UZIVATELSKE_JMENO.github.io/doprava-kalkulacka/`

Tento odkaz pošlete kolegům.

---

## Krok 6: Aktualizace cen (po změně Excelu)

```powershell
cd "c:\Users\skocourkova\Documents\Marketing\AI\vibe coding_1\doprava-kalkulacka"
py -3 build_data.py "e:\AI\vnitro dopravy\Kostelec\Vnitro_Kostelec.xlsx"

git add data/shipping.json
git commit -m "Aktualizovat ceníky dopravy"
git push
```

GitHub Pages se obnoví během minuty. Kolegové jen obnoví stránku (F5).

---

## Lokální test před nasazením

```powershell
cd doprava-kalkulacka
py -3 server.py
```

Otevřete `http://localhost:8080` — chování bude stejné jako na GitHub Pages.

---

## Alternativy (bez GitHubu)

| Služba | Postup |
|--------|--------|
| **Netlify** | Na [netlify.com](https://www.netlify.com) přetáhněte složku `doprava-kalkulacka` (Drag & drop deploy) |
| **Vercel** | Stejně — nahrání složky nebo propojení s GitHubem |
| **Firemní server** | Zkopírujte složku na webový server (IIS, Apache, nginx) |

Všechny tyto varianty hostují statické soubory — logika je stejná jako u GitHub Pages.

---

## Časté problémy

**Prázdná stránka / chyba načtení dat**  
→ V repu chybí `data/shipping.json` nebo nebyl commitnutý.

**404 na GitHub Pages**  
→ Zkontrolujte, že Pages běží z větve `main` a kořenového adresáře. Odkaz končí `/` (lomítkem).

**Kolegové vidí staré ceny**  
→ Po pushi počkejte minutu a obnovte stránku s vymazáním cache (Ctrl+F5).
