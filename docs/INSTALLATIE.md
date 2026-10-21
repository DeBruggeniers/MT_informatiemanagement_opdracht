# Installatieplan – MT aan het stuur

## 1. Publieke repository

Deze repository (`DeBruggeniers/MT_informatiemanagement_opdracht`) is openbaar. Upload hier **uitsluitend** de frontend uit het ZIP-prototype: `app/index.html` (zonder ingebedde geheimen). Voor GitHub Pages kun je het bestand als `index.html` in de root plaatsen.

**Zet niet het hele ZIP-pakket op deze publieke repository.**

## 2. Private servercode

Bewaar uit het prototype apart en niet-publiek:
- `app/worker.js` – Cloudflare Worker, controles op teamtoegang.
- `app/content.js` – documenten, dashboards en verborgen oefeninhoud.
- `app/schema.sql` – opslagstructuur van Cloudflare D1.
- `app/wrangler.toml` – Cloudflare-configuratie (zonder geheime waarden).
- `source/` – originele dossiers en docentmateriaal.

## 3. Cloudflare

1. Maak een afzonderlijke Cloudflare D1-database.
2. Voer het `schema.sql`-bestand uit met Wrangler.
3. Koppel de D1-binding aan de Worker.
4. Stel het docentgeheim in via `wrangler secret put ADMIN_SECRET`.
5. Deploy de Worker.
6. Noteer de Worker-URL voor de frontend.

Gebruik geen bestaande Workers of databases van andere oefeningen, om overschrijven te voorkomen.

## 4. GitHub Pages

Open **Settings → Pages**, kies **Deploy from a branch**, branch `main` en map `/ (root)` nadat `index.html` aan de root is toegevoegd.

## 5. Test vóór gebruik

Controleer met vijf schermen: één docent en MT A–D; toegang per MT; alle drie de informatierondes; twee informatievragen; antwoord van docent; besluitregistratie; eindresultaat; reset; opnieuw inloggen.

### Let op
Dit is een inrichtingsplan, geen bevestiging dat Cloudflare of GitHub Pages al geactiveerd is.
