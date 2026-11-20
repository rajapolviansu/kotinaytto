# Changelog

Tähän tiedostoon kirjataan kaikki merkittävät muutokset.
Formaatti perustuu [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) -ohjeeseen,
ja versiointi noudattaa [Semanttista versiointia](https://semver.org/lang/fi/).

## [Julkaisematon]

### Lisätty
- Sovellus on asennettava (PWA): manifest ja kuvakkeet, jolloin se avautuu puhelimen aloitusnäytöltä kokoruudussa ilman osoitepalkkia (V5.1)
- Kuukausien selaus (edellinen/seuraava kuukausi) ja "Tänään"-painike (V1.2)
- Kuluvan päivän korostus Suomen aikavyöhykkeellä (Europe/Helsinki); korostus siirtyy keskiyöllä ilman uudelleenlatausta (V1.3)
- Tapahtumien datamalli (otsikko, alku, loppu, koko päivän -merkintä, kalenteri/väri) ja päivän tapahtumien näyttö kuukausiruudukossa mock-datalla (V1.4)

- Google-kalenterin yhdistäminen Netlify Functions -backendin kautta: kertakirjautuminen, refresh token säilyy palvelimella ja access token uusitaan automaattisesti, tapahtumat haetaan kaikista valituista kalentereista omin värein ja päivitetään minuutin välein, yhteyden voi katkaista (V1.5, V1.6, V1.7). Rajapinnat suojataan näyttöavaimella. Ilman backendiä näytetään mock-data.
- Google Tasks -tehtävät näytetään kalenterissa koko päivän tapahtumina eräpäivänään; suoritetut himmennetään ja yliviivataan (V3.1, V3.3, V3.4). Vaatii Google-tilin uudelleenyhdistämisen (uusi scope `tasks.readonly`) ja Google Tasks API:n käyttöönoton.

### Muutettu
- Lähdekoodi siirretty TypeScriptiin; lisätty `npm run typecheck` ja tyyppitarkistus CI:hin

## [1.1.0] - 2026-11-17

### Lisätty
- Kalenterin kuukausiruudukko

## [1.0.0] - 2026-11-17

### Lisätty
- Vite + React -projektin alustus
- CI-workflow
- Pull request -pohja
- Vaatimusmäärittely ja kotinäytön mockup-kuvat (vaalea ja tumma) README:hen

[Julkaisematon]: https://github.com/rajapolviansu/kotinaytto/compare/HEAD
