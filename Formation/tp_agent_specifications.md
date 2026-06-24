# Projet : Agent Conversationnel - Tarifs Travaux Publics

Ce plan technique décrit comment nous allons construire et intégrer votre assistant pour SharePoint. Le but : un outil 100% accessible, premium et hybride, sans pré-requis techniques pour les utilisateurs (conducteurs de travaux, acheteurs, etc.).

## 1. 👥 Expérience Utilisateur (UX)
- **Environnement :** Page interne SharePoint (ordinateur, tablette, smartphone). L’application sera intégrée via une interface web *Responsive*.
- **Interaction Hybride :** Au choix, l'utilisateur tapera son besoin ou cliquera sur des boutons de suggestions rapides (ex. "Rechercher par Catégorie", "Sable", "Gravats").
- **Ton de l'Assistant :** Professionnel, précis, respectueux, pour garantir la pleine confiance des équipes.

## 2. 🎨 Charte Graphique et Design
L'interface sera moderne, esthétique tout en conservant les codes métiers. 
- **Couleur principale :** **Bleu Pâle** (qui apaise et offre un excellent contraste pour la lisibilité).
- **Couleur d’accentuation :** **Orange** (référence classique au secteur TP, utilisé pour les boutons d'action et les alertes importantes).
- **Format d'Affichage :** Sous forme de cartes produits (Image si disponible, Nom, Prix au devis par unité/quantité, Ville du fournisseur).

> [!TIP]
> **Maquette préliminaire générée** :
> ![Maquette Interface Utilisateur](C:\Users\Karen\.gemini\antigravity\brain\08b387fa-3e67-4692-a88d-6c3e586bcb12\tp_agent_mockup_1773603813852.png)

## 3. ⚙️ Architecture Technique
L'agent repose sur 3 piliers essentiels pour offrir de la rapidité et minimiser les erreurs.

### A. Frontend (Interface Utilisateur)
- **Technologie :** Réalisé en HTML/CSS Vanilla & Javascript interactif ou un framework moderne très léger comme React/ViteJS.
- **Authentification :** L'écran d'accueil demandera de s'identifier vi **Supabase Auth** :
  - Connexion Email / Mot de passe (qui se configure à la création).
  - Connexion rapide via bouton "Se connecter avec Google".

### B. Moteur d'Intelligence (n8n)
- **Rôle de Routeur :** L'interface envoie la requête (écrite ou cliquée) directement au Webhook de n8n.
- **Analyse IA :** n8n transmet la requête à un modèle de langue (ex: OpenAI) pour comprendre l'intention et extraire les mots-clés (ex: "Sable 0/4", "Tonne").
- **Formatage des erreurs :** Si l'IA détecte une faute de frappe ou si la requête est hors-sujet, l'IA trouvera les termes les plus proches pour garantir un résultat sans page d'erreur brutale.

### C. Base de Données (Supabase)
- **Consultation :** n8n va récupérer dans Supabase (tables des devis/produits) les tarifs en fonction de l'unité requise.
- Les données remontées incluront : `Nom`, `Prix Unitaire`, `Quantité`, et `Localisation (Ville)`.
- n8n agrège ces données et les renvoie à l'interface qui affichera de belles cartes.

## 4. 📝 Plan d'Implémentation Étape par Étape

1. **Initialisation de l'Application Web (Aujourd'hui) :**
   - Création de la structure du projet.
   - Mise en place du module d'Authentification (Supabase).
   - Intégration du code couleur Bleu pâle & Orange.
2. **Développement du module "Chat Hybride" :**
   - Création de la barre de recherche textuelle.
   - Ajout du carrousel de boutons tactiles de suggestions.
3. **Composants d'Affichage (Cartes Produits) :**
   - Création des cartes dynamiques pour les réponses de prix (avec variations selon les quantités).
4. **Connexion vers le Webhook n8n :**
   - Écriture de la logique d'envoi et de réception des réponses en format JSON.
5. **Livraison d'un package embed pour SharePoint :**
   - Exportation de l'application prête à être insérée dans l'intranet.

---

*L'architecture est validée techniquement avec ces spécifications.*
