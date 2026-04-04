import { RegisterForm } from "@/components/auth/register-form"

export const metadata = {
  title: "Kayıt Ol - GaleriLink",
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-16 relative overflow-hidden">
      {/* Background Studio Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-4xl z-10 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">
            Galeri<span className="text-primary">Link</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-xs px-12">Onaylı Galericiler Ağına Katılın</p>
        </div>
        <RegisterForm />
      </div>

      <div className="absolute bottom-8 text-white/20 font-technical text-[10px] uppercase tracking-widest">
        B2B Network Registration v2.1
      </div>
    </div>
  )
}
