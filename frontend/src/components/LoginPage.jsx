import React, { useState } from "react"

function LoginPage({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "", name: "", role: "mahasiswa" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isRegister) {
        if (!formData.name.trim()) { setError("Nama wajib diisi"); setLoading(false); return }
        if (formData.password.length < 8) { setError("Password minimal 8 karakter"); setLoading(false); return }
        if (!/[A-Z]/.test(formData.password)) { setError("Password harus mengandung huruf besar (A-Z)"); setLoading(false); return }
        if (!/[a-z]/.test(formData.password)) { setError("Password harus mengandung huruf kecil (a-z)"); setLoading(false); return }
        if (!/\d/.test(formData.password)) { setError("Password harus mengandung angka"); setLoading(false); return }
        if (!/[^\w\s]/.test(formData.password)) { setError("Password harus mengandung simbol (!@#$%)"); setLoading(false); return }
        await onRegister({ email: formData.email, password: formData.password, name: formData.name, role: formData.role })
      } else {
        await onLogin({ email: formData.email, password: formData.password })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Fluid Shapes */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-tertiary-container/20 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-primary-container/10 rounded-full blur-[80px] -z-10"></div>
        
        <div className="w-full max-w-[440px] z-10">
          {/* Brand Logo Center */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 primary-gradient rounded-xl flex items-center justify-center mb-4 tonal-elevation">
              <span className="material-symbols-outlined text-on-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <h1 className="text-3xl font-extrabold text-on-background tracking-tight">Studyfy</h1>
            <p className="text-on-surface-variant font-medium mt-1">The Fluid Academy</p>
          </div>
          
          {/* Login Card */}
          <div className="bg-surface-container-lowest rounded-[2rem] p-8 md:p-10 tonal-elevation border border-outline-variant/10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-on-background mb-2">{isRegister ? "Create Account" : "Welcome Back"}</h2>
              <p className="text-on-surface-variant text-sm">
                {isRegister ? "Join Studyfy and start your learning journey." : "Please enter your details to sign in to your workspace."}
              </p>
            </div>
            
            {/* Error Message UI */}
            {error && (
              <div className="mb-6 flex items-center gap-3 bg-error-container/10 border border-error/20 p-4 rounded-xl">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <p className="text-error text-sm font-medium">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <>
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="name">Full Name</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                      <input 
                        type="text" 
                        id="name" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe" 
                        className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline/60 text-on-surface"
                      />
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface-variant ml-1">Register As</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                        className={`flex-1 py-3 text-sm font-semibold rounded-xl border transition-all ${formData.role === 'admin' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'dosen' }))}
                        className={`flex-1 py-3 text-sm font-semibold rounded-xl border transition-all ${formData.role === 'dosen' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        Dosen
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'mahasiswa' }))}
                        className={`flex-1 py-3 text-sm font-semibold rounded-xl border transition-all ${formData.role === 'mahasiswa' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'}`}
                      >
                        Mahasiswa
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">Email</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="student@studyfy.edu" 
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline/60 text-on-surface"
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                  {!isRegister && <button type="button" className="text-xs font-bold text-primary hover:text-primary-dim transition-colors">Forgot Password?</button>}
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-low border border-outline-variant/20 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline/60 text-on-surface"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full primary-gradient text-on-primary font-bold py-4 rounded-xl tonal-elevation hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? "Create Account" : "Sign In"}</span>
                    <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
            
          </div>
          
          {/* Footer Toggle */}
          <div className="mt-8 text-center">
            <p className="text-on-surface-variant font-medium">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                onClick={() => { setIsRegister(!isRegister); setError(""); }}
                className="text-primary font-bold hover:underline underline-offset-4 decoration-2 transition-all"
              >
                {isRegister ? "Sign in here" : "Register for free"}
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Illustrative Texture/Image */}
      <div className="hidden lg:block fixed top-0 right-0 w-1/3 h-full -z-20">
        <div className="w-full h-full opacity-20 bg-gradient-to-br from-primary/30 to-tertiary/20"></div>
        <img  
          alt="Modern minimalist university architecture" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay grayscale opacity-40"
        />
      </div>
    </div>
  )
}

export default LoginPage