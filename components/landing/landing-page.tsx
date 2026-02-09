import Link from 'next/link'
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Bell,
  Package,
  Store,
  Target,
  CheckCircle2,
  Quote,
  Play,
  LayoutDashboard,
  BellRing,
  Shield,
  LifeBuoy,
  Lock,
  Server,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/** URL brute depuis .env (embed YouTube/Vimeo ou YouTube watch). */
const RAW_DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_LANDING_DEMO_VIDEO_URL?.trim() || ''

/** Retourne une URL d'embed valide (accepte youtube.com/watch?v= ou youtu.be/ en entrée). */
function getDemoVideoEmbedUrl(raw: string): string {
  if (!raw) return ''
  try {
    const url = new URL(raw)
    // YouTube watch → embed
    if (url.hostname === 'www.youtube.com' && url.pathname === '/watch' && url.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${url.searchParams.get('v')}`
    }
    if (url.hostname === 'youtube.com' && url.pathname === '/watch' && url.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${url.searchParams.get('v')}`
    }
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }
    // Déjà embed YouTube / Vimeo ou autre
    return raw
  } catch {
    return raw
  }
}

const DEMO_VIDEO_URL = getDemoVideoEmbedUrl(RAW_DEMO_VIDEO_URL)

function DemoVideoBlock() {
  if (DEMO_VIDEO_URL) {
    return (
      <div className="mt-10 flex justify-center" aria-labelledby="demo-video-label">
        <h2 id="demo-video-label" className="sr-only">
          Vidéo de démonstration
        </h2>
        <div className="relative w-full max-w-2xl aspect-video rounded-xl border border-border bg-muted/30 overflow-hidden shadow-lg">
          <iframe
            src={DEMO_VIDEO_URL}
            title="Vidéo de démonstration IA Restaurant Manager"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    )
  }
  return (
    <div className="mt-10 flex justify-center">
      <div
        className="relative w-full max-w-2xl aspect-video rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center group"
        role="presentation"
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
            <Play className="h-8 w-8 ml-1" fill="currentColor" aria-hidden />
          </div>
          <span className="text-sm font-medium">Vidéo de démonstration</span>
          <span className="text-xs">Disponible sur demande</span>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-muted/25">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
              <span className="text-xl">IA Restaurant Manager</span>
            </Link>
            <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navigation principale">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Se connecter</Link>
              </Button>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white border-0">
                <Link href="#tarifs">Demander une démo</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Pilotez vos restaurants sur
              <span className="block mt-2 text-teal-600 dark:text-teal-400">une seule plate-forme</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Gaspillage, ruptures de stocks, Excel partout : vous perdez du temps et de l&apos;argent. 
              Reprenez la main : ventes, inventaire et alertes en un endroit, des économies concrètes et des stocks maîtrisés.
            </p>
            {/* Ancres en pills (3 principales) */}
            <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Aller à une section">
              <a href="#pour-qui" className="rounded-full bg-muted/60 hover:bg-muted border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pour qui
              </a>
              <a href="#confiance" className="rounded-full bg-muted/60 hover:bg-muted border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sécurité
              </a>
              <a href="#faq" className="rounded-full bg-muted/60 hover:bg-muted border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </nav>
          </div>
        </section>

        {/* Aperçu du produit */}
        <section id="apercu" className="py-16 lg:py-20 border-t border-border/60 bg-background/50" aria-labelledby="apercu-titre">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 id="apercu-titre" className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Aperçu du produit
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
              Bénéfice : visualisez vos économies en temps réel et pilotez vos restaurants avec des recommandations actionnables, comme dans votre tableau de bord.
            </p>

            {/* Mockup aligné sur le vrai dashboard */}
            <div className="mt-10 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" aria-hidden />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" aria-hidden />
                  <span className="h-3 w-3 rounded-full bg-teal-400/80" aria-hidden />
                </div>
                <div className="flex-1 flex justify-center">
                  <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-md">
                    Tableau de bord · IA Restaurant Manager
                  </span>
                </div>
              </div>
              <div className="p-6 lg:p-8 bg-muted/25 min-h-[280px]">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Vue d&apos;ensemble</p>
                <div className="rounded-xl bg-teal-600 dark:bg-teal-700 p-4 mb-4">
                  <p className="text-xs font-medium text-teal-100 uppercase tracking-wide">Économies générées ce mois-ci</p>
                  <p className="mt-1 text-2xl font-bold text-white">3 478 €</p>
                  <p className="text-xs text-teal-100/90">Basé sur recommandations appliquées</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[160px] rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium text-sm">Recommandations appliquées</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-foreground">51</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-medium text-teal-600 dark:text-teal-400">
                      <TrendingUp className="h-4 w-4" />
                      3 478 € économisés
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">vs. 2 890 € période précédente</p>
                  </div>
                  <div className="flex-1 min-w-[160px] rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium text-sm">Risque de rupture (7j)</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-foreground">1 restaurant</p>
                    <p className="text-xs text-muted-foreground">concerné</p>
                  </div>
                  <div className="flex-1 min-w-[160px] rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                      <Package className="h-5 w-5" />
                      <span className="font-medium text-sm">Gaspillage estimé</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-foreground">821 €</p>
                    <p className="text-xs text-muted-foreground">Produits surstockés ce mois-ci</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini vignettes : Dashboard, Restaurants, Alertes */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: LayoutDashboard, label: 'Tableau de bord', desc: 'Vue groupe et KPIs' },
                { icon: Store, label: 'Restaurants', desc: 'Liste et détail par restaurant' },
                { icon: BellRing, label: 'Alertes & rapports', desc: 'Suivi et recommandations' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <item.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vidéo de démonstration : iframe si URL configurée, sinon placeholder */}
            <DemoVideoBlock />
          </div>
        </section>

        {/* Preuve sociale */}
        <section className="py-16 lg:py-20 border-t border-border/60 bg-background/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Ils pilotent déjà avec IA Restaurant Manager
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
              Bénéfices : centralisez vos restaurants, réduisez le gaspillage et les ruptures de stock, dégagez des économies concrètes et gagnez du temps sur le suivi opérationnel.
            </p>

            {/* 3 indicateurs percutants */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 sm:gap-8">
              <div className="text-center min-w-[140px] rounded-xl border-2 border-teal-200/80 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/30 px-6 py-5 shadow-sm">
                <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">–20 %</p>
                <p className="text-sm font-semibold text-foreground mt-1">de gaspillage</p>
                <p className="text-xs text-muted-foreground mt-0.5">Moins de perte, plus de marge</p>
              </div>
              <div className="text-center min-w-[140px] rounded-xl border-2 border-teal-200/80 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/30 px-6 py-5 shadow-sm">
                <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">–35 %</p>
                <p className="text-sm font-semibold text-foreground mt-1">de ruptures de stock</p>
                <p className="text-xs text-muted-foreground mt-0.5">Service assuré, clients sereins</p>
              </div>
              <div className="text-center min-w-[140px] rounded-xl border-2 border-teal-200/80 dark:border-teal-800/80 bg-teal-50/50 dark:bg-teal-950/30 px-6 py-5 shadow-sm">
                <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">+15 %</p>
                <p className="text-sm font-semibold text-foreground mt-1">de marge</p>
                <p className="text-xs text-muted-foreground mt-0.5">Maîtrise des achats et du stock</p>
              </div>
            </div>

            {/* Témoignages */}
            <div className="mt-14 grid gap-8 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <Quote className="h-8 w-8 text-teal-600 dark:text-teal-400 opacity-60" aria-hidden />
                <blockquote className="mt-3 text-foreground">
                  &ldquo;On avait les ventes dans un tableur, l&apos;inventaire dans un autre, et les alertes par téléphone. 
                  Aujourd&apos;hui tout est au même endroit. On voit tout de suite quel restaurant décroche.&rdquo;
                </blockquote>
                <p className="mt-3 text-sm font-semibold text-teal-600 dark:text-teal-400">
                  → 40 % de temps gagné sur le suivi de ses restaurants
                </p>
                <footer className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-semibold text-sm">
                    M. D.
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Directeur opérations</p>
                    <p className="text-xs text-muted-foreground">Chaîne de 12 restaurants</p>
                  </div>
                </footer>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <Quote className="h-8 w-8 text-teal-600 dark:text-teal-400 opacity-60" aria-hidden />
                <blockquote className="mt-3 text-foreground">
                  &ldquo;Les alertes nous ont fait gagner des heures. Avant on apprenait les ruptures le soir. 
                  Maintenant on anticipe et on compare les restaurants entre eux.&rdquo;
                </blockquote>
                <p className="mt-3 text-sm font-semibold text-teal-600 dark:text-teal-400">
                  → 50 % de ruptures de stock en moins grâce aux alertes
                </p>
                <footer className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-semibold text-sm">
                    S. L.
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Responsable achats</p>
                    <p className="text-xs text-muted-foreground">Groupe multi-restaurants</p>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </section>

        {/* Douleurs */}
        <section className="py-16 lg:py-20 border-t border-border/60 bg-background/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Ces problèmes vous parlent ?
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
              Sans outil dédié, vous pilotez à l&apos;aveugle. Avec IA Restaurant Manager, vous retrouvez la visibilité, la réactivité et des bénéfices mesurables : moins de gaspillage, moins de ruptures de stocks, plus de marge.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: TrendingDown,
                  title: 'Gaspillage et surstock',
                  text: 'Vous commandez au feeling, les frigos débordent ou au contraire vous êtes en rupture au moment du service.',
                },
                {
                  icon: AlertTriangle,
                  title: 'Alertes trop tard',
                  text: 'Vous apprenez les problèmes après coup : rupture, dérive des coûts, écarts entre restaurants.',
                },
                {
                  icon: FileSpreadsheet,
                  title: 'Excel partout',
                  text: 'Des tableaux différents par restaurant, des versions qui circulent, des erreurs de saisie et zéro vue consolidée.',
                },
                {
                  icon: BarChart3,
                  title: 'Pas de pilotage réel',
                  text: 'Impossible de comparer les restaurants, de voir les tendances ou d’anticiper les commandes et les besoins en personnel.',
                },
                {
                  icon: Bell,
                  title: 'Réactivité en retard',
                  text: 'Les équipes terrain et la direction ne sont pas alignées : les décisions arrivent trop tard.',
                },
                {
                  icon: Package,
                  title: 'Recettes et coûts flous',
                  text: 'Difficile de savoir quel produit rapporte, quel ingrédient coûte trop cher ou quelle recette ajuster.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                      <item.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Une seule plateforme pour tout piloter
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
              Tout est centralisé pour le multi-restaurants. Bénéfices : moins de temps perdu, moins de ruptures, des économies mesurables sur les achats et le gaspillage.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Store,
                  title: 'Vue groupe et par restaurant',
                  text: 'Consultez en un coup d’œil tous vos établissements, comparez les performances et identifiez les restaurants à risque.',
                },
                {
                  icon: Package,
                  title: 'Inventaire et recettes',
                  text: 'Produits, ingrédients et recettes par restaurant. Suivez les stocks et les seuils d’alerte pour éviter ruptures et surstock.',
                },
                {
                  icon: BarChart3,
                  title: 'Ventes et analyse',
                  text: 'Saisie des ventes, analyse par période et par restaurant. Import CSV possible pour raccorder vos flux existants.',
                },
                {
                  icon: Target,
                  title: 'Prévisions et recommandations',
                  text: 'Anticipez les besoins et recevez des recommandations actionnables pour optimiser commandes et coûts.',
                },
                {
                  icon: Bell,
                  title: 'Alertes en temps réel',
                  text: 'Ruptures, dérives et anomalies remontées immédiatement. Priorisez et résolvez avant que le client ne subisse.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Rapports et économies',
                  text: 'Générez des rapports (ventes, alertes, recommandations) et mesurez les économies réalisées sur la durée.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-600">
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pour qui */}
        <section id="pour-qui" className="py-16 lg:py-20 border-t border-border/60 bg-background/50" aria-labelledby="pour-qui-titre">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 id="pour-qui-titre" className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Pour qui ?
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
              Que vous gériez 3 établissements ou 30 : bénéfices concrets : visibilité en temps réel, réduction du gaspillage et des ruptures, pilotage des coûts et économies sur les achats.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Chaînes de restaurants',
                  text: 'Centralisez ventes, inventaire et alertes sur tous vos restaurants. Comparez les performances, identifiez les décrocheurs et pilotez à l\'échelle du groupe.',
                },
                {
                  title: 'Groupes multi-restaurants',
                  text: 'Restaurants indépendants ou franchises : une seule plateforme pour la direction et les équipes terrain. Vue groupe et vue par établissement.',
                },
                {
                  title: 'Direction opérations',
                  text: 'Tableau de bord unifié, alertes en temps réel et rapports pour prendre les bonnes décisions. Moins de tableaux Excel, plus de pilotage efficace.',
                },
                {
                  title: 'Achats & logistique',
                  text: 'Suivez les stocks, les seuils d\'alerte et les prévisions. Réduisez le gaspillage et les ruptures de stocks en anticipant les besoins par restaurant.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing / Offres */}
        <section id="tarifs" className="py-16 lg:py-20 border-t border-border/60 bg-background/50" aria-labelledby="tarifs-titre">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 id="tarifs-titre" className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Une offre pensée pour la croissance
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
              Tarification adaptée à votre périmètre (Essentiel, Croissance, Pro). Un investissement qui se traduit par des économies concrètes et le pilotage de vos restaurants sur une seule plate-forme.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
              {[
                { plan: 'essentiel', name: 'Essentiel', range: '1 à 5 restaurants', price: '1 500', cta: 'Planifier ma démo', href: '/demo?plan=essentiel' },
                { plan: 'croissance', name: 'Croissance', range: '6 à 10 restaurants', price: '3 000', cta: 'Planifier ma démo', href: '/demo?plan=croissance' },
                { plan: 'pro', name: 'Pro', range: '10+ restaurants', price: '5 000', cta: 'Planifier ma démo', href: '/demo?plan=pro' },
              ].map((tier) => (
                <div
                  key={tier.plan}
                  className="rounded-xl border-2 border-border bg-card p-6 text-center flex flex-col"
                >
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-400 uppercase tracking-wide">{tier.name}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{tier.range}</p>
                  <p className="mt-4 text-3xl font-bold text-foreground">
                    <span className="text-teal-600 dark:text-teal-400">{tier.price} €</span>
                    <span className="text-base font-normal text-muted-foreground"> / mois</span>
                  </p>
                  <Button asChild size="lg" className="mt-6 w-full border-0 bg-teal-600 hover:bg-teal-700 text-white">
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Tous les plans incluent les mêmes fonctionnalités.
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground list-none">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                Tableau de bord multi-restaurants
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                Ventes, inventaire, alertes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                Prévisions et rapports
              </li>
            </ul>
          </div>
        </section>

        {/* Confiance : sécurité, support */}
        <section id="confiance" className="py-16 lg:py-20 border-t border-border/60 bg-background/50" aria-labelledby="confiance-titre">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 id="confiance-titre" className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Sécurité et support
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
              Vos données et votre activité sont protégées. Nous sommes à vos côtés pour déployer et faire évoluer la plateforme.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Shield,
                  title: 'Sécurité des données',
                  text: 'Chiffrement et bonnes pratiques pour protéger vos données sensibles (ventes, stocks, coûts).',
                },
                {
                  icon: Lock,
                  title: 'Accès sécurisé',
                  text: 'Authentification fiable, rôles et permissions par organisation et par restaurant.',
                },
                {
                  icon: Server,
                  title: 'Disponibilité',
                  text: 'Infrastructure hébergée et maintenue pour une disponibilité optimale de la plateforme.',
                },
                {
                  icon: LifeBuoy,
                  title: 'Support dédié',
                  text: 'Équipe à l\'écoute pour l\'onboarding, la formation et le suivi (plans Croissance et Pro).',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm text-center"
                >
                  <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                      <item.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 lg:py-20 border-t border-border/60 bg-background/50" aria-labelledby="faq-titre">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 id="faq-titre" className="text-2xl font-bold text-center text-foreground sm:text-3xl">
              Questions fréquentes
            </h2>
            <p className="mt-3 text-center text-muted-foreground max-w-xl mx-auto">
              Réponses utiles pour évaluer les bénéfices d&apos;IA Restaurant Manager sur votre activité et votre ROI.
            </p>
            <dl className="mt-12 max-w-2xl mx-auto space-y-4">
              {[
                {
                  q: 'Pour qui est conçue la plateforme ?',
                  a: 'IA Restaurant Manager est pensée pour les groupes et chaînes qui gèrent plusieurs établissements (restaurants, points de vente). Que vous ayez 3 ou 30 restaurants, la plateforme centralise ventes, inventaire, alertes et prévisions sur un seul tableau de bord.',
                },
                {
                  q: 'Comment sont calculés les tarifs ?',
                  a: 'La tarification dépend du nombre de restaurants : Essentiel (1–5), Croissance (6–10), Pro (10+). À partir de 1 500 € / mois. Un devis personnalisé vous est proposé selon votre périmètre.',
                },
                {
                  q: 'Peut-on connecter nos outils existants (caisse, Excel) ?',
                  a: 'Oui. Vous pouvez saisir les ventes manuellement ou importer des données (CSV). L\'objectif est de centraliser les informations pour avoir une vue groupe, tout en gardant la possibilité de faire évoluer les intégrations selon vos besoins.',
                },
                {
                  q: 'Comment se passe la mise en place et le support ?',
                  a: 'Pour les plans Croissance et Pro, nous assurons un onboarding, une formation des équipes et un support prioritaire. L\'équipe vous accompagne pour configurer les restaurants, les alertes et les rapports selon votre organisation.',
                },
              ].map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-border bg-card shadow-sm overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-6 py-4 font-semibold text-foreground cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span className="shrink-0 text-teal-600 dark:text-teal-400 transition-transform group-open:rotate-180" aria-hidden>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </div>
                </details>
              ))}
            </dl>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/60 py-10 bg-background/50" role="contentinfo">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} IA Restaurant Manager. Tous droits réservés.
              </p>
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Pied de page">
                <Link href="/mentions-legales" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
                <Link href="/confidentialite" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Confidentialité
                </Link>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </nav>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
