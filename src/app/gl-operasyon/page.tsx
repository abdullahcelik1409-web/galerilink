import { getAuthUser } from "@/lib/supabase/auth-cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert,
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  UserPlus,
  AlertTriangle,
  FileText,
  Zap,
  Store,
  MapPin,
  Database
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AdminActionButtons } from "./admin-action-buttons"
import { DocumentViewer } from "./document-viewer"

export const metadata = {
  title: "GL-Ops Terminal - Galerilink Admin",
}

export default async function AdminPage() {
  const { user } = await getAuthUser()
  
  // 1. Yetki Kontrolü
  const adminEmailsVar = process.env.ADMIN_EMAILS || 'abdullah.celik1409@gmail.com'
  const authorizedEmails = adminEmailsVar.split(',').map(e => e.trim().toLowerCase())
  
  if (!user || !authorizedEmails.includes(user.email?.toLowerCase() || "")) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-indigo-500/30">
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-[#080808] border border-white/30 rounded-[3.5rem] p-12 text-center space-y-8 shadow-[0_0_100px_-20px_rgba(255,255,255,0.1)]">
            <ShieldAlert className="w-16 h-16 text-white mx-auto" />
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">TERMİNAL KİLİTLİ</h1>
              <p className="font-technical text-lg font-black text-white/90 truncate">{user?.email || 'Yetkisiz Giriş'}</p>
            </div>
            <Button variant="outline" className="w-full h-16 rounded-2xl border-white/20 bg-white/10 hover:bg-white hover:text-black text-[11px] font-black uppercase tracking-[0.2em] transition-all text-white" asChild>
              <Link href="/dashboard">Güvenli Bölgeye Dön</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const adminClient = createAdminClient()

  // 2. Tüm Profilleri Çek (Moderasyon İçin)
  const { data: profiles, error } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-20 text-center text-red-500 font-bold bg-black min-h-screen">Veritabanı Hatası: {error.message}</div>
  }

  const pendingUsers = profiles?.filter(p => p.hesap_durumu === 'beklemede') || []

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/40 relative font-sans">
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-[0.08] pointer-events-none" />

      <div className="relative z-10 p-4 md:p-10 max-w-[1700px] mx-auto space-y-12 pb-32 focus:outline-none">
        
        {/* Başlık - Maksimum Kontrast */}
        <header className="flex items-center justify-between pb-8 border-b border-white/20">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/20 border border-white/40">
              <ShieldCheck className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white drop-shadow-sm">GL-OPS TERMİNAL</h1>
              <p className="text-[9px] font-bold text-white/70 uppercase tracking-[0.4em] mt-1">Noir Yönetici Denetimi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/gl-operasyon/taxonomy">
              <Button variant="outline" className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 border-primary/20 hover:bg-primary hover:text-white px-6 transition-all text-primary gap-2">
                <Database className="w-4 h-4" />
                TAXONOMY STUDIO
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 border-white/30 hover:bg-white hover:text-black px-6 transition-all text-white">
                Sisteme Dön
              </Button>
            </Link>
          </div>
        </header>

        {/* İstatistikler */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MiniStat icon={<Clock className="text-white" />} label="BEKLEYEN" value={pendingUsers.length} active />
          <MiniStat icon={<Users className="text-white/80" />} label="TOPLAM AĞ" value={profiles?.length || 0} />
          <MiniStat icon={<CheckCircle2 className="text-white/80" />} label="ONAYLI OLANLAR" value={profiles?.filter(p => p.hesap_durumu === 'onaylandi').length || 0} />
          <div className="hidden lg:flex bg-white/[0.05] border border-white/10 rounded-2xl p-4 items-center justify-center">
             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">SİSTEM ÇALIŞIYOR</span>
          </div>
        </section>

        {/* Liste: Onay Bekleyenler */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">İNCELENEN BAŞVURULAR</h2>
          </div>

          <div className="bg-[#080808] border border-white/20 rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.08] border-b border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                    <th className="px-8 py-6">AD SOYAD</th>
                    <th className="px-8 py-6">GALERİ İSMİ</th>
                    <th className="px-8 py-6">İLETİŞİM / BÖLGE</th>
                    <th className="px-8 py-6">YETKİ BELGE NO</th>
                    <th className="px-8 py-6 text-center">BELGELER</th>
                    <th className="px-8 py-6 text-right">OPERASYONEL AKSİYON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center text-white/40 font-black uppercase tracking-widest italic animate-pulse">BEKLEYEN BAŞVURU YOK</td>
                    </tr>
                  ) : (
                    pendingUsers.map(profile => (
                      <ApplicationRow key={profile.id} profile={profile} isPending />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Liste: Ağ Yönetimi */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-2 h-8 bg-white/40 rounded-full" />
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white/90">AĞ YÖNETİMİ</h2>
          </div>

          <div className="bg-[#080808] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                    <th className="px-8 py-6">KİMLİK</th>
                    <th className="px-8 py-6">KAYNAK / KONUM</th>
                    <th className="px-8 py-6 text-center">DURUM</th>
                    <th className="px-8 py-6 text-right">DENETİM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {profiles?.map(profile => (
                    <ApplicationRow key={profile.id} profile={profile} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, active }: { icon: any, label: string, value: number, active?: boolean }) {
  return (
    <div className={cn(
      "bg-[#080808] border rounded-2xl p-5 flex items-center justify-between group transition-all duration-500",
      active ? "border-white/40 shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)]" : "border-white/10 opacity-90 hover:opacity-100 hover:border-white/30"
    )}>
      <div className="space-y-1">
        <p className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-black italic tracking-tighter tabular-nums text-white transition-transform origin-left">{value}</p>
      </div>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-all",
        active ? "bg-white text-black" : "bg-white/10 group-hover:bg-white/20"
      )}>
        {icon}
      </div>
    </div>
  )
}

function ApplicationRow({ profile, isPending }: { profile: any, isPending?: boolean }) {
  const isAnonymous = !profile.ad_soyad && !profile.galeri_adi;

  // Vergi Levhası URL ve Yetki Belge No kontrolü (Farklı kolon isimleri ihtimaline karşı yedekli)
  const taxPlateUrl = profile.vergi_levhasi_url || profile.tax_plate_url;
  const authDocNo = profile.yetki_belge_no || profile.tax_no;

  return (
    <tr className={cn(
      "group hover:bg-white/[0.06] transition-all duration-200",
      isPending && "bg-white/[0.03]"
    )}>
      {/* Üyelik Bilgileri -> AD SOYAD */}
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center relative group-hover:bg-white group-hover:text-black transition-all">
             {isAnonymous ? <AlertTriangle className="w-5 h-5 opacity-80" /> : <UserPlus className="w-5 h-5 opacity-80" />}
             {isPending && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-black animate-pulse shadow-[0_0_10px_white]" />}
          </div>
          <div>
            <div className={cn(
              "font-black uppercase tracking-tight text-lg leading-none mb-1 transition-colors",
              isAnonymous ? "text-white/60 italic" : "text-white group-hover:text-white"
            )}>
              {profile.ad_soyad || 'BİLGİ YOK'}
            </div>
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">
              ID: <span className="text-white font-black">{profile.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </td>

      {/* Galeri Tanımı -> GALERİ İSMİ */}
      <td className="px-8 py-6">
        <div className="space-y-1">
          <div className={cn(
            "text-sm font-black uppercase tracking-tight flex items-center gap-2",
            isAnonymous ? "text-white/50" : "text-white"
          )}>
            <Store className="w-3.5 h-3.5 opacity-90 text-indigo-400" />
            {profile.galeri_adi || 'GALERİ İSMİ YOK'}
          </div>
          <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
            KAYIT: <span className="text-white/90 font-black">{new Date(profile.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </td>

      {/* İletişim / Bölge */}
      <td className="px-8 py-6">
        <div className="space-y-1">
          <div className="text-[14px] font-technical text-white font-black tracking-wider leading-none mb-1">{profile.phone}</div>
          <div className="text-[9px] font-black text-white/50 uppercase flex items-center gap-1.5 leading-none">
            <MapPin className="w-3 h-3 opacity-90 text-indigo-400" />
            <span className="text-white/80">
              {profile.city ? `${profile.city}${profile.district ? ` / ${profile.district}` : ''}` : (profile.location_city || 'BİLİNMİYOR')}
            </span>
          </div>
        </div>
      </td>

      {/* YETKİ BELGE NO (New Column) */}
      <td className="px-8 py-6">
        <div className="flex flex-col gap-1.5 min-w-[120px] items-start">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">BELGE NO:</span>
            <span className="text-[10px] font-technical font-black text-white">{authDocNo || "GİRİLMEMİŞ"}</span>
          </div>
          {isPending ? (
             <Badge variant="outline" className="w-fit text-[8px] font-black border-white/40 text-white px-2 leading-none uppercase bg-white/5 text-xs">Onay Bekliyor</Badge>
          ) : (
            <StatusRowBadge status={profile.hesap_durumu} />
          )}
        </div>
      </td>

      {/* BELGELER (Moved Doc viewer button here) */}
      <td className="px-8 py-6 text-center">
        {taxPlateUrl ? (
          <DocumentViewer filePath={taxPlateUrl} userName={profile.ad_soyad} />
        ) : (
          <div className="inline-flex items-center gap-2 px-4 h-10 bg-white/[0.05] border border-white/10 border-dashed rounded-lg opacity-50">
            <AlertTriangle className="w-3 h-3 text-white/60" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/60">BELGE YOK</span>
          </div>
        )}
      </td>

      {/* OPERASYONEL AKSİYON (Just buttons) */}
      <td className="px-8 py-6 text-right">
        <div className="scale-100 origin-right inline-block">
          <AdminActionButtons userId={profile.id} />
        </div>
      </td>
    </tr>
  )
}

function StatusRowBadge({ status }: { status: string }) {
  const styles: any = {
    onaylandi: "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]",
    beklemede: "bg-white/20 text-white border-white/40",
    reddedildi: "bg-red-950 text-red-100 border-red-500/40 line-through opacity-80"
  }
  const label: any = {
    onaylandi: "ONAYLANDI",
    beklemede: "İNCELEMEDE",
    reddedildi: "REDDEDİLDİ"
  }
  return (
    <div className={cn("px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border w-fit leading-none", styles[status])}>
      {label[status]}
    </div>
  )
}
