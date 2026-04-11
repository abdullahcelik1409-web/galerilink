import { RegisterForm } from "@/components/auth/register-form"

export const metadata = {
  title: "Kayıt Ol - GaleriLink",
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-950 px-4 py-12 md:py-20">
      <div className="w-full max-w-4xl space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic">
            Galeri<span className="text-primary italic">Link</span>
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs">Güvenilir B2B Araç Ticaret Platformu</p>
        </div>
        
        <div className="relative">
          <RegisterForm />
        </div>

        <div className="text-center py-10">
           <p className="text-white/10 font-technical text-[8px] uppercase tracking-widest">
             GaleriLink B2B Network System — All rights reserved
           </p>
        </div>
      </div>
    </div>
  )
}
