import { Resend } from 'resend'

// Initialisation paresseuse pour éviter les erreurs au build (CI sans RESEND_API_KEY)
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('Missing API key. Pass it to the constructor `new Resend("re_123")` or set RESEND_API_KEY.')
  }
  return new Resend(key)
}

/**
 * Envoie un email via Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = 'onboarding@resend.dev', // Email par défaut de Resend (à changer avec votre domaine)
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

/**
 * Envoie un email de notification
 */
export async function sendNotificationEmail({
  to,
  subject,
  message,
}: {
  to: string
  subject: string
  message: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h2 style="color: #333; margin-top: 0;">${subject}</h2>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            AI Restaurant Manager - Système de gestion opérationnelle
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}

/**
 * Envoie un email d'alerte
 */
export async function sendAlertEmail({
  to,
  restaurantName,
  alertType,
  message,
}: {
  to: string
  restaurantName: string
  alertType: 'overstock' | 'shortage' | 'overstaffing'
  message: string
}) {
  const alertLabels = {
    overstock: 'Surstock',
    shortage: 'Rupture de stock',
    overstaffing: 'Sur-effectif',
  }

  const subject = `🚨 Alerte : ${alertLabels[alertType]} - ${restaurantName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 5px;">
          <h2 style="color: #856404; margin-top: 0;">${subject}</h2>
          <p><strong>Restaurant:</strong> ${restaurantName}</p>
          <p><strong>Type d'alerte:</strong> ${alertLabels[alertType]}</p>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            AI Restaurant Manager - Système de gestion opérationnelle
          </p>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}
