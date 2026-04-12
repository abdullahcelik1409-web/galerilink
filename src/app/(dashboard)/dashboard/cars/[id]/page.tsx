import { createClient } from "@/lib/supabase/server"
import { CarDetailView } from "@/components/cars/car-detail-view"
import { notFound } from "next/navigation"

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car, error } = await supabase
    .from('cars')
    .select(`
      id, seller_id, title, brand, model, year, km, price_b2b, images,
      location_city, location_district, is_opportunity, opportunity_expires_at,
      opportunity_reason, damage_report, expertise, masked_slug, is_active, created_at,
      profiles:seller_id (company_name, city, district, phone)
    `)
    .eq('id', id)
    .single()

  const { data: { user } } = await supabase.auth.getUser()

  if (error || !car) {
    notFound()
  }

  return <CarDetailView car={car} isOwner={user?.id === car.seller_id} />
}
