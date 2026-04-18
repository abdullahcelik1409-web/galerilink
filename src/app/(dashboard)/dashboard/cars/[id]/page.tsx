import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getProfile } from "@/lib/supabase/auth-cache"
import { CarDetailView } from "@/components/cars/car-detail-view"
import { notFound } from "next/navigation"

export const revalidate = 60;

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car, error } = await supabase
    .from('cars')
    .select(`
      id, seller_id, title, brand, model, year, km, price_b2b, images,
      location_city, location_district, is_opportunity, opportunity_expires_at,
      opportunity_reason, damage_report, expertise, masked_slug, is_active, created_at,
      profiles:seller_id (galeri_adi, city, district, phone)
    `)
    .eq('id', id)
    .single()

  const { user } = await getAuthUser()
  const { profile } = user ? await getProfile(user.id) : { profile: null }
  const isVerified = profile?.hesap_durumu === 'onaylandi'

  if (error || !car) {
    notFound()
  }

  return <CarDetailView car={car} isOwner={user?.id === car.seller_id} isVerified={isVerified} />
}
