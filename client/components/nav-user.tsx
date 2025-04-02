"use client"

import { useEffect, useState } from "react"
import {
  BadgeCheck,
  Bell,
  Calendar,
  ChevronsUpDown,
  CreditCard,
  ExternalLink,
  LogOut,
  Mail,
  Sparkles,
  Timer,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EmailStats {
  total: number
  important: number
  starred: number
  needsFollowup: number
  actionItems: number
}

interface UserData {
  name: string
  email: string
  avatar: string
  userId?: number
  emailStats?: EmailStats
}

export function NavUser({
  user,
  onLogout,
}: {
  user: UserData
  onLogout?: () => void
}) {
  const { isMobile } = useSidebar()
  const [stats, setStats] = useState<EmailStats>()
  const [actionItems, setActionItems] = useState<number>(0)
  
  // Fetch user statistics from server
  useEffect(() => {
    if (user.userId) {
      // Fetch email statistics
      fetch(`/api/email-statistics/${user.userId}`)
        .then(res => res.json())
        .then(data => {
          setStats({
            total: data.total_emails || 0,
            important: data.important_emails || 0,
            starred: data.starred_emails || 0,
            needsFollowup: data.followup_emails || 0,
            actionItems: 0 // Will be set by action items fetch
          })
        })
        .catch(err => console.error("Error fetching email stats:", err))
        
      // Fetch action items count
      fetch(`/api/user-action-items?user_id=${user.userId}&completed=false`)
        .then(res => res.json())
        .then(data => {
          setActionItems(data.length || 0)
        })
        .catch(err => console.error("Error fetching action items:", err))
    } else if (user.emailStats) {
      // Use provided stats if available
      setStats(user.emailStats)
    }
  }, [user.userId, user.emailStats])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{user.name?.slice(0, 2).toUpperCase() || "UN"}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              
              {/* Show notifications if we have action items */}
              {actionItems > 0 && (
                <Badge variant="destructive" className="mr-1 h-5 w-5 rounded-full p-0 text-xs">
                  {actionItems}
                </Badge>
              )}
              
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{user.name?.slice(0, 2).toUpperCase() || "UN"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Email Stats Section */}
            {stats && (
              <>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  Email Stats
                </div>
                <div className="grid grid-cols-2 gap-1 px-2 py-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
                          <Mail className="h-4 w-4" />
                          <span>{stats.total}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Total Emails</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
                          <Timer className="h-4 w-4" />
                          <span>{stats.needsFollowup}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Needs Followup</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </>
            )}
            
            {actionItems > 0 && (
              <DropdownMenuItem className="bg-muted/50 text-destructive">
                <Calendar className="mr-2 h-4 w-4" />
                {actionItems} Action {actionItems === 1 ? 'Item' : 'Items'}
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                Gmail Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
