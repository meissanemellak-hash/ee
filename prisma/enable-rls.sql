-- Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase Dashboard → SQL Editor
-- Your app uses the role "postgres" (DATABASE_URL); policies below allow that role full access so the app keeps working.
-- Other roles (e.g. anon, authenticated) will have no access unless you add more policies.
-- If your connection uses another role (e.g. postgres.xxx with pooler), replace "postgres" in TO postgres below.

-- 1. organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_organizations_app" ON public.organizations;
CREATE POLICY "rls_organizations_app" ON public.organizations
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 2. restaurants
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_restaurants_app" ON public.restaurants;
CREATE POLICY "rls_restaurants_app" ON public.restaurants
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 3. products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_products_app" ON public.products;
CREATE POLICY "rls_products_app" ON public.products
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 4. ingredients
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_ingredients_app" ON public.ingredients;
CREATE POLICY "rls_ingredients_app" ON public.ingredients
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 5. product_ingredients
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_product_ingredients_app" ON public.product_ingredients;
CREATE POLICY "rls_product_ingredients_app" ON public.product_ingredients
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 6. sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_sales_app" ON public.sales;
CREATE POLICY "rls_sales_app" ON public.sales
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 7. inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_inventory_app" ON public.inventory;
CREATE POLICY "rls_inventory_app" ON public.inventory
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 8. forecasts
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_forecasts_app" ON public.forecasts;
CREATE POLICY "rls_forecasts_app" ON public.forecasts
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 9. recommendations
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_recommendations_app" ON public.recommendations;
CREATE POLICY "rls_recommendations_app" ON public.recommendations
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 10. alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_alerts_app" ON public.alerts;
CREATE POLICY "rls_alerts_app" ON public.alerts
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 11. planned_staffing
ALTER TABLE public.planned_staffing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_planned_staffing_app" ON public.planned_staffing;
CREATE POLICY "rls_planned_staffing_app" ON public.planned_staffing
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 12. subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_subscriptions_app" ON public.subscriptions;
CREATE POLICY "rls_subscriptions_app" ON public.subscriptions
  FOR ALL TO postgres USING (true) WITH CHECK (true);

-- 13. _prisma_migrations (used by Prisma migrate)
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rls_prisma_migrations_app" ON public._prisma_migrations;
CREATE POLICY "rls_prisma_migrations_app" ON public._prisma_migrations
  FOR ALL TO postgres USING (true) WITH CHECK (true);
