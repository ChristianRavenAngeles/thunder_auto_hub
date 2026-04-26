import { redirect } from 'next/navigation'

export const metadata = { title: 'Portal Disabled - Thunder Auto Hub' }

export default function RiderLayout() {
  redirect('/account')
}
