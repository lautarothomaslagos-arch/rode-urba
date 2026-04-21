import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [permiso, setPermiso] = useState('default')
  const [suscrito, setSuscrito] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPermiso(Notification.permission)
    if (user) verificarSuscripcion()
  }, [user])

  async function verificarSuscripcion() {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSuscrito(!!sub)
    } catch(e) {}
  }

  async function suscribirse() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta notificaciones push')
      return
    }
    setCargando(true)
    try {
      const permResult = await Notification.requestPermission()
      setPermiso(permResult)
      if (permResult !== 'granted') { setCargando(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      await supabase.from('push_subscriptions').upsert({
        usuario_id: user.id,
        subscription: sub.toJSON()
      }, { onConflict: 'usuario_id' })

      setSuscrito(true)
    } catch(e) {
      console.error('Error suscripción:', e)
    }
    setCargando(false)
  }

  async function desuscribirse() {
    setCargando(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('usuario_id', user.id)
      setSuscrito(false)
    } catch(e) {}
    setCargando(false)
  }

  return { permiso, suscrito, cargando, suscribirse, desuscribirse }
}
