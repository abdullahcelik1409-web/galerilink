import { AddCarForm } from "@/components/cars/add-car-form"
import { getAuthUser, getProfile, getListingCount } from "@/lib/supabase/auth-cache"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Yeni İlan Ekle - GaleriLink",
}

export default async function AddCarPage() {
  const { user } = await getAuthUser()
  if (!user) redirect("/login")

  const { profile } = await getProfile(user.id)
  const { count } = await getListingCount(user.id)

  return (
    <div className="py-8">
      <AddCarForm 
        profile={profile} 
        currentListingCount={count} 
      />
    </div>
  )
}
