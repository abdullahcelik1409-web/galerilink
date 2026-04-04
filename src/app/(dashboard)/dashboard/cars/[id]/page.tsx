import { createClient } from "@/lib/supabase/server"
import { CarDetailView } from "@/components/cars/car-detail-view"
import { notFound } from "next/navigation"

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car, error } = await supabase
    .from('cars')
    .select(`
      *,
      profiles:seller_id (company_name, city, district, phone)
    `)
    .eq('id', id)
    .single()

  if (error || !car) {
    notFound()
  }

  return <CarDetailView car={car} />
}
