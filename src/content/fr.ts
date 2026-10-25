export const COPY_STATUS: "draft:copy-new-v1" | "approved" = "approved";

/** D16. Option 1 is the default. Any other value fails check:launch. */
export const COPY_D16: "pending" | "v2-opt1" | "v2-opt2" = "v2-opt1";

export const DRAFT_LABEL = "BROUILLON";

/** Design-spec placeholder chrome. Not a writer slot. */
export const placeholders = {
  title: "Visuel à fournir",
  "hero-reader": "Écran principal 2.0.x : lecteur, histoire illustrée",
  "shot-library": "Capture 1 : choisir une histoire (bibliothèque)",
  "shot-reader": "Capture 2 : lecteur, une page d’histoire",
} as const;

export const copy = {
  wordmark: "Lingumaster",
  hero: {
    headline: "Ton anglais, une histoire à la fois",
    subline:
      "Apprends l’anglais, et d’autres langues, avec des histoires illustrées, puis des exercices pour pratiquer. Sur iPhone.",
    imageAlt:
      "Écran de l’app Lingumaster : l’histoire « The Corner Café », avec son illustration et son texte",
  },
  badge: {
    imageAltNote: "(vide : alt=\"\", le nom vient de l’aria-label du lien)",
    ariaLabel: "Télécharger dans l’App Store : Lingumaster",
  },
  benefits: [
    {
      title: "Apprends en lisant",
      line: "Des histoires illustrées, à lire chaque jour.",
    },
    {
      title: "Tu lis, puis tu pratiques",
      line: "Exercice mot manquant : complète la phrase avec le bon mot.",
    },
    {
      title: "Écoute, puis écris",
      line: "Exercice d’écoute : tu écoutes, puis tu écris ce que tu as entendu.",
    },
  ],
  headings: {
    benefits: "Ce que tu fais dans l’app",
    captures: "Aperçu de l’app",
  },
  captures: [
    {
      caption: "Choisis ton histoire",
      alt: "Écran de Lingumaster : la bibliothèque, avec des histoires et des articles à choisir",
    },
    {
      caption: "Lis l’histoire, la traduction juste en dessous",
      alt: "Écran de Lingumaster : une page de lecture, des mots surlignés et la traduction française sous chaque paragraphe",
      variant: "Des mots en surbrillance dans le texte",
    },
  ],
  languages: {
    line: "Six langues à apprendre : anglais, espagnol, portugais, français, allemand, italien.",
  },
  trust: {
    line: "L’app de @lingumaster, les défis d’anglais sur TikTok.",
  },
  finalCta: {
    headline: "Prêt pour ta première histoire ?",
    label: "Découvrir sur l’App Store",
  },
  footer: {
    privacy: "Confidentialité",
    terms: "Conditions",
    legal: "Mentions légales",
    contact: "Contact",
  },
  legal: {
    appleCredit:
      "Apple et le logo Apple sont des marques d’Apple Inc., déposées aux États-Unis et dans d’autres pays et régions. App Store est une marque de service d’Apple Inc.",
  },
  meta: {
    title: "Lingumaster : apprends l’anglais avec des histoires",
    description:
      "Des histoires illustrées pour apprendre l’anglais et d’autres langues, puis des exercices pour pratiquer. App iPhone, sur abonnement.",
    ogTitle: "Lingumaster : ton anglais, une histoire à la fois",
    ogDescription:
      "Lis des histoires illustrées pour apprendre l’anglais et d’autres langues. L’app de @lingumaster.",
  },
  notFound: {
    title: "Cette page n’existe pas",
    body: "Le lien est peut-être incorrect, ou la page a été déplacée. Reviens à l’accueil pour retrouver l’app.",
    cta: "Retour à l’accueil",
  },
} as const;
