import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL
  if (!from) throw new Error('Falta RESEND_FROM_EMAIL en las variables de entorno.')

  const { error } = await resend.emails.send({ from, to, subject, html })
  if (error) throw new Error(`Error enviando email: ${error.message}`)
}
