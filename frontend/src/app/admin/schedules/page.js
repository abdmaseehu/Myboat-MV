'use client'

import { Toaster } from 'sonner'
import ScheduleListFactory from '@/components/admin/schedules/schedule-list-factory'

export default function SchedulesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      
      {/* Schedule List */}
      <ScheduleListFactory />
    </div>
  )
} 