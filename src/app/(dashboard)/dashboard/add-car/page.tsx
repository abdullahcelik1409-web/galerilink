"use client"
import { AddCarForm } from "@/components/cars/add-car-form"
import { useSearchParams } from "next/navigation"

export default function AddCarPage() {
  return (
    <div className="py-8">
      <AddCarForm />
    </div>
  )
}
