import { createClient } from "@/lib/supabase/server"
import { getPackageAncestry } from "@/lib/taxonomy-server"
import { CarCard } from "@/components/cars/car-card"
import { X, Flame, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function ResultCount({ searchParams }: { searchParams: any }) {
  const cars = await fetchAndFilterCars(searchParams, null, false)
  return <>{cars.length}</>
}

export async function FeedHeaderCount({ searchParams }: { searchParams: any }) {
  const cars = await fetchAndFilterCars(searchParams, null, false)
  return (
    <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 animate-pulse">
      {cars.length} Sonuç Bulundu
    </div>
  )
}

export async function OpportunityFeed({ searchParams }: { searchParams: any }) {
  const cars = await fetchAndFilterCars(searchParams, true, true)
  if (cars.length === 0) return null

  // Fırsat Havuzu için sayfalama değil ilk 4 aracı gösteriyoruz
  const displayCars = cars.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <Flame className="w-6 h-6 text-amber-500" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Fırsat Havuzu</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hızlı Satış • B2B Özel Fiyatlar</p>
          </div>
        </div>
        <Link 
          href="/dashboard/opportunities" 
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-xs font-black uppercase tracking-widest transition-all hover:translate-x-1"
        >
          Tümünü Gör <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {displayCars.map((car: any, index: number) => (
          <CarCard key={car.id} car={car} priority={index < 4} />
        ))}
      </div>
    </div>
  )
}

export async function RegularFeed({ searchParams }: { searchParams: any }) {
  const limitPerPage = 24
  const page = searchParams.page ? parseInt(searchParams.page as string) : 1
  
  // Burada is_opportunity = false diye süzdürmüyoruz, vitrin tümünü kapsayabilir veya sadece normal olabilir.
  // Eski kodda regularCars, expire tarihi geçik veya is_opportunity olmayanlarmış.
  const allFilteredCars = await fetchAndFilterCars(searchParams, false, false)
  const total = allFilteredCars.length
  const totalPages = Math.ceil(total / limitPerPage)
  
  const displayCars = allFilteredCars.slice((page - 1) * limitPerPage, page * limitPerPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-2 h-8 bg-primary rounded-full" />
        <h2 className="text-xl font-black uppercase tracking-tighter italic">Vitrin İlanlar</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {displayCars.map((car: any, index: number) => (
          <CarCard key={car.id} car={car} priority={index < 4} />
        ))}
        
        {displayCars.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-[3rem] bg-card/10 border-primary/5">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <X className="w-8 h-8 opacity-20" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter mb-2 italic">Sonuç Bulunamadı</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Filtrelerinize uygun araç kalmadı.</span>
            <Link href="?page=1">
              <Button variant="ghost" className="mt-8 text-[10px] font-black uppercase tracking-widest">Aramayı Sıfırla</Button>
            </Link>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <PaginationNav 
          currentPage={page} 
          totalPages={totalPages} 
          searchParams={searchParams} 
        />
      )}
    </div>
  )
}

// Internal Fetcher logic
async function fetchAndFilterCars(searchParams: any, forceOpportunity: boolean | null, checkOpportunityLogic: boolean) {
  const supabase = await createClient()
  let query = supabase.from('cars').select(`
    id, seller_id, title, brand, model, year, km, price_b2b, images,
    location_city, location_district, is_opportunity, opportunity_expires_at,
    opportunity_reason, package_id, is_active, created_at, masked_slug, damage_report,
    profiles:seller_id ( company_name, city, district, phone )
  `).eq('is_active', true)

  if (searchParams.minPrice) query = query.gte('price_b2b', searchParams.minPrice)
  if (searchParams.maxPrice) query = query.lte('price_b2b', searchParams.maxPrice)
  if (searchParams.minYear) query = query.gte('year', searchParams.minYear)
  if (searchParams.maxYear) query = query.lte('year', searchParams.maxYear)
  if (searchParams.minKm) query = query.gte('km', searchParams.minKm)
  if (searchParams.maxKm) query = query.lte('km', searchParams.maxKm)
  if (searchParams.city && searchParams.city !== 'null') query = query.eq('location_city', searchParams.city)
  if (searchParams.district && searchParams.district !== 'null') query = query.eq('location_district', searchParams.district)

  // En büyük limit, in-memory taxonomy için. (Max 5000 araç)
  const { data, error } = await query.limit(5000)
  if (error || !data) return []

  let filtered = data

  // Is Opportunity Logic Matcher
  if (checkOpportunityLogic) {
    if (forceOpportunity) {
      filtered = filtered.filter(c => c.is_opportunity && c.opportunity_expires_at)
    } else {
      filtered = filtered.filter(c => !c.is_opportunity || !c.opportunity_expires_at)
    }
  }

  // Keyword search
  if (searchParams.search) {
     const s = searchParams.search.toLowerCase()
     filtered = filtered.filter(car => {
        const searchable = `${car.brand} ${car.model} ${car.title} ${car.location_city} ${car.damage_report || ''}`.toLowerCase()
        return searchable.includes(s)
     })
  }

  // Taxonomy Filters Process
  if (searchParams.tax_path || searchParams.gearType || searchParams.bodyType) {
    const taxPath = searchParams.tax_path ? searchParams.tax_path.split(',') : []
    
    // Yalnızca uyan araçların ancestry'sini doldur.
    const enriched = await Promise.all(
      filtered.map(async (car: any) => ({
        ...car,
        ancestry: await getPackageAncestry(car.package_id)
      }))
    )
    
    filtered = enriched.filter(car => {
        if (searchParams.gearType && searchParams.gearType !== 'null') {
            const hasGear = car.ancestry.some((n: any) => n.level === 'sanziman' && n.name === searchParams.gearType)
            if (!hasGear) return false
        }
        if (searchParams.bodyType && searchParams.bodyType !== 'null') {
            const hasBody = car.ancestry.some((n: any) => n.level === 'kasa' && n.name === searchParams.bodyType)
            if (!hasBody) return false
        }
        if (taxPath.length > 0) {
            const carPathIds = car.ancestry.map((n: any) => n.id)
            const match = taxPath.every((id: string) => carPathIds.includes(id))
            if (!match) return false
        }
        return true
    })
  }

  // Sorting
  const sort = searchParams.sortBy || 'newest'
  filtered.sort((a, b) => {
    if (sort === 'expensive') return Number(b.price_b2b) - Number(a.price_b2b)
    if (sort === 'cheap') return Number(a.price_b2b) - Number(b.price_b2b)
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return filtered
}

// URL Params Yardımcısı
function getPaginationUrl(searchParams: any, page: number) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== 'page') {
      params.set(key, String(value))
    }
  }
  params.set('page', String(page))
  return `?${params.toString()}`
}

function PaginationNav({ currentPage, totalPages, searchParams }: { currentPage: number, totalPages: number, searchParams: any }) {
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    // Basic logic for showing pages
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push('...')
    }
  }
  const displayPages = pages.filter((item, pos, self) => self.indexOf(item) === pos)

  return (
    <div className="flex items-center justify-center gap-2 pt-10">
      <Link 
        href={currentPage > 1 ? getPaginationUrl(searchParams, currentPage - 1) : '#'} 
        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed border-muted bg-transparent' : 'hover:bg-primary/5 hover:border-primary/20 bg-card'}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>
      
      {displayPages.map((p, idx) => {
        if (p === '...') return <span key={`dots-${idx}`} className="px-2 text-muted-foreground opacity-50">...</span>
        
        return (
          <Link
            key={`page-${p}`}
            href={getPaginationUrl(searchParams, p as number)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-black transition-all ${currentPage === p ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'hover:bg-primary/5 hover:border-primary/20 bg-card'}`}
          >
            {p}
          </Link>
        )
      })}
      
      <Link 
        href={currentPage < totalPages ? getPaginationUrl(searchParams, currentPage + 1) : '#'} 
        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed border-muted bg-transparent' : 'hover:bg-primary/5 hover:border-primary/20 bg-card'}`}
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
