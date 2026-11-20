# Kotinäyttö

Moduulinen kotinäyttö, josta näkee perheen menot suoraan kalenterinäkymässä.

<img width="1208" height="577" alt="image" src="https://github.com/user-attachments/assets/b0f976d6-476f-49dc-91f5-296e38d49eb2" />


## Kehitys

Teknologiat: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/) ja [Vitest](https://vitest.dev/).

```bash
npm install        # asenna riippuvuudet
npm run dev        # kehityspalvelin
npm run typecheck  # TypeScript-tyyppitarkistus
npm run lint       # ESLint
npm test           # yksikkötestit
npm run build      # tyyppitarkistus + tuotantobuild
```

CI ajaa lintin, tyyppitarkistuksen, testit ja buildin jokaiselle pull requestille ja pushille `develop`- ja `main`-haaroihin.

### Google-kalenterin yhdistäminen

Kirjautumisen ja tokenit hoitaa pieni backend (Netlify Functions, kansio `netlify/`). Google-kirjautuminen tehdään kerran, ja palvelin säilyttää refresh tokenin ([Netlify Blobs](https://docs.netlify.com/blobs/overview/)) ja uusii access tokenin itse, joten näytöllä ei tarvitse kirjautua uudelleen. Selain ei näe Googlen tokeneita eikä client secretiä. Sovellus pyytää vain kalenterin lukuoikeuden (`calendar.readonly`). Ilman backendiä (`npm run dev`) sovellus näyttää mock-datan.

Rajapinnat: `GET /api/events`, `GET /api/auth/start`, `GET /api/auth/callback` ja `POST /api/disconnect`. Tapahtumat ja yhteyden katkaisu vaativat **näyttöavaimen** (jaettu salasana, otsikko `x-display-key`), jottei kukaan muu pääse lukemaan kalenteria julkisesta osoitteesta.

**Käyttöönotto**

1. Google Cloud Consolessa: ota käyttöön **Google Calendar API** ja luo **OAuth client ID** (tyyppi _Web application_). Lisää _Authorized redirect URIs_ -kohtaan `http://localhost:8888/api/auth/callback` ja `https://kotinaytto.netlify.app/api/auth/callback`.
2. Siirrä OAuth-sovellus _In production_ -tilaan (_Testing_-tilassa refresh token vanhenee 7 päivässä).
3. Luo näyttöavain, esim. `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`.
4. Netlifyssä (Site configuration → Environment variables) lisää `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ja `DISPLAY_ACCESS_KEY` (kaksi jälkimmäistä merkitään _Contains secret values_) ja deployaa uudelleen. Mallina `.env.example`.
5. Avaa näyttölaitteella `https://kotinaytto.netlify.app/#key=<näyttöavain>` (avain tallentuu laitteelle ja poistuu osoiterivistä), paina **Yhdistä Google-kalenteri** ja anna lupa.

**Paikallinen testaus:** kopioi `.env.example` tiedostoksi `.env`, täytä arvot ja aja `npx netlify-cli dev`. Avaa `http://localhost:8888` (ei 5173, koska functionit toimivat vain Netlify-palvelimen kautta).

### Asennus puhelimelle (kokoruutu)

Sivu on asennettava web-sovellus (PWA), joka avautuu ilman selaimen osoitepalkkia. Avaa `https://kotinaytto.netlify.app/#key=<näyttöavain>` puhelimen selaimessa ja valitse Chromessa valikosta (⋮) **Asenna sovellus** (tai **Lisää aloitusnäytölle**), Safarissa jakovalikosta **Lisää koti-valikkoon**. Käynnistä sovellus sen jälkeen aloitusnäytön kuvakkeesta. Jos olet jo asentanut pikakuvakkeen aiemmin, poista se ja asenna uudelleen.

## Vaatimusmäärittely

### 1. Kalenterinäkymä

- ✅ **V1.1** Sovellus näyttää kalenterin kuukausinäkymänä (yksi kuukausi kerrallaan).
- ✅ **V1.2** Käyttäjä voi selata edelliseen ja seuraavaan kuukauteen sekä palata kuluvaan kuukauteen.
- ✅ **V1.3** Kuluva päivä on korostettu näkymässä.
- ✅ **V1.4** Kunkin päivän tapahtumat (menot) näkyvät päivän kohdalla kuukausinäkymässä.
- ✅ **V1.5** Kalenteriin voi yhdistää Gmail- eli Google-tilin (Google Calendar) kirjautumalla tilille Googlen OAuth 2.0 -valtuutuksella. Sovellus pyytää vain kalenterin lukuoikeuden.
- ✅ **V1.6** Yhdistetty tili säilyy, eikä käyttäjän tarvitse kirjautua uudelleen joka käynnistyksellä. Tilin yhteyden voi myös katkaista.
- ✅ **V1.7** Tuki useammalle kalenterille (esim. perheenjäsenten kalenterit) on toivottavaa; niiden tapahtumat erotetaan toisistaan värein.
- **V1.8** Päivää napauttamalla tai klikkaamalla näkee kaikki kyseisen päivän tapahtumat, myös ne, jotka eivät mahdu kuukausiruudukon soluun. Näkymän voi sulkea, ja se on vain lukunäkymä (ei muokkausta).

### 2. Kellonaika

- **V2.1** Kellonaika on jatkuvasti näkyvissä näytöllä.
- **V2.2** Kello päivittyy vähintään minuutin välein (suositus: sekunnin välein) ilman käyttäjän toimia.
- **V2.3** Kellonaika esitetään 24 tunnin muodossa Suomen aikavyöhykkeellä (Europe/Helsinki), ja kesäaikaan siirtyminen huomioidaan automaattisesti. Päivämäärä ja viikonpäivä näytetään suomeksi.

### 3. Tehtävät

- **V3.1** Jos Google-kalenterissa tai Google Tasks -tehtävälistassa on tehtäviä, ne näytetään kalenterissa.
- **V3.2** Tehtävät päivittyvät reaaliajassa: uusi, muuttunut tai poistettu tehtävä näkyy näytöllä ilman, että sivua tarvitsee ladata uudelleen.
- **V3.3** Tehtävästä näytetään vähintään otsikko ja eräpäivä. Tehtävät järjestetään eräpäivän mukaan, ja myöhässä olevat merkitään selvästi.
- **V3.4** Suoritetuksi merkityt tehtävät poistuvat listalta tai erottuvat selvästi.

### 4. Synkronointi puhelimista

- **V4.1** Kun Google-kalenteria päivitetään omalla puhelimella (tapahtuman lisäys, muokkaus tai poisto), muutos päivittyy kotinäytölle automaattisesti.
- **V4.2** Päivitys näkyy näytöllä mahdollisimman nopeasti, tavoitteena enintään 1 minuutti muutoksesta.
- **V4.3** Toteutus perustuu Google Calendar API:in: säännölliseen kyselyyn (polling) minuutin välein. Push-ilmoituksia (watch/webhook) ei käytetä, koska näyttö on vain lukunäkymä ja toimii selaimessa ilman palvelinta. Inkrementaalinen synkronointi (`syncToken`) on mahdollinen myöhempi optimointi.
- **V4.4** Verkkoyhteyden katkettua sovellus näyttää viimeksi haetut tiedot ja ilmoittaa, ettei tieto ole ajan tasalla. Yhteyden palautuessa tiedot synkronoituvat automaattisesti.
- **V4.5** Muutokset tehdään vain Google-kalenterissa (puhelimella); kotinäyttö on ensisijaisesti lukunäkymä.

### 5. Ei-toiminnalliset vaatimukset

- **V5.1** Käyttöliittymä on suunniteltu kotiseinälle tai pöydälle sijoitettavalle näytölle: selkeä ja luettava etäältä, mukautuu eri näyttökokoihin ja toimii kokoruututilassa.
- **V5.2** Sovellus käynnistyy ja toimii itsenäisesti ilman jatkuvaa ylläpitoa.
- **V5.3** Kirjautumistunnisteet (OAuth-tokenit) tallennetaan turvallisesti, eikä niitä tallenneta versionhallintaan.
- **V5.4** Käyttöliittymän kieli on suomi.
- **V5.5** Arkkitehtuuri on moduulinen, jotta uusia näkymiä (esim. sää, ruokalista) voidaan lisätä myöhemmin.

### 6. Rajaukset (ei kuulu ensimmäiseen versioon)

- Tapahtumien muokkaaminen suoraan kotinäytöltä.
- Muut kalenteripalvelut kuin Google Calendar.
