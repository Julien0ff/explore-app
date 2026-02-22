# Configuration Supabase

Pour activer le backend réel, suivez ces étapes :

1.  **Créer un projet Supabase**
    *   Allez sur [supabase.com](https://supabase.com) et créez un nouveau projet.

2.  **Configurer la base de données**
    *   Allez dans l'éditeur SQL de votre projet Supabase.
    *   Copiez le contenu du fichier `supabase_schema.sql` (à la racine du projet).
    *   Collez-le dans l'éditeur SQL et exécutez-le. Cela créera les tables nécessaires (profiles, history, bookmarks).

3.  **Configurer l'authentification**
    *   Dans le menu "Authentication" > "Providers", activez "Email".
    *   Pour Discord, activez le provider Discord et suivez les instructions de Supabase pour obtenir les clés (Client ID / Secret).

4.  **Lier le projet**
    *   Créez un fichier `.env` à la racine du projet (copiez `.env.example`).
    *   Remplissez les variables avec vos clés Supabase (disponibles dans Project Settings > API) :
        ```env
        VITE_SUPABASE_URL=votre_url_supabase
        VITE_SUPABASE_ANON_KEY=votre_cle_anon_publique
        ```

5.  **Redémarrer l'application**
    *   Relancez `npm run dev` pour prendre en compte les nouvelles variables d'environnement.
