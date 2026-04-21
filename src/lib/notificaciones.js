import { supabase } from './supabase'

export async function notificarResultados(mensajeExtra) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: {
        tipo: 'resultados',
        mensaje_extra: mensajeExtra || '¡Ya están los resultados! Entrá a ver tus puntos.'
      }
    })
    return { ok: !error, data }
  } catch(e) {
    console.error('Error notificación:', e)
    return { ok: false }
  }
}

export async function notificarRecordatorio(fechaId) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { tipo: 'recordatorio', fecha_id: fechaId }
    })
    return { ok: !error, data }
  } catch(e) {
    return { ok: false }
  }
}
