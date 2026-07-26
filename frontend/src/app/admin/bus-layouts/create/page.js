'use client'

import { ChevronRight } from 'lucide-react'
import { Toaster } from 'sonner'
import CreateBusLayout from '@/components/admin/bus-layouts/create-bus-layout'

export default function CreateBusLayoutPage() {
  return (
    <div className="flex-1 space-y-1 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      {/* Create Bus Layout Form */}
      <CreateBusLayout />
    </div>
  )
} 