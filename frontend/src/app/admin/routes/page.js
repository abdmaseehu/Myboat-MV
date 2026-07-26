'use client'

import { Toaster } from 'sonner'
import RouteListFactory from '@/components/admin/routes/route-list-factory'

export default function RoutesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      
      {/* Route List */}
      <RouteListFactory />
    </div>
  )
} 