import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sendNotificationEmail, sendAlertEmail } from '@/lib/services/email'

/**
 * Route API de test pour vérifier l'envoi d'emails avec Resend
 * 
 * GET /api/test-email?type=notification&to=email@example.com
 * GET /api/test-email?type=alert&to=email@example.com&restaurant=Restaurant Test
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel pour le test, mais recommandé)
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'notification'
    const to = searchParams.get('to')
    const restaurant = searchParams.get('restaurant') || 'Restaurant Test'

    // Vérifier qu'un email est fourni
    if (!to) {
      return NextResponse.json(
        {
          error: 'Missing email address',
          message: 'Please provide an email address with ?to=your@email.com',
          example: '/api/test-email?type=notification&to=your@email.com',
        },
        { status: 400 }
      )
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    let result

    // Envoyer l'email selon le type
    if (type === 'alert') {
      result = await sendAlertEmail({
        to,
        restaurantName: restaurant,
        alertType: 'shortage',
        message: 'Ceci est un email de test pour vérifier que Resend fonctionne correctement. Si vous recevez cet email, la configuration est réussie ! 🎉',
      })
    } else {
      result = await sendNotificationEmail({
        to,
        subject: 'Test Email - AI Restaurant Manager',
        message: 'Ceci est un email de test pour vérifier que Resend fonctionne correctement. Si vous recevez cet email, la configuration est réussie ! 🎉',
      })
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${to}`,
      type,
      emailId: result?.id,
      details: result,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        message: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check that RESEND_API_KEY is set in .env.local',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/test-email
 * Permet d'envoyer un email de test avec un body JSON
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { to, type = 'notification', restaurant = 'Restaurant Test' } = body

    if (!to) {
      return NextResponse.json(
        { error: 'Missing email address in request body' },
        { status: 400 }
      )
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    let result

    if (type === 'alert') {
      result = await sendAlertEmail({
        to,
        restaurantName: restaurant,
        alertType: 'shortage',
        message: 'Ceci est un email de test pour vérifier que Resend fonctionne correctement. Si vous recevez cet email, la configuration est réussie ! 🎉',
      })
    } else {
      result = await sendNotificationEmail({
        to,
        subject: 'Test Email - AI Restaurant Manager',
        message: 'Ceci est un email de test pour vérifier que Resend fonctionne correctement. Si vous recevez cet email, la configuration est réussie ! 🎉',
      })
    }

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${to}`,
      type,
      emailId: result?.id,
      details: result,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        message: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check that RESEND_API_KEY is set in .env.local',
      },
      { status: 500 }
    )
  }
}
