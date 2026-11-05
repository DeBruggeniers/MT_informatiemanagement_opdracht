# Implementatie en acceptatie v8 – MT informatiemanagement

## Status
De frontend in deze branch toont per ronde een expliciete opdracht, de juiste invoervelden en een teller van twee informatievragen per ronde. De inhoudsrepository bevat een vereenvoudigde versie van de 24 dossiers en een uitgebreid antwoordprotocol. **Niet publiceren als volledig werkend totdat de Cloudflare Worker en D1 zijn aangepast en getest.**

## Serverwijzigingen (verplicht)
De publieke repository bevat de Cloudflare Worker niet. Pas de privé Worker `mt-informatiemanagement` aan, zonder de huidige teamcodes, sessies en database te vervangen.

### POST /api/team/ask
- Authenticeer de teamcode op de server; leid het team uitsluitend uit de sessie af.
- Accepteer alleen actieve rondes 1, 2 en 3.
- Tel bestaande vragen voor hetzelfde `session_id`, `team` en `round`; weiger de derde vraag met HTTP 409 en een begrijpelijke melding.
- Sla vraag en ronde in één transactie of onder een gelijkwaardige atomaire controle op. Voorkom dat gelijktijdige verzoeken de limiet omzeilen.
- Een netwerkfout mag geen tweede vraag creëren bij opnieuw verzenden. Gebruik bij voorkeur een idempotency-key per aanvraag.
- Alleen succesvol opgeslagen inhoudelijke vragen tellen mee. Een verzoek om verduidelijking is geen beantwoorde inhoudelijke vraag en moet afzonderlijk kunnen worden afgehandeld.
- De docent kan iedere inhoudelijke vraag beantwoorden, onafhankelijk van MT A/B/C/D. Geen teamgebaseerde blokkering van informatie.
- Retourneer voor het team alleen eigen vragen en antwoorden. Docentantwoorden en bronbestanden blijven afgeschermd.

### GET /api/team/state
- Retourneer `questions` inclusief `round` en `id` voor het aangemelde team.
- Retourneer actuele `round` en eerder vastgelegde beslissingen.
- Houd bestaande JSON-velden in stand voor compatibiliteit met de frontend.

### Antwoordvoorziening
- Zoek in het canonieke werkelijkheidsdossier en de docentenantwoordenbank; niet uitsluitend in de dossiers van het vragende MT.
- Laat de docent de uiteindelijke tekst controleren en versturen. Een generatief antwoord zonder gecontroleerde feitenbasis mag geen nieuwe oefenfeiten introduceren.
- Benoem periode, scope, meeteenheid en bewijsstatus; geef bij onbekende gegevens expliciet aan dat ze niet zijn vastgesteld.
- Publiceer geen docentenmateriaal in GitHub Pages of via een publiek ongeauthenticeerd API-endpoint.

## Didactisch ontwerp
- Ronde 1: verkennen. Maximaal drie problemen, mogelijke verklaringen en kennishiaten. Geen definitief maatregelenbesluit.
- Ronde 2: analyseren. Oorzaken, verbanden en voorlopige maatregelen.
- Ronde 3: besluiten. Afweging van prestaties, risico's, kosten en uitvoerbaarheid, inclusief onzekerheden.

## Acceptatietest vóór publicatie
1. Log in als ieder van de vier MT's; controleer alleen eigen documenten.
2. Stel in ronde 1 twee vragen; derde vraag moet op serverniveau worden geweigerd.
3. Start ronde 2; twee nieuwe vragen mogelijk, oude vragen blijven zichtbaar.
4. Start ronde 3; opnieuw twee vragen mogelijk.
5. Controleer dat vragen van MT3 over technische brugoorzaken inhoudelijk worden beantwoord.
6. Controleer een brede, een onduidelijke en een buiten-de-dossiers-vraag.
7. Controleer de meetdefinities: wegkwaliteit 182/200; reistijd 2.800/200; bruggen 9.200/10.000 gewogen uren.
8. Controleer dat 2027-prognoses niet als gerealiseerde cijfers worden gepresenteerd.
9. Controleer opslaan en teruglezen van analyses en besluiten per ronde.
10. Test docentbediening, sessieherstel, eindresultaat en reset.
11. Controleer dat docentmateriaal, tokens en toegangscodes niet in de publieke repository of browserbron staan.
12. Maak vóór Worker- en D1-wijzigingen een back-up en voer een hersteltest uit.

**Publicatievolgorde:** eerst private Worker en D1 testen, daarna inhoud vrijgeven, als laatste publieke frontend naar main brengen.
