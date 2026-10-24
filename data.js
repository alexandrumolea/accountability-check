// Conținutul evaluării, în română și engleză. Textele pot fi editate liber.
// Ordinea și numărul afirmațiilor trebuie să fie aceleași în ambele limbi: răspunsurile sunt salvate pe poziție.
export const LANGS = ["ro", "en"];

export const CONTENT = {
  ro: {
    scale: ["Dezacord complet", "Dezacord", "Parțial", "Acord", "Acord complet"],
    levels: ["Condiție solidă", "Parțial prezentă", "Condiție fragilă"],
    conditions: [
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
    ]
  },

  en: {
    scale: ["Strongly disagree", "Disagree", "Partly", "Agree", "Strongly agree"],
    levels: ["Strong condition", "Partly present", "Fragile condition"],
    conditions: [
      {
        id: "claritate",
        title: "Clarity",
        desc: "Priorities are clear and ranked. The owner knows which results they are accountable for, not just what their responsibilities are.",
        question: "Is there an order, or just a list? Does the owner know the result, or only the responsibilities?",
        key: "A list of ten priorities is not an order. The order tells you what wins when resources run short.",
        items: [
          "If I ask three of my people what matters most this quarter, I get the same answer, in the same order.",
          "Every owner can say which result they are accountable for, not just what is in their job description.",
          "When two priorities collide, people know which one wins without asking me."
        ]
      },
      {
        id: "capabilitate",
        title: "Capability",
        desc: "The owner has the knowledge, skills and resources needed. I prioritise capability and attitude, not relationships.",
        question: "Would I give this result to this person again, knowing what I know now?",
        key: "When relationships decide who gets the result, accountability becomes a personal negotiation.",
        items: [
          "The person who owns the result has done something similar before or has a concrete way to learn.",
          "The budget, people, time and information needed were agreed when the result was handed over.",
          "Roles are given on capability and attitude, not on relationships, loyalty or other values. I have people on the team who I feel could step into my place."
        ]
      },
      {
        id: "autoritate",
        title: "Authority",
        desc: "Ownership of the result, decision rights and the contributions of others are explicit. Contributors share the same list of priorities.",
        question: "Who owns, who decides, who contributes, and do they all have the same list?",
        key: "Accountability for a result without authority over it is not accountability. It is a trap.",
        items: [
          "Every result has a single owner, and contributors know they are contributors.",
          "The owner knows what they can decide alone, what they must negotiate and what they must escalate.",
          "Contributors share the owner's order of priorities, so the result does not sit at the back of their queue indefinitely."
        ]
      },
      {
        id: "vizibilitate",
        title: "Visibility",
        desc: "Progress is visible against what was agreed, at a fixed rhythm, with signals before red.",
        question: "What is the rhythm, and does it show amber or only green and red?",
        key: "Visibility on results, not on tasks. Tasks stay with the person.",
        items: [
          "I would know on Tuesday that we are off track, not at the end of the month.",
          "There is a fixed rhythm (weekly, every two weeks) in which commitments are reviewed before anything else.",
          "There is a working amber alert: a signal that the result is at risk, before it turns red.",
          "There is closure on commitments that were not delivered."
        ]
      },
      {
        id: "consecinte",
        title: "Consequences",
        desc: "Results change something, for people and for roles. Raising a problem early is rewarded.",
        question: "What happened the last time a result was missed? And the last time one was delivered?",
        key: "If the result changes nothing for anyone, the system beats the speech, and the consequences are shifted elsewhere in the system.",
        items: [
          "In the last six months, a delivered or missed result changed something concrete for someone.",
          "These changes were communicated clearly and openly, both to the person and to the rest of the team.",
          "Raising a problem early is explicitly rewarded / appreciated, not penalised or blamed.",
          "Recognition, role decisions and rewards follow results, not activity or loyalty."
        ]
      }
    ]
  }
};

export const TOTAL_ITEMS = CONTENT.ro.conditions.reduce((n, c) => n + c.items.length, 0);

// Pragurile de interpretare (în ordinea etichetelor din `levels`) și de evidențiere a diferențelor.
export const LEVELS = [
  { min: 4, cls: "lvl-hi" },
  { min: 3, cls: "lvl-mid" },
  { min: 0, cls: "lvl-lo" }
];
export const DIVERGENCE = { medium: 2, high: 3 }; // diferența max − min pe o afirmație
export const OUTLIER = 1.5;                        // abaterea unei note față de media afirmației
