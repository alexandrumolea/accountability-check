// Conținutul evaluării. Textele pot fi editate liber; ordinea afirmațiilor contează pentru datele deja colectate.
export const SCALE = [
  { v: 1, label: "Dezacord complet" },
  { v: 2, label: "Dezacord" },
  { v: 3, label: "Parțial" },
  { v: 4, label: "Acord" },
  { v: 5, label: "Acord complet" }
];

export const CONDITIONS = [
  {
    id: "claritate",
    title: "Claritate",
    desc: "Prioritățile sunt clare și au o ordine. Ownerul știe pentru ce rezultate răspunde, nu doar care sunt responsabilitățile lui.",
    question: "Există o ordine, sau doar o listă? Știe ownerul rezultatul, sau doar responsabilitățile?",
    key: "O listă de zece priorități nu este o ordine. Ordinea spune ce câștigă când resursele nu ajung.",
    items: [
      "Dacă întreb trei dintre oamenii mei ce contează cel mai mult trimestrul acesta, primesc același răspuns, în aceeași ordine.",
      "Fiecare owner poate spune pentru ce rezultat răspunde, nu doar ce are în fișa postului.",
      "Când două priorități se ciocnesc, oamenii știu care câștigă fără să mă întrebe."
    ]
  },
  {
    id: "capabilitate",
    title: "Capabilitate",
    desc: "Ownerul are cunoștințele, abilitățile și resursele necesare. Prioritizez capabilitatea și atitudinea, nu relația.",
    question: "I-aș da din nou acest rezultat acestei persoane, știind ce știu acum?",
    key: "Când relația decide cine primește rezultatul, accountability-ul devine o negociere personală.",
    items: [
      "Persoana care deține rezultatul a mai făcut ceva asemănător sau are un mod concret de a învăța.",
      "Bugetul, oamenii, timpul și informația necesare au fost agreate când s-a predat rezultatul.",
      "Rolurile se dau pe capabilitate și atitudine, nu pe relație, loialitate sau alte valori. Am oameni în echipă pe care simt că i-aș putea lăsa în locul meu."
    ]
  },
  {
    id: "autoritate",
    title: "Autoritate",
    desc: "Ownership-ul asupra rezultatului, drepturile de decizie și contribuțiile celorlalți sunt explicite. Contributorii au aceeași listă de priorități.",
    question: "Cine deține, cine decide, cine contribuie, și au toți aceeași listă?",
    key: "Accountability pentru un rezultat fără autoritate asupra lui nu e accountability. E o capcană.",
    items: [
      "Fiecare rezultat are un singur owner, iar contributorii știu că sunt contributori.",
      "Ownerul știe ce poate decide singur, ce trebuie să negocieze și ce trebuie să escaladeze.",
      "Contributorii au aceeași ordine a priorităților ca ownerul, deci rezultatul nu rămâne în coada lor pentru un timp nedefinit."
    ]
  },
  {
    id: "vizibilitate",
    title: "Vizibilitate",
    desc: "Progresul se vede față de ce s-a agreat, într-un ritm fix, cu semnale înainte de roșu.",
    question: "Care e ritmul, și arată amber sau doar verde și roșu?",
    key: "Vizibilitate pe rezultate, nu pe task-uri. Task-urile rămân ale omului.",
    items: [
      "Aș ști marți că suntem off-track, nu la sfârșitul lunii.",
      "Există un ritm fix (săptămânal, la două săptămâni) în care commitment-urile se revizuiesc înainte de orice altceva.",
      "Există amber alert practic: un semnal că rezultatul e în risc, înainte să fie roșu.",
      "Există closure pe commitment-urile care nu au fost duse la capăt."
    ]
  },
  {
    id: "consecinte",
    title: "Consecințe",
    desc: "Rezultatele schimbă ceva, pentru oameni și pentru roluri. A face vizibilă o problemă devreme este recompensat.",
    question: "Ce s-a întâmplat ultima dată când un rezultat a fost ratat? Și ultima dată când a fost livrat?",
    key: "Dacă rezultatul nu schimbă nimic pentru nimeni, sistemul bate discursul, iar consecințele sunt transferate în altă parte în sistem.",
    items: [
      "În ultimele șase luni, un rezultat livrat sau ratat a schimbat ceva concret pentru cineva.",
      "Aceste schimbări au fost comunicate clar și transparent atât față de persoană, cât și față de restul echipei.",
      "A face vizibilă o problemă devreme este recompensat / apreciat explicit, nu penalizat, tras la răspundere.",
      "Recunoașterea, deciziile pe rol și recompensele urmează rezultatele, nu activitatea sau loialitatea."
    ]
  }
];

export const TOTAL_ITEMS = CONDITIONS.reduce((n, c) => n + c.items.length, 0);

// Pragurile de interpretare și de evidențiere a diferențelor.
export const LEVELS = [
  { min: 4, label: "Condiție solidă", cls: "lvl-hi" },
  { min: 3, label: "Parțial prezentă", cls: "lvl-mid" },
  { min: 0, label: "Condiție fragilă", cls: "lvl-lo" }
];
export const DIVERGENCE = { medium: 2, high: 3 }; // diferența max − min pe o afirmație
export const OUTLIER = 1.5;                        // abaterea unei note față de media afirmației
