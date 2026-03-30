import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabase } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { ticket_id, contenido, tipo_autor } = await req.json()
  if (!ticket_id || !contenido || !tipo_autor) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  // Obtener tenant_id del ticket
  const { data: ticketBase } = await supabase
    .from('tickets')
    .select('tenant_id')
    .eq('id', ticket_id)
    .single()
  if (!ticketBase) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

  // Guardar comentario
  const { data: comentario, error: dbError } = await supabase
    .from('ticket_comentarios')
    .insert({ ticket_id, contenido, tipo_autor, tenant_id: ticketBase.tenant_id })
    .select()
    .single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Si es de soporte, enviar email al usuario logueado
  if (tipo_autor === 'soporte' && user.email) {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('codigo, titulo')
      .eq('id', ticket_id)
      .single()

    await resend.emails.send({
      from: 'Nube Gestión Soporte <soporte@nubegestion.com.ar>',
      to: user.email,
      subject: `[${ticket?.codigo}] Nueva respuesta de soporte`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #18181B;">
          <div style="background: #F2682E; padding: 20px 24px; border-radius: 10px 10px 0 0;">
            <span style="font-size: 16px; font-weight: 700; color: white;">Nube Gestión · Soporte</span>
          </div>
          <div style="background: white; border: 1px solid #E5E4E0; border-top: 0; padding: 24px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 13px; color: #6B6762; margin: 0 0 8px 0;">
              Ticket <strong style="color: #18181B;">${ticket?.codigo}</strong>
            </p>
            <p style="font-size: 17px; font-weight: 700; margin: 0 0 20px 0;">${ticket?.titulo}</p>
            <div style="background: #FEF0EA; border-radius: 10px; padding: 16px 18px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
              ${contenido}
            </div>
            <div style="margin-top: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/soporte/${ticket_id}"
                style="display: inline-block; background: #F2682E; color: white; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 9px; text-decoration: none;">
                Ver ticket
              </a>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #A8A49D;">
              Este mensaje fue enviado desde el sistema de soporte de Nube Gestión.
            </p>
          </div>
        </div>
      `,
    })
  }

  return NextResponse.json({ comentario })
}
