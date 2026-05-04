import { supabase } from './supabase'

export async function notificarResultados(fechaNumero) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { tipo: 'resultados', fecha_numero: fechaNumero }
    })
    return { ok: !error, data }
  } catch(e) {
    console.error('Error notificación resultados:', e)
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

export async function notificarApertura(numero) {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { tipo: 'apertura', numero }
    })
    return { ok: !error, data }
  } catch(e) {
    return { ok: false }
  }
}

export async function notificarRachaPeligro() {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { tipo: 'racha_peligro' }
    })
    return { ok: !error, data }
  } catch(e) {
    return { ok: false }
  }
}
