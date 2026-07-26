'use client'

import { ThemeProvider } from "@/components/theme-provider"
import AdminSidebar from "@/components/admin/sidebar"
import TopNav from "@/components/admin/top-nav"
import { useSidebar } from "@/store/use-sidebar"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic";

const AdminLayout = ({ children }) => {
  const { isOpen } = useSidebar()

  return (
    <div className="relative min-h-screen">
      <AdminSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          isOpen ? "md:pl-72" : "md:pl-20"
        )}
      >
        <TopNav />

        {/* Main Content */}
        <main className="flex-1">
          <div className="container">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 

export default dynamic(() => Promise.resolve(AdminLayout), { ssr: false });
