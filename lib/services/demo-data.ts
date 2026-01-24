import { prisma } from '../db/prisma'
import { generateBOMOrderRecommendations } from './recommender-bom'
import { runAllAlerts } from './alerts'

const DEMO_ORG_NAME = 'Demo Restaurant Chain'

/**
 * Génère des données de démonstration complètes
 * @param clerkOrgId - ID de l'organisation Clerk actuelle
 */
export async function generateDemoData(clerkOrgId: string) {
  // 1. Créer ou récupérer l'organisation de démo
  let organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  })

  if (!organization) {
    // Si l'organisation n'existe pas, la créer
    organization = await prisma.organization.create({
      data: {
        name: DEMO_ORG_NAME,
        clerkOrgId,
        shrinkPct: 0.1,
        isDemo: true,
      },
    })
  } else {
    // Mettre à jour pour s'assurer que c'est marqué comme démo
    organization = await prisma.organization.update({
      where: { id: organization.id },
      data: { isDemo: true },
    })
  }

  // 2. Créer 3 restaurants
  const restaurants = []
  const restaurantNames = [
    'Restaurant Paris Centre',
    'Restaurant Lyon Part-Dieu',
    'Restaurant Marseille Vieux-Port',
  ]
  const addresses = [
    '123 Rue de la Paix, 75001 Paris',
    '45 Cours de la République, 69002 Lyon',
    '78 Quai du Port, 13002 Marseille',
  ]

  for (let i = 0; i < 3; i++) {
    const existing = await prisma.restaurant.findFirst({
      where: {
        organizationId: organization.id,
        name: restaurantNames[i],
      },
    })

    if (!existing) {
      const restaurant = await prisma.restaurant.create({
        data: {
          organizationId: organization.id,
          name: restaurantNames[i],
          address: addresses[i],
          timezone: 'Europe/Paris',
        },
      })
      restaurants.push(restaurant)
    } else {
      restaurants.push(existing)
    }
  }

  // 3. Créer 25 ingrédients avec packs
  const ingredients = []
  const ingredientData = [
    { name: 'Pain à burger', unit: 'unité', cost: 0.5, pack: 20, supplier: 'Boulangerie Dupont' },
    { name: 'Steak haché', unit: 'kg', cost: 12.0, pack: 5, supplier: 'Boucherie Martin' },
    { name: 'Fromage cheddar', unit: 'kg', cost: 8.5, pack: 2, supplier: 'Fromagerie Leclerc' },
    { name: 'Salade', unit: 'kg', cost: 3.0, pack: 1, supplier: 'Primeur Frais' },
    { name: 'Tomate', unit: 'kg', cost: 2.5, pack: 2, supplier: 'Primeur Frais' },
    { name: 'Oignon', unit: 'kg', cost: 1.8, pack: 5, supplier: 'Primeur Frais' },
    { name: 'Cornichons', unit: 'kg', cost: 6.0, pack: 1, supplier: 'Conserverie Deluxe' },
    { name: 'Sauce burger', unit: 'L', cost: 4.5, pack: 5, supplier: 'Sauces & Co' },
    { name: 'Frites', unit: 'kg', cost: 2.0, pack: 10, supplier: 'Frites Premium' },
    { name: 'Huile de friture', unit: 'L', cost: 3.5, pack: 20, supplier: 'Huiles Pro' },
    { name: 'Poulet', unit: 'kg', cost: 9.0, pack: 5, supplier: 'Volaille Express' },
    { name: 'Bacon', unit: 'kg', cost: 15.0, pack: 2, supplier: 'Charcuterie Fine' },
    { name: 'Œufs', unit: 'unité', cost: 0.3, pack: 30, supplier: 'Œufs Frais' },
    { name: 'Avocat', unit: 'kg', cost: 7.0, pack: 3, supplier: 'Primeur Frais' },
    { name: 'Mayonnaise', unit: 'L', cost: 5.0, pack: 3, supplier: 'Sauces & Co' },
    { name: 'Ketchup', unit: 'L', cost: 3.0, pack: 5, supplier: 'Sauces & Co' },
    { name: 'Moutarde', unit: 'L', cost: 4.0, pack: 2, supplier: 'Sauces & Co' },
    { name: 'Pomme de terre', unit: 'kg', cost: 1.5, pack: 10, supplier: 'Primeur Frais' },
    { name: 'Laitue', unit: 'kg', cost: 2.8, pack: 2, supplier: 'Primeur Frais' },
    { name: 'Champignons', unit: 'kg', cost: 6.5, pack: 1, supplier: 'Primeur Frais' },
    { name: 'Poivron', unit: 'kg', cost: 4.0, pack: 3, supplier: 'Primeur Frais' },
    { name: 'Fromage bleu', unit: 'kg', cost: 12.0, pack: 1, supplier: 'Fromagerie Leclerc' },
    { name: 'Jambon', unit: 'kg', cost: 11.0, pack: 2, supplier: 'Charcuterie Fine' },
    { name: 'Ananas', unit: 'kg', cost: 3.5, pack: 5, supplier: 'Primeur Frais' },
    { name: 'Oignons frits', unit: 'kg', cost: 8.0, pack: 2, supplier: 'Garnitures Pro' },
  ]

  for (const ing of ingredientData) {
    const existing = await prisma.ingredient.findFirst({
      where: {
        organizationId: organization.id,
        name: ing.name,
      },
    })

    if (!existing) {
      const ingredient = await prisma.ingredient.create({
        data: {
          organizationId: organization.id,
          name: ing.name,
          unit: ing.unit,
          costPerUnit: ing.cost,
          packSize: ing.pack,
          supplierName: ing.supplier,
        },
      })
      ingredients.push(ingredient)
    } else {
      ingredients.push(existing)
    }
  }

  // 4. Créer 30 produits avec recettes
  const products = []
  const productData = [
    { name: 'Burger Classique', price: 12.5, category: 'Burger', recipe: [
      { ingredient: 'Pain à burger', qty: 1 },
      { ingredient: 'Steak haché', qty: 0.15 },
      { ingredient: 'Fromage cheddar', qty: 0.05 },
      { ingredient: 'Salade', qty: 0.02 },
      { ingredient: 'Tomate', qty: 0.03 },
      { ingredient: 'Oignon', qty: 0.01 },
      { ingredient: 'Cornichons', qty: 0.01 },
      { ingredient: 'Sauce burger', qty: 0.02 },
    ]},
    { name: 'Burger Bacon', price: 14.0, category: 'Burger', recipe: [
      { ingredient: 'Pain à burger', qty: 1 },
      { ingredient: 'Steak haché', qty: 0.15 },
      { ingredient: 'Bacon', qty: 0.05 },
      { ingredient: 'Fromage cheddar', qty: 0.05 },
      { ingredient: 'Salade', qty: 0.02 },
      { ingredient: 'Tomate', qty: 0.03 },
      { ingredient: 'Sauce burger', qty: 0.02 },
    ]},
    { name: 'Burger Poulet', price: 13.0, category: 'Burger', recipe: [
      { ingredient: 'Pain à burger', qty: 1 },
      { ingredient: 'Poulet', qty: 0.15 },
      { ingredient: 'Salade', qty: 0.02 },
      { ingredient: 'Tomate', qty: 0.03 },
      { ingredient: 'Mayonnaise', qty: 0.02 },
    ]},
    { name: 'Burger Avocat', price: 15.0, category: 'Burger', recipe: [
      { ingredient: 'Pain à burger', qty: 1 },
      { ingredient: 'Steak haché', qty: 0.15 },
      { ingredient: 'Avocat', qty: 0.1 },
      { ingredient: 'Salade', qty: 0.02 },
      { ingredient: 'Tomate', qty: 0.03 },
      { ingredient: 'Oignon', qty: 0.01 },
    ]},
    { name: 'Burger Champignons', price: 13.5, category: 'Burger', recipe: [
      { ingredient: 'Pain à burger', qty: 1 },
      { ingredient: 'Steak haché', qty: 0.15 },
      { ingredient: 'Champignons', qty: 0.05 },
      { ingredient: 'Fromage cheddar', qty: 0.05 },
      { ingredient: 'Salade', qty: 0.02 },
    ]},
    { name: 'Frites Classiques', price: 4.5, category: 'Accompagnement', recipe: [
      { ingredient: 'Frites', qty: 0.15 },
      { ingredient: 'Huile de friture', qty: 0.01 },
    ]},
    { name: 'Frites Cheddar', price: 6.0, category: 'Accompagnement', recipe: [
      { ingredient: 'Frites', qty: 0.15 },
      { ingredient: 'Huile de friture', qty: 0.01 },
      { ingredient: 'Fromage cheddar', qty: 0.05 },
      { ingredient: 'Bacon', qty: 0.02 },
    ]},
    { name: 'Salade César', price: 10.0, category: 'Salade', recipe: [
      { ingredient: 'Laitue', qty: 0.1 },
      { ingredient: 'Poulet', qty: 0.1 },
      { ingredient: 'Fromage cheddar', qty: 0.03 },
      { ingredient: 'Œufs', qty: 1 },
      { ingredient: 'Bacon', qty: 0.02 },
    ]},
    { name: 'Salade Avocat', price: 11.0, category: 'Salade', recipe: [
      { ingredient: 'Laitue', qty: 0.1 },
      { ingredient: 'Avocat', qty: 0.15 },
      { ingredient: 'Tomate', qty: 0.05 },
      { ingredient: 'Oignon', qty: 0.02 },
    ]},
    { name: 'Wrap Poulet', price: 9.5, category: 'Wrap', recipe: [
      { ingredient: 'Poulet', qty: 0.12 },
      { ingredient: 'Salade', qty: 0.03 },
      { ingredient: 'Tomate', qty: 0.02 },
      { ingredient: 'Mayonnaise', qty: 0.02 },
    ]},
  ]

  // Générer 20 produits supplémentaires avec recettes simples
  for (let i = 11; i <= 30; i++) {
    const baseName = `Produit ${i}`
    productData.push({
      name: baseName,
      price: 8 + Math.random() * 8,
      category: ['Burger', 'Accompagnement', 'Salade', 'Wrap', 'Dessert'][Math.floor(Math.random() * 5)],
      recipe: [
        { ingredient: ingredientData[Math.floor(Math.random() * ingredientData.length)].name, qty: 0.1 + Math.random() * 0.1 },
        { ingredient: ingredientData[Math.floor(Math.random() * ingredientData.length)].name, qty: 0.05 + Math.random() * 0.05 },
      ],
    })
  }

  for (const prod of productData) {
    const existing = await prisma.product.findFirst({
      where: {
        organizationId: organization.id,
        name: prod.name,
      },
    })

    let product
    if (!existing) {
      product = await prisma.product.create({
        data: {
          organizationId: organization.id,
          name: prod.name,
          category: prod.category,
          unitPrice: prod.price,
        },
      })
    } else {
      product = existing
    }

    // Créer les recettes
    for (const recipeItem of prod.recipe) {
      const ingredient = ingredients.find((ing) => ing.name === recipeItem.ingredient)
      if (ingredient) {
        // Vérifier si la recette existe déjà
        const existingRecipe = await prisma.productIngredient.findFirst({
          where: {
            productId: product.id,
            ingredientId: ingredient.id,
          },
        })

        if (existingRecipe) {
          await prisma.productIngredient.update({
            where: { id: existingRecipe.id },
            data: { quantityNeeded: recipeItem.qty },
          })
        } else {
          await prisma.productIngredient.create({
            data: {
              productId: product.id,
              ingredientId: ingredient.id,
              quantityNeeded: recipeItem.qty,
            },
          })
        }
      }
    }

    products.push(product)
  }

  // 5. Créer des stocks initiaux pour chaque restaurant
  for (const restaurant of restaurants) {
    for (const ingredient of ingredients) {
      // Vérifier si l'inventaire existe déjà
      const existingInv = await prisma.inventory.findFirst({
        where: {
          restaurantId: restaurant.id,
          ingredientId: ingredient.id,
        },
      })

      if (existingInv) {
        await prisma.inventory.update({
          where: { id: existingInv.id },
          data: {
            currentStock: Math.random() * 50 + 10,
            minThreshold: 20,
            maxThreshold: 100,
          },
        })
      } else {
        await prisma.inventory.create({
          data: {
            restaurantId: restaurant.id,
            ingredientId: ingredient.id,
            currentStock: Math.random() * 50 + 10, // Stock aléatoire entre 10 et 60
            minThreshold: 20,
            maxThreshold: 100,
          },
        })
      }
    }
  }

  // 6. Générer 90 jours de ventes réalistes
  const today = new Date()
  for (let day = 0; day < 90; day++) {
    const saleDate = new Date(today)
    saleDate.setDate(saleDate.getDate() - day)

    // Générer des ventes pour chaque restaurant
    for (const restaurant of restaurants) {
      // Nombre de ventes par jour (variable selon le jour de la semaine)
      const dayOfWeek = saleDate.getDay()
      const baseSales = dayOfWeek === 0 || dayOfWeek === 6 ? 30 : 50 // Moins le weekend
      const numSales = baseSales + Math.floor(Math.random() * 20)

      for (let i = 0; i < numSales; i++) {
        const product = products[Math.floor(Math.random() * products.length)]
        const quantity = Math.floor(Math.random() * 3) + 1
        const amount = product.unitPrice * quantity
        const hour = Math.floor(Math.random() * 14) + 8 // Entre 8h et 22h

        await prisma.sale.create({
          data: {
            restaurantId: restaurant.id,
            productId: product.id,
            quantity,
            amount,
            saleDate,
            saleHour: hour,
          },
        })
      }
    }
  }

  // 7. Générer les recommandations pour chaque restaurant
  for (const restaurant of restaurants) {
    try {
      const { recommendations, details, estimatedSavings } = await generateBOMOrderRecommendations(
        restaurant.id,
        organization.shrinkPct,
        7
      )

      if (recommendations.length > 0) {
        await prisma.recommendation.create({
          data: {
            restaurantId: restaurant.id,
            type: 'ORDER',
            data: details as any,
            priority: 'medium',
            status: 'pending',
          },
        })
      }
    } catch (error) {
      console.error(`Error generating recommendations for restaurant ${restaurant.id}:`, error)
    }
  }

  // 8. Générer les alertes
  for (const restaurant of restaurants) {
    try {
      await runAllAlerts(restaurant.id)
    } catch (error) {
      console.error(`Error generating alerts for restaurant ${restaurant.id}:`, error)
    }
  }

  return {
    organization,
    restaurants,
    products: products.length,
    ingredients: ingredients.length,
    message: 'Données de démonstration créées avec succès',
  }
}

/**
 * Supprime toutes les données de démonstration
 * @param clerkOrgId - ID de l'organisation Clerk actuelle
 */
export async function deleteDemoData(clerkOrgId: string) {
  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  })

  if (!organization) {
    return { message: 'Aucune donnée de démonstration trouvée' }
  }

  // Supprimer l'organisation (cascade supprimera tout le reste)
  await prisma.organization.delete({
    where: { id: organization.id },
  })

  return { message: 'Données de démonstration supprimées avec succès' }
}
