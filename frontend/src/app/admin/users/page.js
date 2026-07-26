'use client'

import { Toaster } from 'sonner'
import UserListFactory from '@/components/admin/users/user-list-factory'

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />
      
      {/* User List */}
      <UserListFactory />
    </div>
  )
} 