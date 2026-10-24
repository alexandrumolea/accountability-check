# Accountability · 5 condiții

Evaluare online de echipă pe cele 5 condiții ale accountability-ului (Claritate, Capabilitate, Autoritate, Vizibilitate, Consecințe). Fiecare participant evaluează 17 afirmații de la 1 (dezacord complet) la 5 (acord complet).

**Innersis** · Alexandru Molea

## Cum funcționează

1. **Facilitatorul** creează o sesiune nouă: numele sesiunii și câți participanți așteaptă.
2. Primește un **link pentru participanți** (cu QR și cod de 6 caractere) și un **link de facilitator**, pe care trebuie să-l păstreze.
3. **Participanții** deschid linkul, își scriu numele și parcurg cele 5 condiții. Răspunsurile se păstrează în browser până la trimitere și pot fi modificate după trimitere.
4. Pe pagina de facilitator se vede live: câți s-au **înregistrat**, câți **au completat** și câți sunt **așteptați**.
5. Rezultatele apar automat:
   - pentru fiecare condiție, un tabel cu nota fiecărei persoane la fiecare afirmație, media afirmației, diferența (max − min), media fiecărei persoane și **media condiției**;
   - **diferențele mari** sunt evidențiate: galben pentru o diferență ≥ 2, roșu pentru ≥ 3, iar notele aflate la ±1,5 de medie sunt încadrate;
   - un **sumar** final cu indicele general, mediile pe condiții, matricea persoane × condiții, afirmațiile unde echipa diferă cel mai mult și cele mai slabe și cele mai puternice afirmații.
6. **Salvează PDF** deschide dialogul de tipărire (A4 landscape), unde alegi „Save as PDF”.
7. **Ascunde numele** înlocuiește numele cu P1, P2… pentru proiectare sau pentru PDF.

**Limba:** butoanele RO / EN din bara de sus schimbă limba. Linkul și codul QR pentru participanți păstrează limba aleasă de facilitator.

Sesiunile create dintr-un browser apar pe pagina principală, la „Sesiunile create în acest browser”.

## Configurare Firebase (obligatoriu pentru folosire reală)

GitHub Pages servește doar fișiere statice, așa că răspunsurile participanților sunt salvate în **Firebase Realtime Database** (gratuit pe planul Spark). Fără configurare, aplicația rulează în **Mod demo**: datele rămân doar în browserul curent, util doar pentru test.

1. Intră pe [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (Google Analytics nu e necesar).
2. **Build → Realtime Database → Create database**. Alege o locație (ex. `europe-west1`) și pornește în **locked mode**.
3. În tab-ul **Rules**, înlocuiește conținutul cu cel din `database.rules.json` și apasă **Publish**.
4. **Project settings** (rotița) → **Your apps** → iconița **Web** `</>` → înregistrează aplicația. Copiază valorile din `firebaseConfig` în `config.js` (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`).
5. Asigură-te că `databaseURL` este completat. Pastila „Mod demo” dispare.

Cheile din `config.js` nu sunt secrete: așa funcționează Firebase pe web. Accesul este controlat de reguli.

## Publicare pe GitHub Pages

1. Urcă conținutul acestui folder într-un repository nou (ex. `accountability-check`), pe branch-ul `main`.
2. Settings → Pages → Source: `Deploy from a branch` → `main`, folder `/ (root)` → Save.
3. Aplicația va fi live la `https://USERNAME.github.io/accountability-check/`.

## Fișiere

| Fișier | Ce este |
|---|---|
| `index.html` | Pagina aplicației |
| `app.js` | Ecranele: pagina principală, participant, facilitator, rezultate, sumar |
| `data.js` | Afirmațiile și scala, în română și engleză, plus pragurile pentru evidențieri. Aici se editează textele. |
| `i18n.js` | Textele interfeței (butoane, mesaje, rezultate) în română și engleză |
| `store.js` | Salvarea datelor: Firebase sau localStorage (mod demo) |
| `config.js` | Configurația Firebase |
| `style.css` | Stilurile, inclusiv cele pentru PDF |
| `database.rules.json` | Regulile de securitate pentru Firebase |
| `assets/innersis-logo.png` | Sigla Innersis (în bara de sus și pe coperta PDF-ului) |

## Note

- Linkul de facilitator conține o cheie (`&k=…`). Oricine are acest link vede rezultatele, așa că trimite participanților doar linkul de participant.
- Nu schimba ordinea sau numărul afirmațiilor din `data.js` în timpul unei sesiuni deja începute: răspunsurile sunt salvate în ordinea afirmațiilor.
- Pentru test local, rulează un server static în acest folder (de ex. `npx serve`). Fișierele JS sunt module ES și nu pornesc dacă deschizi `index.html` direct din Finder.
