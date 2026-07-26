'use client'

import { Toaster } from 'sonner'
import VendorListFactory from '@/components/admin/vendors/vendor-list-factory'

export default function VendorsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      
      {/* Vendor List */}
      <VendorListFactory />
    </div>
  )
} 