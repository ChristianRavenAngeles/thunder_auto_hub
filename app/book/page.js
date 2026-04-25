export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import PublicNav from '@/components/layout/PublicNav'
import BookingWizard from '@/components/booking/BookingWizard'

export const metadata = {
  title: 'Book a Service — Thunder Auto Hub',
  description: 'Book your premium car wash, detailing, or coating service online.',
}

export default function BookPage() {
  return (
    <>
      <PublicNav />
      <main>
        <Suspense>
          <BookingWizard />
        </Suspense>
      </main>
    </>
  )
}
