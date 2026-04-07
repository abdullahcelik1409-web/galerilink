import { createClient } from "@/lib/supabase/server"
import { OffersManagementClient } from "@/components/cars/offers-management-client"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Teklif Yönetimi - GaleriLink",
}

export default async function OffersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      <OffersManagementClient userId={user.id} />
    </div>
  )
}
