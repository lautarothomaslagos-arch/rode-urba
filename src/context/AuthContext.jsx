import { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [perfil, setPerfil]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [hayFechaAbierta, setHayFechaAbierta] = useState(false)

  // Evita que cargarPerfil se llame dos veces (getSession + onAuthStateChange)
  const perfilCargadoParaRef = useRef(null)

  useEffect(() => {
    if (!user) { setHayFechaAbierta(false); return }
    async function chequearPendientes() {
      const ahora = new Date().toISOString()
      const { data: fechasAbiertas } = await supabase
        .from('fechas').select('id').eq('activa', true)
        .or(`cierre_predicciones.is.null,cierre_predicciones.gt.${ahora}`)
      if (!fechasAbiertas?.length) { setHayFechaAbierta(false); return }
      const fechaIds = fechasAbiertas.map(f => f.id)
      const { data: partidos } = await supabase
        .from('partidos').select('id').in('fecha_id', fechaIds)
      if (!partidos?.length) { setHayFechaAbierta(false); return }
      const partidoIds = partidos.map(p => p.id)
      const { data: preds } = await supabase
        .from('predicciones').select('partido_id')
        .eq('usuario_id', user.id).in('partido_id', partidoIds)
      const predIds = new Set((preds || []).map(p => p.partido_id))
      setHayFechaAbierta(partidoIds.some(id => !predIds.has(id)))
    }
    chequearPendientes()
  }, [user])

  useEffect(() => {
    // Timeout de seguridad: si en 6s no resolvió, liberar loading igual
    const timeout = setTimeout(() => setLoading(false), 6000)

    // Inicializar sesión
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout)
        setUser(session?.user ?? null)
        if (session?.user) {
          perfilCargadoParaRef.current = session.user.id
          cargarPerfil(session.user.id).finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      })
      .catch(() => { clearTimeout(timeout); setLoading(false) })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user)
        // Solo cargar perfil si es un usuario distinto al que ya cargamos
        if (perfilCargadoParaRef.current !== session.user.id) {
          perfilCargadoParaRef.current = session.user.id
          cargarPerfil(session.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        perfilCargadoParaRef.current = null
        setUser(null)
        setPerfil(null)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function cargarPerfil(userId) {
    try {
      const { data } = await supabase.from('perfiles').select('*').eq('id', userId).maybeSingle()
      if (data) setPerfil(data)
    } catch(e) {
      console.error('Error perfil:', e)
    }
  }

  async function signIn({ email, password }) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp({ email, password, username, nombreCompleto }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      const { error: perfilError } = await supabase.from('perfiles').upsert({
        id: data.user.id, username,
        nombre_completo: nombreCompleto || '', es_admin: false,
      })
      if (perfilError) {
        console.error('Error creando perfil:', perfilError)
        // Intentar de nuevo una vez
        await supabase.from('perfiles').upsert({
          id: data.user.id, username,
          nombre_completo: nombreCompleto || '', es_admin: false,
        })
      }
    }
    return { error }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch(e) {
      console.error('Error al cerrar sesión:', e)
    }
    setUser(null)
    setPerfil(null)
  }

  // useMemo evita que todos los consumidores re-rendericen cuando cambia
  // cualquier cosa en AuthProvider que no les afecta
  const value = useMemo(
    () => ({ user, perfil, loading, hayFechaAbierta, signIn, signUp, signOut, cargarPerfil }),
    [user, perfil, loading, hayFechaAbierta] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0d1117'}}>
      <div style={{textAlign:'center'}}>
        <img src="/logo.png" alt="Pick&Go" style={{width:200,height:200,borderRadius:32,marginBottom:16,objectFit:'contain'}} />
        <div style={{color:'rgba(201,162,39,0.8)',fontFamily:'Rajdhani,sans-serif',letterSpacing:3,fontSize:14}}>Cargando...</div>
      </div>
    </div>
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
