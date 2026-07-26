"use client";

import { Menu, LogOut, User, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/store/use-sidebar";
import { useAuth } from "@/store/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export default function TopNav() {
  const { toggle } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 transition-all duration-200">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-sky-500/10"
            onClick={toggle}
          >
            <Menu className="h-4 w-4 text-sky-500" />
          </Button>
          {/* Search */}
        </div>

        {/* Right Side Items */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-sky-500/10 transition-colors duration-200 cursor-pointer">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={
                      user?.avatar
                        ? `${process.env.NEXT_PUBLIC_ROOT_URL}${user.avatar}`
                        : null
                    }
                    alt={user?.firstName}
                  />
                  <AvatarFallback className="bg-gradient-to-tr from-sky-500 to-sky-600 text-white">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/admin/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
              </Link>
              {/* <Link href="/admin/settings">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
              </Link> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
