'use client'
import BusinessOverview from '../../../components/admin/dashboard/business-overview'
import { ChevronRight } from 'lucide-react'
import { Toaster } from 'sonner'

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <span>Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Business Overview</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Business Overview</h1>
          <p className="text-muted-foreground">
            Monitor your business performance and analytics
          </p>
        </div>
      </div>

      <BusinessOverview />
    </div>
  )
} 