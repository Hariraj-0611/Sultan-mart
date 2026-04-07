import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../store/authSlice'
import { ShoppingBag, Lock, User, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(s => s.auth)
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(login(form))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a3c5e 0%, #0d2137 55%, #1a3c5e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* decorative circles */}
      <div style={{ position:'fixed', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'rgba(230,126,34,.08)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(45,106,159,.15)', pointerEvents:'none' }} />

      <div style={{
        background: '#fff', borderRadius: 16,
        width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,.35)',
        overflow: 'hidden', position: 'relative', zIndex: 1,
      }}>
        {/* top strip */}
        <div style={{
          background: 'var(--brand)', padding: '28px 32px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--accent)', margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(230,126,34,.4)',
          }}>
            <ShoppingBag size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>Sultan Mart</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>
            Retail Management System
          </p>
        </div>

        {/* form */}
        <div style={{ padding: '28px 32px 32px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 20 }}>
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* username */}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-sub)', marginBottom:5 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="var(--text-muted)" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
                <input
                  style={{
                    width: '100%', padding: '10px 12px 10px 34px',
                    border: '1.5px solid var(--border)', borderRadius: 8,
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter your username"
                  autoFocus
                  required
                  onFocus={e => e.target.style.borderColor = 'var(--brand-mid)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* password */}
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-sub)', marginBottom:5 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--text-muted)" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
                <input
                  style={{
                    width: '100%', padding: '10px 40px 10px 34px',
                    border: '1.5px solid var(--border)', borderRadius: 8,
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  onFocus={e => e.target.style.borderColor = 'var(--brand-mid)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', fontSize:11,
                    color:'var(--text-sub)', fontWeight:600 }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* error */}
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--danger-bg)',
                border:'1px solid #f5b7b1', borderRadius:8, padding:'9px 12px' }}>
                <AlertCircle size={14} color="var(--danger)" />
                <span style={{ fontSize:12, color:'var(--danger)', fontWeight:500 }}>{error}</span>
              </div>
            )}

            {/* submit */}
            <button type="submit" disabled={loading}
              style={{
                padding: '11px', borderRadius: 8, border: 'none',
                background: loading ? '#a0b4c8' : 'var(--brand)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4, transition: 'background .15s',
                boxShadow: loading ? 'none' : '0 3px 10px rgba(26,60,94,.3)',
              }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:20 }}>
            Sultan Mart © {new Date().getFullYear()} — All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
