import { AddCarForm } from "@/components/cars/add-car-form"

export const metadata = {
  title: "Yeni İlan Ekle - GaleriLink",
}

export default function AddCarPage() {
  return (
    <div className="py-8">
      <AddCarForm />
    </div>
  )
}
