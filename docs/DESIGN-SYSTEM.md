# Landry Net — Design system

**Version :** 1.0  
**Produit :** portfolio professionnel de Landry Kayoyo / Landry Net  
**Langue de référence :** français  
**Source de vérité visuelle :** `apps/web/src/index.css`  
**Source de vérité éditoriale :** contenu validé dans `apps/web/src/App.tsx` et l’API CMS

## 1. Rôle du système

Le design system de Landry Net traduit une pratique d’infrastructure IT en interface : précise, lisible, structurée et humaine. Il doit aider le visiteur à comprendre rapidement :

1. qui est Landry Kayoyo ;
2. ce qu’il fait ;
3. ses domaines d’expertise ;
4. ses projets réellement réalisés ;
5. son parcours ;
6. la manière de le contacter.

Le système privilégie les compositions éditoriales, les repères numérotés, les lignes fines et les images documentaires. Il évite les effets décoratifs gratuits, les promesses invérifiables et les interfaces génériques.

### Principes

- **Lisibilité avant décoration :** chaque contraste, ligne ou espace doit orienter la lecture.
- **Précision opérationnelle :** les intitulés, chiffres, technologies et liens doivent rester vérifiables.
- **Tension éditoriale :** grands titres, petites annotations monospace et compositions asymétriques créent un rythme premium.
- **Sobriété technique :** les animations accompagnent la hiérarchie et ne doivent jamais distraire.
- **Présence humaine :** les photos montrent le travail, la transmission et le contexte réel.
- **Accessibilité par défaut :** clavier, focus, contraste, textes alternatifs et réduction des animations sont obligatoires.

## 2. Architecture visuelle

Le site public utilise deux surfaces principales :

| Surface | Usage | Fond | Texte principal |
|---|---|---|---|
| Paper | expertise, publications, terrain, parcours | `#FFFFFF` | `#0D1118` |
| Ink | contact, footer et zones de contraste | `#FFFFFF` dans le rendu public actuel | `#0D1118` |

> Le CSS conserve des noms historiques comme `section-dark` et `--ink`. Dans le rendu public actuel, les overrides de fin de fichier rendent plusieurs sections claires. Lors d’une évolution, se baser sur les valeurs effectives et non uniquement sur les noms de classes.

### Grille et conteneurs

- Conteneur standard : `width: min(100% - 96px, 1340px)`.
- À partir de `1060px` : marge horizontale réduite à `28px`.
- Jusqu’à `800px` : marge horizontale réduite à `20px`.
- Le header desktop mesure `78px` de haut.
- Le header mobile mesure `68px` de haut.
- Le défilement utilise un `scroll-padding-top` de `80px`.
- Les grilles doivent utiliser `minmax(0, 1fr)` pour empêcher les débordements de contenu.
- Les images de formats fixes utilisent `aspect-ratio` plutôt que des hauteurs dépendantes du contenu.

### Rythme vertical

Les sections utilisent un rythme généreux, basé sur des multiples souples de `0.5rem` :

| Niveau | Valeur indicative | Usage |
|---|---:|---|
| XS | `0.4rem - 0.7rem` | écart icône/texte, micro-label |
| S | `0.8rem - 1.2rem` | champs, listes, légendes |
| M | `1.5rem - 2.5rem` | blocs internes, titres secondaires |
| L | `3rem - 5rem` | séparation de contenus |
| XL | `7rem - 8.5rem` | respiration entre sections |

Les valeurs de section peuvent descendre à environ `2.5rem - 3.5rem` sur mobile, mais la hiérarchie et la respiration doivent rester visibles.

## 3. Couleurs

### Tokens publics

```css
:root {
  --ink: #0d1118;
  --paper: #ecebe2;
  --paper-dim: #cbcbbd;
  --blue: #26b9ee;
  --lime: #c8eb4e;
  --line-dark: rgba(238, 239, 226, 0.14);
  --line-light: rgba(13, 17, 24, 0.18);
}
```

### Valeurs effectives du thème public clair

| Token / valeur | Couleur | Rôle |
|---|---|---|
| Ink | `#0D1118` | texte fort, titres, structure |
| White | `#FFFFFF` | surface principale actuelle |
| Paper | `#ECEBE2` | texte clair, superpositions photo, réserve de thème sombre |
| Blue | `#147FA8` | accent principal lisible sur fond clair, liens, repères |
| Electric blue | `#26B9EE` | accent lumineux, repères et éléments sur fond sombre |
| Lime | `#C8EB4E` | action principale, disponibilité, accent de signal |
| Line light | `rgba(13, 17, 24, .18)` | séparateurs sur surface claire |
| Line dark | `rgba(238, 239, 226, .14)` | séparateurs sur surface sombre |
| Destructive | `#C75246` / `#F49F8B` | erreur et validation invalide |

### Règles d’usage

- Utiliser `--ink` pour les titres et le texte à fort poids visuel.
- Utiliser le bleu pour les liens, les index et les éléments qui indiquent une navigation.
- Réserver le lime aux actions prioritaires, à l’état disponible et aux détails de signalisation.
- Ne pas utiliser le lime pour de longs paragraphes ou de grandes surfaces.
- Les bordures sont discrètes : elles structurent sans former des cadres lourds.
- Sur image, une superposition sombre peut garantir la lisibilité des légendes.
- Vérifier le contraste après toute nouvelle combinaison de couleur.

### Tokens admin

L’interface d’administration possède un thème séparé dans `src/admin.css` :

```css
--admin-ink: #101918;
--admin-muted: #6b7773;
--admin-line: #dfe6df;
--admin-paper: #f4f7f2;
--admin-card: #ffffff;
--admin-lime: #c8ef5b;
--admin-blue: #197d88;
--admin-danger: #b54843;
```

Ne pas mélanger les tokens admin et public dans une même page sans raison fonctionnelle.

## 4. Typographie

Les polices sont chargées depuis Google Fonts :

- **Syne** : titres, noms de sections, titres de cartes et messages forts.
- **DM Sans** : paragraphes, champs et lecture courante.
- **Space Mono** : navigation, index, métadonnées, labels et données techniques.

```css
--app-font-sans: 'DM Sans', sans-serif;
--app-font-display: 'Syne', sans-serif;
--app-font-mono: 'Space Mono', monospace;
```

### Hiérarchie

| Élément | Police | Traitement |
|---|---|---|
| H1 hero | Syne | très grand, `font-weight: 600`, interligne serré |
| H2 de section | Syne | grand, lignes courtes, accent possible en italique |
| H3 | Syne | titre de carte ou de bloc |
| Texte courant | DM Sans | `0.9rem - 1.3rem`, interligne `1.6 - 1.8` |
| Navigation | Space Mono | capitales, petit corps, espacement des lettres |
| Kicker / index | Space Mono | capitales, très petit corps, repère numéroté |

### Règles typographiques

- Les titres peuvent utiliser une chasse serrée, mais ne doivent jamais provoquer de chevauchement.
- Les accents visuels sont portés par `em` coloré et non par une nouvelle famille de caractères.
- Les labels techniques utilisent des capitales et un espacement positif.
- Ne pas utiliser de texte entièrement en capitales pour un paragraphe.
- Les titres longs doivent pouvoir se couper avec `overflow-wrap: anywhere` sur mobile.
- La lettre-spacing doit rester à `0` dans les composants utilitaires génériques ; les valeurs négatives existantes sont réservées aux titres éditoriaux du portfolio.

## 5. Composants

### 5.1 Header et navigation

Le header est fixe, translucide et séparé par une bordure fine.

- Logo carré de `40px` sur desktop et `35px` sur mobile.
- Wordmark en Space Mono.
- Navigation desktop en petites capitales avec index supérieur.
- CTA « Parlons projet » aligné à droite.
- À `800px` et moins, remplacer la navigation par un bouton hamburger.
- Le menu mobile bloque le scroll du body tant qu’il est ouvert.
- Le bouton doit exposer `aria-expanded` et une étiquette explicite.
- Chaque lien mobile ferme le menu après navigation.

### 5.2 Section kicker

Structure recommandée :

```tsx
<SectionKicker index="02">Champ d’action</SectionKicker>
```

Le kicker contient un index, une ligne et un libellé monospace. Il sert à ancrer la section, pas à remplacer son titre.

- Index bleu sur fond clair.
- Index lime sur fond sombre.
- Taille indicative : `0.59rem`.
- Espacement des lettres : environ `0.14em`.

### 5.3 Boutons

Le composant principal du site est `.button`.

| Variante | Usage | Aspect |
|---|---|---|
| Accent | action principale | fond lime, texte ink |
| Outline | action secondaire sur zone contrastée | fond transparent, bordure fine |
| Text link | navigation secondaire | soulignement bas, icône directionnelle |

Règles :

- Hauteur minimale recommandée : `47px` pour un CTA principal.
- Utiliser une icône Lucide quand elle clarifie la destination ou l’action.
- Les icônes ne doivent pas être l’unique information d’un bouton inconnu.
- Prévoir un état `disabled` lisible et non cliquable.
- Le hover peut déplacer légèrement le bouton vers le haut (`-3px`) ; ne pas animer la taille.
- Sur mobile, les boutons doivent pouvoir passer à la ligne sans débordement.

### 5.4 Cartes

Les cartes du site ne sont pas des conteneurs décoratifs empilés. Elles servent à cadrer une information répétée : expertise, publication, portrait ou résultat.

- Bordure `1px` discrète.
- Rayon nul dans le langage public éditorial, sauf composant générique shadcn réutilisé ailleurs.
- Padding courant : `1.1rem - 1.4rem`.
- Les cartes publication ont une hauteur minimale stable et placent le lien en bas avec `margin-top: auto`.
- Le hover modifie légèrement bordure, fond, ombre et position ; il ne change pas la structure.
- Éviter une carte dans une carte.

### 5.5 Formulaire de contact

Le formulaire est un élément fonctionnel, pas une décoration.

Champs obligatoires :

- Nom et prénom : au moins 2 caractères.
- E-mail : adresse valide.
- Sujet : au moins 3 caractères.
- Contexte : au moins 12 caractères.

États à couvrir :

- repos ;
- focus ;
- erreur champ ;
- erreur globale ;
- chargement ;
- succès ;
- échec de sauvegarde locale.

Les erreurs sont placées près du champ concerné. Le formulaire conserve un brouillon local si l’API échoue. Le bouton de soumission doit être désactivé pendant le chargement.

### 5.6 Images

- Les images doivent représenter une personne, une situation de travail ou un objet réellement lié à Landry Net.
- Toujours fournir un `alt` descriptif ; `alt=""` seulement pour une image purement décorative.
- Déclarer `width` et `height` pour éviter les sauts de mise en page.
- Utiliser `loading="lazy"` hors hero.
- Garder un cadrage stable avec `object-fit: cover` et un ratio explicite.
- Les traitements de saturation et de contraste sont modérés ; ils ne doivent pas rendre le sujet méconnaissable.

### 5.7 États vides et erreurs

Un état vide doit expliquer ce qui manque sans inventer de contenu. Une page introuvable doit offrir un retour clair vers la liste correspondante. Les messages d’erreur utilisent le rouge destructif avec une bordure latérale ou un état de champ, jamais une alerte uniquement colorée.

## 6. Iconographie

La bibliothèque utilisée est Lucide React.

- `ArrowUpRight` : lien externe, CTA ou navigation vers une autre page.
- `ArrowDownRight` : entrée dans une section ou retour orienté.
- `ChevronRight` : lien secondaire.
- `ChevronDown` : défilement ou menu.
- `Server`, `Network`, `Activity`, `ShieldCheck`, `Terminal` : familles d’expertise.
- `Menu` et `X` : ouverture et fermeture du menu mobile.
- `Send` : soumission du formulaire.
- `CheckCircle2` : confirmation.

Les icônes utilisent généralement une taille de `15px - 20px` et un trait fin. Elles doivent être accompagnées d’un libellé ou d’un nom accessible lorsqu’elles portent seules une action.

## 7. Motion

Le mouvement doit signaler une entrée, une interaction ou une direction.

- Les sections utilisent `Reveal` avec opacité et translation verticale limitée.
- Courbe principale : `[0.16, 1, 0.3, 1]`.
- Durée de révélation indicative : `700ms`.
- Les éléments d’une grille sont décalés de manière légère, environ `40ms - 60ms`.
- Les images peuvent effectuer un zoom très léger au survol.
- Le repère de défilement peut boucler doucement.
- Toute animation doit respecter `prefers-reduced-motion: reduce`.
- Ne pas ajouter de parallaxe, de rotation forte ou d’animation permanente sans information utile.

## 8. Responsive

| Point de rupture | Comportement |
|---:|---|
| `> 1060px` | grille desktop complète, navigation visible, compositions asymétriques |
| `801px - 1060px` | conteneurs resserrés, grilles réduites, navigation encore visible |
| `561px - 800px` | menu mobile, colonnes empilées, listes d’expertise réduites |
| `<= 560px` | une colonne, titres redimensionnés, champs empilés, images plus compactes |
| `<= 380px` | ajustements spécifiques aux légendes et tampons d’image |

Checklist responsive :

- aucun scroll horizontal ;
- titres longs lisibles ;
- CTA atteignables au pouce ;
- images sans écrasement ;
- menu mobile entièrement accessible ;
- grilles converties en une colonne quand la lecture l’exige ;
- texte des cartes contenu dans sa surface ;
- focus visible sur clavier et navigation mobile.

## 9. Accessibilité et qualité

- Utiliser des éléments HTML sémantiques : `header`, `nav`, `main`, `section`, `footer`, `form`, `figure`.
- Respecter une hiérarchie de titres cohérente : un H1 par vue, puis H2 et H3.
- Conserver les `aria-label`, `aria-expanded`, `aria-invalid`, `aria-live` et `role="alert"` lorsqu’ils décrivent un état réel.
- Ne jamais transmettre une information uniquement par la couleur.
- Les liens doivent avoir un nom compréhensible hors contexte.
- Le focus visible utilise un contour de `2px` lime avec un décalage de `4px`.
- Tester clavier, zoom navigateur, viewport mobile et réduction des animations.
- Vérifier les textes alternatifs et les liens externes avant publication.

## 10. Règles éditoriales

- Ne jamais inventer un client, projet, certification, résultat, lien ou technologie.
- Utiliser « projet », « pratique » ou « expérience » uniquement lorsque le contenu est documenté.
- Préférer des formulations concrètes : contexte, action, technologie réellement utilisée, résultat observé.
- Garder une voix calme, précise et professionnelle.
- Éviter les superlatifs non démontrés comme « expert mondial », « leader » ou « solution révolutionnaire ».
- Les CTA parlent d’une action réelle : « Voir mon approche », « Voir le détail », « Envoyer le contexte ».
- Les textes d’interface restent en français et les noms de technologies conservent leur graphie officielle.

## 11. Conventions d’implémentation

- Les styles du portfolio public sont centralisés dans `src/index.css`.
- Les styles de l’administration sont centralisés dans `src/admin.css`.
- Les icônes viennent de `lucide-react`.
- Les animations de révélation utilisent Framer Motion dans `App.tsx`.
- Les composants shadcn présents dans `src/components/ui` sont disponibles pour les vues applicatives, mais les composants éditoriaux du portfolio utilisent principalement les classes dédiées du site.
- Toute nouvelle couleur doit être ajoutée comme token avant d’être utilisée.
- Toute nouvelle variante de bouton ou de carte doit être justifiée par un besoin d’interaction distinct.
- Éviter de dupliquer un token avec une valeur hexadécimale locale si un token existant convient.

## 12. Checklist avant livraison

### Visuel

- [ ] La page respecte la palette Ink / White / Blue / Lime.
- [ ] La hiérarchie Syne / DM Sans / Space Mono est visible.
- [ ] Les lignes et index structurent la page sans la surcharger.
- [ ] Les cartes ont un ratio et une hauteur stables.
- [ ] Les accents lime restent réservés aux actions et signaux.

### Interaction

- [ ] Tous les liens et boutons ont une destination ou une action réelle.
- [ ] Les états hover, focus, disabled, chargement, erreur et succès sont couverts.
- [ ] Le menu mobile s’ouvre, se ferme et bloque le scroll correctement.
- [ ] Les animations sont désactivées ou réduites avec `prefers-reduced-motion`.

### Responsive et accessibilité

- [ ] Vérification à 1440px, 1024px, 768px, 390px et 320px.
- [ ] Aucun débordement horizontal.
- [ ] Navigation clavier complète.
- [ ] Contraste et textes alternatifs vérifiés.
- [ ] Build TypeScript et build Vite réussissent.

## 13. Évolution recommandée

À moyen terme, les tokens publics gagneraient à être regroupés dans une couche de variables explicitement sémantique (`--color-surface`, `--color-text`, `--color-action`, etc.) afin de réduire l’écart entre les noms historiques (`--ink`, `--paper`) et le rendu clair actuel. Cette évolution doit rester progressive : conserver les alias existants pendant la migration pour éviter de casser les pages et les composants.
