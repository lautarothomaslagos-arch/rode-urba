import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Inicializar sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        cargarPerfil(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios — NO setLoading aquí para no bloquear navegación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session.user)
        cargarPerfil(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setPerfil(null)
      }
    })

    return () => subscription.unsubscribe()
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
      await supabase.from('perfiles').upsert({
        id: data.user.id, username,
        nombre_completo: nombreCompleto || '', es_admin: false,
      })
    }
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setPerfil(null)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0d1117'}}>
      <div style={{textAlign:'center'}}>
        <img src="/logo.png" alt="Pick&Go" style={{width:200,height:200,borderRadius:32,marginBottom:16,objectFit:'contain'}} />
        <div style={{color:'rgba(201,162,39,0.8)',fontFamily:'Rajdhani,sans-serif',letterSpacing:3,fontSize:14}}>Cargando...</div>
      </div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signIn, signUp, signOut, cargarPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
