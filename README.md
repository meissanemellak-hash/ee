# AI Operations Manager pour Chaînes de Fast-Casual

SaaS B2B pour optimiser les opérations des chaînes de restaurants multi-sites.

## 🎯 Objectif

Aider les dirigeants de chaînes de restaurants (5 à 30 établissements) à réduire leurs coûts opérationnels et gagner du temps grâce à des recommandations data-driven automatisées.

## 🚀 Fonctionnalités MVP

- ✅ Authentification multi-entreprises (Clerk)
- ✅ Gestion multi-restaurants
- ✅ Import des ventes (CSV)
- ✅ Analyse des ventes (jour, heure, restaurant, produit)
- ✅ Prévision des ventes (moyenne mobile, saisonnalité)
- ✅ Recommandations (commandes ingrédients, staffing)
- ✅ Système d'alertes (surstock, rupture, sur-effectif)
- ✅ Dashboard dirigeant

## 🛠️ Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Auth**: Clerk
- **Deployment**: Vercel

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Initialiser la base de données
npm run db:migrate

# Lancer le serveur de développement
npm run dev
```

## 🔧 Configuration

Voir `ARCHITECTURE.md` pour les détails d'architecture.

## 📝 License

Propriétaire
