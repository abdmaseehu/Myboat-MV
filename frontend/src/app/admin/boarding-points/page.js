'use client'

import { Toaster } from 'sonner'
import BoardingPointListFactory from '@/components/admin/boarding-points/boarding-point-list-factory'

export default function BoardingPointsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      
      {/* Boarding Points List */}
      <BoardingPointListFactory />
    </div>
  )
} 