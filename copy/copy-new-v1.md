# Lingumaster — nouvelle landing page, copy v1 (FR)

Pour : `github.com/gmanukya/lingumaster-landing`, page unique, visiteurs mobiles depuis le lien bio TikTok @lingumaster, seul objectif : un tap vers l’App Store. Rédigé le 23 oct. 2026 (WITA) par Lingumaster Writer. Lignes reprises de `copy-v2.md` quand c’est possible. **À valider par Gor.**

Règles : ni « essai » ni « gratuit » ; aucune mention d’IA ni de correction ; aucune promesse de tap-to-translate ; aucune note, aucun nombre d’utilisateurs ou de followers. Typographie : U+202F avant : ; ! ? et dans « » ; U+00A0 entre le prix et € ; apostrophe ’. Comptes générés par `build_copy_new_v1.py` (mots ou caractères Unicode, après typographie).

## Hero

| Slot | Texte | Compte |
|---|---|---|
| Headline (H1) | Ton anglais, une histoire à la fois | 7/8 mots |
| Subline | De courtes histoires illustrées en anglais, puis des exercices pour pratiquer. Une app iPhone en français. | 16/20 mots |
| Label CTA (à côté du badge App Store) | Découvrir sur l’App Store | 4/5 mots |
| Microcopy sous le badge (= ligne prix) | Abonnement : 9,99 €/mois ou 59,99 €/an | 38 car |

## 3 bénéfices

| Slot | Texte | Compte |
|---|---|---|
| Bénéfice 1 — titre | Apprends en lisant | 3/5 mots |
| Bénéfice 1 — ligne | De courtes histoires illustrées en anglais, à lire chaque jour. | 10/15 mots |
| Bénéfice 2 — titre | Tu lis, puis tu pratiques | 5/5 mots |
| Bénéfice 2 — ligne | Exercice mot manquant : complète la phrase avec le bon mot. | 10/15 mots |
| Bénéfice 3 — titre | Écoute, puis écris | 3/5 mots |
| Bénéfice 3 — ligne | Exercice d’écoute : tu écoutes, puis tu écris ce que tu as entendu. | 12/15 mots |

## Légendes des captures

| Slot | Texte | Compte |
|---|---|---|
| Capture 1 — live1.png (mosaïque de couvertures) | Choisis ton histoire | 3/8 mots |
| Capture 2 — live2.png (lecteur, phrase affichée en français) | Lis l’histoire, page après page | 5/8 mots |
| Capture 2 — variante | Une image pour chaque moment de l’histoire | 7/8 mots |

## Ligne de confiance (optionnelle)

| Slot | Texte | Compte |
|---|---|---|
| Trust line | L’app de @lingumaster, les défis d’anglais sur TikTok. | 8/12 mots |

## CTA final

| Slot | Texte | Compte |
|---|---|---|
| Headline | Prêt pour ta première histoire ? | 5/8 mots |
| Label CTA (à côté du badge) | Découvrir sur l’App Store | 4/5 mots |

## Prix

| Slot | Texte | Compte |
|---|---|---|
| Ligne prix (reprise de copy-v2) | Abonnement : 9,99 €/mois ou 59,99 €/an | 38 car |

## Footer

| Slot | Texte | Compte |
|---|---|---|
| Lien footer | Confidentialité | 15 car |
| Lien footer | Conditions | 10 car |
| Lien footer | Mentions légales | 16 car |
| Lien footer | Contact | 7 car |
| Mention marques Apple (footer, petit texte) | Apple et le logo Apple sont des marques d’Apple Inc., déposées aux États-Unis et dans d’autres pays et régions. App Store est une marque de service d’Apple Inc. | 160 car |

## Meta / partage

| Slot | Texte | Compte |
|---|---|---|
| Meta title | Lingumaster : apprends l’anglais avec des histoires | 51/60 car |
| Meta description | De courtes histoires illustrées en anglais et des exercices pour pratiquer. App iPhone en français, sur abonnement : 9,99 €/mois ou 59,99 €/an. | 143/155 car |
| Share card — titre (og:title) | Lingumaster : ton anglais, une histoire à la fois | 49/60 car |
| Share card — description (og:description) | Lis de courtes histoires en anglais, puis entraîne-toi avec des exercices. L’app de @lingumaster. | 97/110 car |

## Notes pour le design et l'intégration

- Le badge reste le badge officiel FR « Télécharger dans l’App Store », lien https://apps.apple.com/fr/app/lingumaster/id6504011014. Le label CTA est facultatif si le design préfère le badge seul ; la ligne prix reste collée au badge.
- Le CTA final reprend le même label et le même badge pour qu’il n’y ait qu’une action sur la page.
- Captures : Gor a choisi celles de la fiche App Store actuelle (`appstore-screens-fr-live/`). Captures 3 et 4 abandonnées pour la v1 (pas de capture dans la fiche) ; les bénéfices restent en texte. Capture 2 (live2) montre une phrase en français dans le lecteur : la légende parle donc de la lecture page par page (indicateur 2/10 visible), sans promettre ni l’anglais à l’écran ni une traduction. live1 et live2 ont déjà un titre incrusté (« Perfectionne ton anglais à travers des histoires captivantes. », « Histoires courtes et originales ») : les légendes évitent de le répéter. **live3 ne doit pas être utilisée** : son titre incrusté est « Corrections par intelligence artificielle » et le bouton « Correction avec IA », faux en 2.0.x. Variante si le design préfère une phrase plus vivante. Bénéfice 3 (écoute) : à confirmer sur iPhone avant publication.
- Mention Apple : formulation d’après les consignes d’Apple pour les badges App Store (version FR) ; à recopier depuis la page Apple Marketing Guidelines si leur texte FR exact diffère.
- Alt text : reprendre ceux de `copy-v2.md` (§ Alt text), à revérifier contre les images finales.
- Footer : « Mentions légales » → `/mentions-legales`, page à créer avant publication. « Contact » : il me faut l’adresse ou la cible voulue par Gor ; je n’en ai pas inventé.
- Ligne de confiance : facultative, sans chiffre. Elle dit seulement que l’app vient du compte TikTok @lingumaster.
- Headline B de copy-v2 (tap-to-translate) reste bloqué jusqu’au fix testé sur iPhone.

## Sources

- Histoires courtes illustrées, lecture quotidienne, iPhone, app en français, abonnement requis : fiche App Store FR id6504011014.
- Exercices mot manquant et écoute : spec `2026-10-23_landing-french-content.md` §9 et revue de code vocab-tab.
- 9,99 €/mois et 59,99 €/an : fiche App Store FR plus preuve RevenueCat consignée au §4.4 du spec.
