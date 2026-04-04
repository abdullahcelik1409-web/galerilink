import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "Giriş Yap - GaleriLink",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Studio Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md z-10 space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">
            Galeri<span className="text-primary">Link</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs">B2B Araç Ticaret Ağı</p>
        </div>
        <LoginForm />
      </div>

      <div className="absolute bottom-8 text-white/20 font-technical text-[10px] uppercase tracking-widest">
        Secure Access System v2.0
      </div>
    </div>
  )
}
