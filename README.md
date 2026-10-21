# MT aan het stuur – digitale simulatie informatiemanagement

Digitale oefening voor vier fictieve managementteams binnen de cursus assetmanagement van Provincie Noord-Holland (B&U).

## Doel en werking
Vier teams (MT A–D) sturen op dezelfde assetmanagementdoelstellingen, maar ontvangen verschillende managementinformatie. Gedurende drie informatierondes leggen zij diagnoses, informatievragen en besluiten vast. Bij de nabespreking wordt de gezamenlijke werkelijkheid onthuld.

- **Ronde 1:** Signaleren en voorlopige prioriteit.
- **Ronde 2:** Verklaren en vooruitkijken.
- **Ronde 3:** Afwegen en besluiten.
- **Eindresultaat:** Besluiten vergelijken en gezamenlijke reflectie.

## Repositorystatus
Deze repository is de **publieke frontend-repository**. Er staan bewust **geen docentantwoorden, verborgen MT-inhoud, teamcodes, API-geheimen of Cloudflare Worker-gegevens** in.

De eerder gemaakte **digitale simulatie – prototype 1** is beschikbaar als apart ZIP-pakket bij de opleider. Dat pakket bevat onder andere `app/index.html`, `app/worker.js`, `app/content.js`, `app/schema.sql` en de brondossiers.

**Nog niet geïnstalleerd:** de werkende frontend en serveromgeving. Dit is dus nog **geen speelbare online simulatie**. Gebruik de handleiding in `docs/INSTALLATIE.md` voor de vervolgstappen.

## Beveiliging
Omdat deze repository **public** is, mag de map `source/` uit het prototype hier **niet** worden geplaatst. `app/content.js` bevat verborgen spelinhoud en hoort uitsluitend in een afgeschermde serveromgeving of private repository.

Publiceer uitsluitend de deelnemer- en docentinterface zonder geheime spelinhoud. De Cloudflare Worker moet server-side bepalen welke documenten per team en ronde worden vrijgegeven.

## Gescheiden van andere projecten
Deze repository is onafhankelijk van de bestaande risicomanagementsimulatie en risicomatrix.
