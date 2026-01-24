# Architecture - AI Operations Manager pour Chaînes de Fast-Casual

## Vue d'ensemble

SaaS B2B multi-tenant pour l'optimisation opérationnelle des chaînes de restaurants.

## Stack technique

- **Frontend**: Next.js 14+ (App Router) avec TypeScript
- **Backend**: Next.js API Routes + Server Actions
- **Base de données**: PostgreSQL (via Supabase)
- **Authentification**: Clerk (multi-tenant)
- **Hébergement**: Vercel (Frontend) + Supabase (Backend/DB)
- **Styling**: Tailwind CSS + shadcn/ui

## Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Next.js Frontend (Vercel)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Dashboard  │  │  Analytics   │  │  Settings    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Next.js API Routes                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Sales API  │  │ Forecast API │  │  Alerts API   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Business Logic Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Forecast    │  │ Recommender  │  │   Alerts     │  │
│  │  Engine      │  │   Engine     │  │   Engine     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              PostgreSQL (Supabase)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Organizations│  │  Restaurants │  │    Sales     │  │
│  │   Products   │  │  Inventory   │  │  Forecasts   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Structure des dossiers

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Routes d'authentification
│   ├── (dashboard)/       # Routes protégées
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── restaurants/   # Gestion restaurants
│   │   ├── sales/         # Analyse des ventes
│   │   ├── forecasts/     # Prévisions
│   │   └── alerts/         # Alertes
│   └── api/               # API Routes
│       ├── sales/         # Endpoints ventes
│       ├── forecasts/     # Endpoints prévisions
│       ├── recommendations/ # Recommandations
│       └── alerts/        # Alertes
├── components/            # Composants React
│   ├── ui/               # Composants UI (shadcn)
│   ├── dashboard/        # Composants dashboard
│   └── charts/           # Graphiques
├── lib/                  # Utilitaires et logique métier
│   ├── db/              # Client DB & queries
│   ├── services/        # Services métier
│   │   ├── forecast.ts  # Moteur de prévision
│   │   ├── recommender.ts # Moteur de recommandations
│   │   └── alerts.ts     # Système d'alertes
│   ├── utils/           # Utilitaires
│   └── validations/     # Schémas Zod
├── types/               # Types TypeScript
└── prisma/             # Schéma Prisma (ou migrations SQL)
```

## Modèles de données

### Core Entities

1. **Organization** (Entreprise cliente)
   - id, name, clerk_org_id, created_at, updated_at

2. **Restaurant** (Établissement)
   - id, organization_id, name, address, timezone, created_at

3. **Product** (Produit vendu)
   - id, organization_id, name, category, unit_price, created_at

4. **Sale** (Vente)
   - id, restaurant_id, product_id, quantity, amount, sale_date, sale_hour, created_at

5. **Ingredient** (Ingrédient)
   - id, organization_id, name, unit, cost_per_unit, created_at

6. **ProductIngredient** (Recette)
   - product_id, ingredient_id, quantity_needed

7. **Inventory** (Stock)
   - id, restaurant_id, ingredient_id, current_stock, min_threshold, max_threshold, last_updated

8. **Forecast** (Prévision)
   - id, restaurant_id, product_id, forecast_date, forecasted_quantity, method, created_at

9. **Recommendation** (Recommandation)
   - id, restaurant_id, type (ORDER/STAFFING), data (JSON), priority, created_at

10. **Alert** (Alerte)
    - id, restaurant_id, type, severity, message, resolved, created_at

## Flux de données principaux

### 1. Import des ventes (CSV)
```
CSV Upload → Parse → Validate → Insert Sales → Trigger Forecast Update
```

### 2. Prévision des ventes
```
Historical Sales → Moving Average / Seasonality → Generate Forecasts
```

### 3. Recommandations
```
Forecasts + Inventory + Recipes → Calculate Order Quantities
Forecasts + Historical Patterns → Calculate Staffing Needs
```

### 4. Alertes
```
Inventory Check → Compare with Thresholds → Generate Alerts
Forecasts vs Inventory → Detect Shortage Risk → Generate Alerts
```

## Sécurité

- **Multi-tenancy**: Isolation par `organization_id` sur toutes les tables
- **Row Level Security**: Policies Supabase par organisation
- **Auth**: Clerk avec organisation-based access control
- **API**: Vérification de l'appartenance à l'organisation sur chaque requête

## Performance

- **Caching**: React Query pour les données fréquentes
- **Pagination**: Pour les grandes listes (ventes, etc.)
- **Indexes**: Sur les colonnes de jointure et de filtrage fréquentes
- **Batch Processing**: Pour les imports CSV volumineux
