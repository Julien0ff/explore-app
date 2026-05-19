# Guide : Configuration de Supabase avec Resend (SMTP)

Ce guide vous explique comment configurer Supabase pour utiliser **Resend** comme fournisseur d'emails (SMTP). Cela permet d'envoyer des emails de confirmation et de réinitialisation de mot de passe de manière fiable.

## 1. Créer un compte Resend
1.  Allez sur [resend.com](https://resend.com) et créez un compte.
2.  Ajoutez et vérifiez votre domaine dans la section **Domains**.
3.  Générez une **API Key** dans la section **API Keys**.

## 2. Configurer Supabase
1.  Allez dans le tableau de bord [Supabase](https://supabase.com).
2.  Sélectionnez votre projet.
3.  Naviguez vers **Authentication** > **Providers** > **SMTP**.
4.  Activez **Enable SMTP**.
5.  Remplissez les champs suivants :
    *   **Sender E-mail** : `votre-email@votre-domaine.com` (doit être vérifié dans Resend).
    *   **Sender Name** : `Navigateur Explore` (ou le nom de votre choix).
    *   **SMTP Host** : `smtp.resend.com`
    *   **SMTP Port** : `465` (SSL) ou `587` (TLS).
    *   **SMTP User** : `resend` (c'est toujours `resend` pour cet hôte).
    *   **SMTP Password** : Votre API Key Resend générée à l'étape 1.

## 3. Configurer les Redirections (Important pour l'App Desktop)
Pour que les liens de confirmation et de réinitialisation de mot de passe renvoient l'utilisateur vers votre application Electron :

1.  Allez dans **Authentication** > **URL Configuration**.
2.  **Site URL** : `explore://auth/callback`
3.  **Redirect URLs** :
    *   `http://127.0.0.1:36963/auth/callback` (utilisé par le serveur local d'authentification).
    *   `explore://*` (pour supporter le protocole personnalisé).

## 4. Personnaliser les Emails
Dans **Authentication** > **Email Templates**, vous pouvez personnaliser les modèles de :
*   **Confirm Signup** (Confirmation d'inscription)
*   **Magic Link** (Lien magique)
*   **Change Email** (Changement d'email)
*   **Reset Password** (Réinitialisation du mot de passe)

> [!TIP]
> Assurez-vous que les liens dans les modèles utilisent bien `{{ .ConfirmationURL }}`.
