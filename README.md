# Explore Browser 🌐

**Explore** est un navigateur web moderne, rapide et sécurisé, conçu pour offrir une expérience utilisateur fluide et personnalisable.

## ✨ Fonctionnalités Principales

- **Interface Moderne & Fluide** : Animations soignées avec Framer Motion, design épuré.
- **Personnalisation Avancée** :
  - Thèmes (Clair / Sombre / Système)
  - Couleurs d'accentuation (Bleu, Violet, Vert, Orange, etc.)
  - Position des onglets (Haut, Bas, Gauche, Droite)
- **Gestion Intelligente des Onglets** :
  - Glisser-déposer pour réorganiser
  - Mode responsive (icônes uniquement quand beaucoup d'onglets)
- **Sécurité & Vie Privée** :
  - Bloqueur de publicités intégré
  - Indicateur de sécurité HTTPS
  - Gestion des permissions
- **Outils Intégrés** :
  - Intégration Discord (Suggestions & Feedback)
  - Gestionnaire de téléchargements
  - Historique et Favoris (avec synchronisation Supabase optionnelle)
  - Mode Lecteur

## 🚀 Installation & Développement

### Prérequis

- Node.js (v18 ou supérieur)
- npm ou yarn

### Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/Julien0ff/explore-app.git
   cd explore-app
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez le mode développement :
   ```bash
   npm run dev
   ```
   Cela ouvrira la fenêtre Electron avec le rechargement à chaud (HMR).

### Compilation (Build)

Pour créer l'exécutable pour Windows :

```bash
npm run build
```
L'installateur sera généré dans le dossier `dist` (ou configuré dans package.json).

## 🛠 Technologies

- **Electron** : Framework pour l'application de bureau
- **React** : Bibliothèque UI
- **TypeScript** : Typage statique pour la robustesse
- **Tailwind CSS** : Styles utilitaires
- **Framer Motion** : Animations fluides
- **Vite** : Bundler ultra-rapide

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request pour suggérer des améliorations.

## 📄 Licence

Ce projet est sous licence GNU GPL v3. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
=======
