export const COPY_STATUS: "draft:copy-new-v1" | "approved" = "approved";

export const DRAFT_LABEL = "BROUILLON";

/** Design-spec placeholder chrome. Not a writer slot. */
export const placeholders = {
  title: "Visuel à fournir",
  "hero-library": "Écran principal 2.0.x : bibliothèque d’histoires illustrées",
  "shot-library": "Capture 1 : choisir une histoire (bibliothèque)",
  "shot-reader": "Capture 2 : lecteur, une page d’histoire",
} as const;

export const copy = {
  wordmark: "Lingumaster",
  hero: {
    headline: "Ton anglais, une histoire à la fois",
    subline: "De courtes histoires illustrées en anglais, puis des exercices pour pratiquer. Une app iPhone en français.",
    imageAlt: "Écran de l’app Lingumaster : la bibliothèque d’histoires illustrées en anglais",
  },
  badge: {
    ariaLabel: "Télécharger dans l’App Store : Lingumaster",
  },
  benefits: [
    {
      title: "Apprends en lisant",
      line: "De courtes histoires illustrées en anglais, à lire chaque jour.",
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
      alt: "Écran de Lingumaster : choix d’une histoire illustrée dans la bibliothèque",
    },
    {
      caption: "Lis l’histoire, page après page",
      alt: "Écran de Lingumaster : une page d’histoire, avec son illustration et sa phrase",
      variant: "Une image pour chaque moment de l’histoire",
    },
  ],
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
    appleCredit: "Apple et le logo Apple sont des marques d’Apple Inc., déposées aux États-Unis et dans d’autres pays et régions. App Store est une marque de service d’Apple Inc.",
  },
  meta: {
    title: "Lingumaster : apprends l’anglais avec des histoires",
    description: "De courtes histoires illustrées en anglais et des exercices pour pratiquer. App iPhone en français, sur abonnement.",
    ogTitle: "Lingumaster : ton anglais, une histoire à la fois",
    ogDescription: "Lis de courtes histoires en anglais, puis entraîne-toi avec des exercices. L’app de @lingumaster.",
  },
} as const;
