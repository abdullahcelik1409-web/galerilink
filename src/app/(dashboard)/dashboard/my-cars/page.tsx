import { createClient } from "@/lib/supabase/server"
import { CarCard } from "@/components/cars/car-card"

export const metadata = {
  title: "Benim İlanlarım - GaleriLink",
}

export const dynamic = 'force-dynamic'

export default async function MyCarsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch cars owned by currentUser
  const { data: cars } = await supabase
    .from('cars')
    .select(`*, profiles:seller_id (galeri_adi, city, phone)`)
    .eq('seller_id', user.id)
    .neq('status', 'sold')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight border-b pb-4">Benim İlanlarım</h1>
        <p className="text-muted-foreground mt-4 text-lg">Bu ekranda sisteme eklediğiniz tüm araçları görüntüleyebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
        {cars?.map((car) => (
          <CarCard key={car.id} car={car} showDelete={true} />
        ))}
        {(!cars || cars.length === 0) && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-card/30">
            <span className="text-lg font-medium mb-2">Henüz ilan girmediniz.</span>
            <span className="text-sm">Diğer galericilere sergilenmek üzere menüden yeni ilan ekleyebilirsiniz.</span>
          </div>
        )}
      </div>
    </div>
  )
}
