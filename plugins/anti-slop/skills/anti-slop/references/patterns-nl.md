# Nederlandse proza-patronen

Deze catalogus somt de gewoonten op waardoor Nederlandse tekst klinkt alsof een machine hem schreef. Elke vermelding geeft het kenmerk, een slecht voorbeeld, een herschrijving die de vorm van de zin verandert, en de reden waarom het patroon de tekst verraadt. De catalogus beschrijft Nederlandse gewoonten. Het is geen vertaling van de Engelse lijst: een patroon staat hier alleen als het in Nederlandse tekst echt voorkomt.

**Bad:** regels citeren een patroon met opzet, dus de scanner slaat ze over. Vocabulaire-vermeldingen hebben ook een of meer **Match:** regels met een regex tussen backticks. `scripts/scan.mjs` compileert die regexes met de vlaggen `giu`, haalt omheinde code, inline codefragmenten en de **Bad:** en **Match:** regels uit de te controleren tekst, en meldt elke treffer met patroonnaam en regelnummer. Buiten die regels noemt dit bestand verboden woorden alleen binnen inline codefragmenten, zodat het zijn eigen controle doorstaat. De labels Bad, Match, Tell, Rewrite en Why blijven Engels, omdat de scanner erop leest en de bestanden zo gelijk lopen.

Een treffer is een aanleiding om de zin te controleren, geen automatische correctie: sommige treffers zijn in de context gewoon goed Nederlands. Is de treffer terecht, herschrijf dan in plaats van een woord te ruilen. Bouw de zin om het feit heen dat het woord verborg.

## Vocabulaire

### Het woord `naadloos`

**Tell:** `naadloos` of `naadloze` beschrijft een koppeling of ervaring zonder te zeggen wat er werkt.

**Match:** `\bnaadlo{1,2}[sz]e?\b`

**Bad:** De plug-in sluit naadloos aan op je bestaande werkwijze.

**Rewrite:** De plug-in leest de configuratie die je al hebt. Er is geen migratiestap.

**Why:** Het woord claimt een resultaat zonder bewijs. Het concrete gedrag benoemen vervangt de claim.

### Het woord `robuust`

**Tell:** `robuust` of `robuuste` prijst code of een ontwerp zonder een fout te noemen die het overleeft.

**Match:** `\brobuust(?:e|er|ere|heid)?\b`

**Bad:** Deze wijziging maakt de parser robuuster.

**Rewrite:** De parser geeft nu een foutmelding bij een leeg bestand in plaats van te crashen.

**Why:** Een kwaliteitswoord zonder geval erachter. De lezer kan het niet controleren.

### Het woord `cruciaal`

**Tell:** `cruciaal`, `cruciale` of `van cruciaal belang` verheft een detail tot hoofdzaak zonder te zeggen wat er misgaat als het ontbreekt.

**Match:** `\bcrucia(?:al|le)\b`

**Bad:** Een goede foutafhandeling is cruciaal voor de stabiliteit.

**Rewrite:** Zonder foutafhandeling stopt de import bij de eerste ongeldige rij en gaan de overige 900 rijen verloren.

**Why:** Het woord vraagt om aandacht en levert geen reden. De gevolgen noemen doet het werk dat het woord voorwendt.

### De formule `een scala aan`

**Tell:** `een scala aan` of `een scala van` kondigt een rij mogelijkheden aan zonder ze te tellen of te noemen.

**Match:** `\been scala (?:aan|van)\b`

**Bad:** De bibliotheek biedt een scala aan opties voor het formatteren van datums.

**Rewrite:** De bibliotheek kent vier datumnotaties: kort, lang, ISO en relatief.

**Why:** De formule klinkt rijk en meldt niets. Een getal of een lijst is controleerbaar.

### Het werkwoord `duiken`

**Tell:** `duiken` of `duik` plus `in` voor het bespreken van een onderwerp, vaak met `dieper`.

**Match:** `\b(?:duiken|duik|duikt)\s+(?:we\s+|je\s+)?(?:dieper\s+)?in\b`

**Bad:** Laten we dieper duiken in de werking van de cache.

**Rewrite:** De cache verwijdert een item zodra de sleutel opnieuw wordt geschreven. Twee gevallen vragen aandacht: gelijktijdige schrijfacties en verlopen items.

**Why:** Het werkwoord staat bij modellen veel vaker dan bij mensen. Alleen al zijn aanwezigheid doet gegenereerde tekst vermoeden.

### Omslachtig `gebruikmaken van`

**Tell:** `maakt gebruik van`, `maken gebruik van` of `gemaakt gebruik van` waar `gebruikt` volstaat.

**Match:** `\b(?:maak|maakt|maken|gemaakt)\s+gebruik\s+van\b`

**Bad:** De module maakt gebruik van de bestaande index om opzoekingen te versnellen.

**Rewrite:** De module leest de bestaande index. Opzoekingen worden daardoor sneller.

**Why:** Drie woorden voor een werkwoord vullen de zin op zonder betekenis toe te voegen.

### Stock-openers over het tijdperk

**Tell:** Een opening die eerst het tijdperk of de branche beschrijft voordat er iets gezegd wordt, zoals `in het huidige digitale landschap`, `in de wereld van vandaag` of `in het digitale tijdperk`.

**Match:** `\bin het (?:huidige|hedendaagse|moderne) (?:digitale )?(?:landschap|tijdperk)\b`

**Match:** `\bin het digitale tijdperk\b`

**Match:** `\bin de (?:snel|steeds) (?:veranderende|evoluerende) (?:wereld|landschap)\b`

**Match:** `\bin de wereld van (?:vandaag|tegenwoordig)\b`

**Bad:** In het huidige digitale landschap worden tests steeds belangrijker.

**Rewrite:** De testsuite faalde vorige week twee keer op wijzigingen die niemand had getest. Deze PR voegt de ontbrekende test toe.

**Why:** De opener past bij elk onderwerp en zegt dus niets over dit onderwerp. Lezers leren hem over te slaan.

### Aangekondigde nadruk

**Tell:** Een zin die zichzelf het lezen waard verklaart, zoals `het is belangrijk om te benadrukken`, `het is van belang om op te merken` of `het is essentieel om te vermelden`.

**Match:** `\bhet is (?:belangrijk|van belang|essentieel) om (?:te benadrukken|op te merken|te vermelden)\b`

**Match:** `\bhet is de moeite waard om (?:op te merken|te vermelden)\b`

**Bad:** Het is belangrijk om te benadrukken dat de vlag standaard uit staat.

**Rewrite:** De vlag staat standaard uit.

**Why:** Is de zin het lezen waard, dan is de aankondiging overbodig. Is hij het niet waard, dan moet de zin weg.

### Aankondiging van de inhoud

**Tell:** Een zin die zegt wat de volgende zinnen gaan behandelen, zoals `in dit artikel gaan we` of `deze handleiding neemt je mee`.

**Match:** `\bin (?:dit|deze) (?:artikel|bericht|document|handleiding|sectie|paragraaf|gedeelte) (?:gaan|zullen|nemen|bespreken|lopen|behandelen)\b`

**Match:** `\bdeze (?:handleiding|gids) (?:neemt|leidt) (?:je|u)\b`

**Bad:** In dit gedeelte gaan we bekijken hoe verlopen werkt.

**Rewrite:** Verlopen gebeurt lui: een item verdwijnt zodra de sleutel de eerstvolgende keer wordt gelezen.

**Why:** De aankondiging vertraagt de inhoud met een zin. Een schrijver begint met de inhoud.

### Gestapelde overgangen

**Tell:** Zinnen die openen met `Daarnaast,`, `Bovendien,` of `Tevens,` om een punt erbij te plakken.

**Match:** `(?:^|[.!?]\s+)(?:daarnaast|bovendien|tevens),`

**Match:** `\btevens\b`

**Bad:** Daarnaast toont het commando een samenvatting. Bovendien schrijft het een logbestand.

**Rewrite:** Het commando toont een samenvatting en schrijft een logbestand.

**Why:** Het verbindingswoord geeft stijfheid en geen logica. Hangen de punten samen, zeg dan hoe. Zo niet, begin een nieuwe alinea.

### Opgeblazen woordkeus

**Tell:** Grote woorden voor gewone dingen, zoals `baanbrekend`, `stroomlijnen`, `veelzijdig` of `hoogwaardig`.

**Match:** `\b(?:baanbrekende?|stroomlijn(?:en|t|ing)|veelzijdige?|hoogwaardige?)\b`

**Match:** `\b(?:benut|benutten)\s+(?:het|de)\s+(?:volledige\s+)?(?:potentieel|kracht|mogelijkheden)\b`

**Bad:** Deze release biedt een baanbrekende toolkit en stroomlijnt het inwerken.

**Rewrite:** Deze release voegt drie importcommando's toe. Een nieuw project zet je nu op met één commando.

**Why:** De woorden klinken zwaar en bevatten geen detail. Aantallen en commando's doen het werk dat de woorden voorwenden.

## Structuur

### Opsommingen van precies drie

**Tell:** Lijstjes van precies drie bijvoeglijke naamwoorden, voordelen of voorbeelden, ook als de feiten er twee of vier zijn.

**Bad:** De tool is snel, betrouwbaar en eenvoudig in het gebruik.

**Rewrite:** De tool sorteert 10.000 bestanden in twee seconden. Je start hem met één commando.

**Why:** Modellen kiezen standaard drie omdat dat af klinkt. Echte lijsten hebben de lengte van de feiten.

### Samenvatting die de tekst herhaalt

**Tell:** Een slotzin of slotalinea die herhaalt wat er net stond, vaak met `kortom`, `al met al`, `samenvattend` of `tot slot`. Ook korte teksten noemen oorzaak of resultaat twee keer, zoals de Nederlandse issue-reactie in de RED-baseline.

**Match:** `(?:^|[.!?]\s+)(?:kortom|al met al|samenvattend|concluderend|tot slot),`

**Bad:** Kortom, deze wijziging lost de crash op door de naam te trimmen voor het splitsen.

**Rewrite:** De tekst eindigt op de oplossing en de test. De samenvattende zin is weg, want de tekst zei het al.

**Why:** Een samenvatting past bij een lange tekst die een lezer overvliegt. In een korte tekst herhaalt ze alleen.

### Kopjes of opsommingen in korte tekst

**Tell:** Een kopje, een lijst of vetgedrukte labels bij een tekst van minder dan ongeveer tien regels, waar twee of drie gewone zinnen volstaan.

**Bad:** Een PR-beschrijving met een kopje "Samenvatting" en vier opsommingstekens voor één fix.

**Rewrite:** Twee zinnen: de crash met zijn oorzaak, dan de oplossing. Op de laatste regel staat welk issue dit sluit.

**Why:** Opmaak van lange documenten laat een kort bericht klinken als een rapport. Houd kopjes alleen waar een sjabloon of commitgrammatica ze eist.

### Een gedachtestreepje in elke zin

**Tell:** Gedachtestreepjes, of spaties met een koppelteken als streepje, in de meeste zinnen van een alinea om bijzaken af te zonderen.

**Bad:** De fix is klein — één regel — en de test dekt hem — volledig.

**Rewrite:** De fix is één regel en de test dekt hem.

**Why:** Eén streepje kan stijl zijn. Een streepje in elke zin is een tic van gegenereerde tekst en breekt het ritme van de alinea.

### Gelijke zinsopeningen

**Tell:** Drie of meer opeenvolgende zinnen die met hetzelfde woord of dezelfde constructie beginnen, zoals `Dit`, `Het` of `We`.

**Bad:** Dit past de naam aan. Dit voorkomt de crash. Dit voegt ook een test toe.

**Rewrite:** Het trimmen van de naam voorkomt de crash. Een nieuwe test dekt dat af.

**Why:** Gelijke openingen geven een trommelslag die niemand uit zichzelf schrijft. Voeg zinnen samen of begin met een ander onderwerp.

## Toon

### Voorbehouden

**Tell:** Voorbehouden bij feiten die de schrijver kent, zoals `zou mogelijk kunnen` of `het lijkt erop dat`.

**Match:** `\b(?:zou|zouden) (?:mogelijk|eventueel|potentieel|mogelijkerwijs) (?:kunnen|mogen)\b`

**Match:** `\b(?:mogelijkerwijs|potentieel) (?:kan|kunnen|zou|zouden)\b`

**Match:** `\bhet lijkt erop dat\b`

**Bad:** Dit zou mogelijk in sommige gevallen kunnen leiden tot een mislukte opzoeking.

**Rewrite:** De opzoeking mislukt als de naam een spatie aan het eind heeft.

**Why:** Gestapelde voorbehouden ontlopen het risico op ongelijk. Schrijf wat vaststaat, en zeg open wat niet vaststaat. Een enkel `waarschijnlijk` bij een nog niet bewezen oorzaak is eerlijk en geen tic.

### Lege enthousiaste opening

**Tell:** Lof of gretigheid voor de inhoud, zoals `goede vraag`, `graag geholpen` of `ik help je graag`.

**Match:** `\b(?:goede|geweldige|mooie|prima) vraag\b`

**Match:** `\b(?:zeker|absoluut|natuurlijk)!`

**Match:** `\bgraag geholpen\b`

**Match:** `\bik help (?:je|u) graag\b`

**Bad:** Goede vraag! Ik help je graag verder.

**Rewrite:** De vlag staat standaard uit. Zet hem aan met `--cache`. Het antwoord komt eerst, zonder begroeting.

**Why:** In gepubliceerde tekst valt geen gesprek op te warmen. De vrolijkheid is vulling en leest als een script.

### Schijnbare evenwichtigheid

**Tell:** Een gedwongen tweezijdig kader terwijl de schrijver een mening heeft of de feiten één kant op wijzen, zoals `enerzijds ... anderzijds`.

**Match:** `\b(?:enerzijds|anderzijds)\b`

**Bad:** Enerzijds is caching snel, anderzijds maakt het alles ingewikkelder.

**Rewrite:** Caching brengt het rapport terug van vier seconden naar 200 ms. De prijs is één plek meer om te laten verlopen. Doe het.

**Why:** Evenwicht is een reflex en geen analyse. Het verbergt de aanbeveling waarvoor de lezer kwam.

### Verwijzing naar de schrijver

**Tell:** De schrijver praat over zichzelf of over het schrijven, zoals `als AI`, `ik hoop dat dit helpt` of `ik heb een samenvatting opgesteld`.

**Match:** `\bals (?:ai|taalmodel|ai-assistent)\b`

**Match:** `\bik hoop dat dit (?:je|u) (?:helpt|verder helpt)\b`

**Match:** `\bik heb (?:hieronder )?(?:een |de )?(?:samenvatting|conceptversie|concept) (?:opgesteld|geschreven|gemaakt)\b`

**Bad:** Ik heb hieronder een samenvatting opgesteld. Ik hoop dat dit je helpt!

**Rewrite:** Samenvatting: de crash kwam van een ongetrimde naam en de fix trimt die. De verwijzing naar wie het schreef is weg.

**Why:** Gepubliceerde tekst spreekt namens het project. Commentaar op het schrijven is ruis voor de lezer.

## Inhoud

### Beweringen zonder specifics

**Tell:** Een voordeel zonder getal, geval of naam erachter, zoals `verbetert de prestaties`, `verhoogt de gebruikerservaring` of `aanzienlijk verbeterd`.

**Match:** `\b(?:aanzienlijk|drastisch|enorm|sterk) (?:verbeter|verbetert|verbeteren|verbeterd|verhoogt|verhogen|verlaagt|verlagen)\b`

**Match:** `\b(?:verbetert|verbeteren|verbeterd|verhoogt|verhogen|verlaagt|verlagen)\b[^.!?]{0,40}?\b(?:aanzienlijk|drastisch|enorm)\b`

**Match:** `\b(?:verbeter|verbetert|verbeteren|verhoogt|verhogen)\s+(?:de\s+)?(?:algehele\s+)?(?:prestaties|betrouwbaarheid|kwaliteit|gebruikerservaring)\b`

**Bad:** Deze wijziging verbetert de prestaties aanzienlijk.

**Rewrite:** Het opstarten gaat van 1,8 s naar 0,6 s op de voorbeeldrepo.

**Why:** Een bewering die niemand kan controleren. Bestaat het getal, gebruik het. Bestaat het niet, schrap de bewering.

### Schrapbare vulling

**Tell:** Woorden en hele zinnen die zonder verlies weg kunnen, zoals `zoals eerder vermeld`, `het spreekt voor zich dat`, `gezien het feit dat` of `aan het einde van de dag`.

**Match:** `\b(?:zoals eerder vermeld|het spreekt voor zich dat|het mag duidelijk zijn dat|gezien het feit dat|vanwege het feit dat|aan het einde van de dag|onnodig te zeggen)\b`

**Bad:** Het spreekt voor zich dat we de naam trimmen, gezien het feit dat spaties de splitsing braken.

**Rewrite:** Het trimmen van de naam voorkomt de crash die een spatie aan het eind in de splitsing veroorzaakte.

**Why:** Elke vulfrase kost de lezer een tel. Test: schrap hem, en als de betekenis blijft staan was het vulling.

### Vage versterkers

**Tell:** Graadwoorden die een bewering opdrijven zonder haar te meten, zoals `zeer`, `uiterst`, `ongelooflijk`, `buitengewoon` of `bijzonder`.

**Match:** `(?<![\p{L}\p{N}])(?:zeer|uiterst|ongelooflijk|buitengewoon|bijzonder|ontzettend)\s+\p{L}{3,}`

**Bad:** De nieuwe index is zeer snel en uiterst eenvoudig te onderhouden.

**Rewrite:** De nieuwe index beantwoordt een opzoeking in minder dan een milliseconde en het bouwscript is 20 regels.

**Why:** Versterkers staan in voor bewijs. Een gemeten feit is sterker dan elk bijwoord.

### Dubbel uitleggen

**Tell:** Dezelfde oorzaak of hetzelfde verwachte resultaat twee keer in een korte tekst, eerst in de opening en dan in een slotzin met `dus`. De Nederlandse issue-reactie in de RED-baseline deed dit met zowel de oorzaak als het verwachte resultaat.

**Bad:** De oorzaak zit in de feestdagenlijst. Daar ontbreekt nieuwjaarsdag, dus een datum in december ziet 1 januari niet als feestdag.

**Rewrite:** De feestdagenlijst mist nieuwjaarsdag voor het jaar na de opgegeven datum. Eén keer gezegd, op de plek waar de lezer het zoekt.

**Why:** Herhaling in een korte tekst geeft de lezer niets nieuws en maakt de tekst langer dan de feiten. Kies de plek waar de uitleg het meest helpt en schrap de andere.
