export const COPY_STATUS: "draft:copy-new-v1" | "approved" =
  "draft:copy-new-v1";

export const copy = {
  hero: {
    headline: "Ton anglais, une histoire à la fois",
    subline: "De courtes histoires illustrées en anglais, puis des exercices pour pratiquer. Une app iPhone en français.",
    ctaLabel: "Découvrir sur l’App Store",
    microcopy: "Abonnement : 9,99 €/mois ou 59,99 €/an",
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
  captures: [
    {
      caption: "Choisis ton histoire",
    },
    {
      caption: "Lis l’histoire, page après page",
      variant: "Une image pour chaque moment de l’histoire",
    },
  ],
  trust: {
    line: "L’app de @lingumaster, les défis d’anglais sur TikTok.",
  },
  finalCta: {
    headline: "Prêt pour ta première histoire ?",
    ctaLabel: "Découvrir sur l’App Store",
  },
  price: {
    line: "Abonnement : 9,99 €/mois ou 59,99 €/an",
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
    description: "De courtes histoires illustrées en anglais et des exercices pour pratiquer. App iPhone en français, sur abonnement : 9,99 €/mois ou 59,99 €/an.",
    ogTitle: "Lingumaster : ton anglais, une histoire à la fois",
    ogDescription: "Lis de courtes histoires en anglais, puis entraîne-toi avec des exercices. L’app de @lingumaster.",
  },
} as const;
