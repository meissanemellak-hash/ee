import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentOrganization } from '@/lib/auth'
import { generateForecastsForRestaurant } from '@/lib/services/forecast'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { restaurantId, forecastDate, method } = body

    if (!restaurantId || !forecastDate) {
      return NextResponse.json(
        { error: 'restaurantId and forecastDate are required' },
        { status: 400 }
      )
    }

    const date = new Date(forecastDate)
    const forecasts = await generateForecastsForRestaurant(
      restaurantId,
      date,
      method
    )

    return NextResponse.json({ success: true, forecasts })
  } catch (error) {
    console.error('Error generating forecasts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
