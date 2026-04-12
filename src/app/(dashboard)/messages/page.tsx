import { Suspense } from 'react'
import { MessagesView } from './messages-view'

export const metadata = {
  title: 'Mesajlarım | GaleriLink',
  description: 'Gelen ve giden tüm ilan mesajlarınız.',
}

export default function MessagesPage() {
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] pt-6 pb-20 px-4 flex">
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <MessagesView />
      </Suspense>
    </div>
  )
}
