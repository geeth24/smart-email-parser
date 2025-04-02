"use client"

import * as React from "react"
import { ArchiveX, File, Inbox, MailQuestion, Send, Trash2 } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Define types for the sidebar props
interface SidebarDataUser {
  name: string
  email: string
  avatar: string
}

// Allow any valid Lucide icon component
type IconComponent = React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & {
  title?: string;
  titleId?: string;
}>;

interface NavItem {
  title: string
  url: string
  icon: IconComponent
  isActive: boolean
  tabValue: string
  badge?: number
}

interface EmailPreview {
  id: number
  subject: string
  sender: string
  received_at: string
  summary: string
  isUnread?: boolean
}

interface SidebarData {
  user: SidebarDataUser
  navMain: NavItem[]
  emails?: EmailPreview[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  sidebarData?: SidebarData
  onNavItemClick?: (tabValue: string) => void
  onLogout?: () => void
  onSelectEmail?: (emailId: number) => void
}

export function AppSidebar({ 
  sidebarData, 
  onNavItemClick,
  onLogout,
  onSelectEmail,
  ...props 
}: AppSidebarProps) {
  const { setOpen } = useSidebar()
  
  // Add a state for unread toggle
  const [showUnreadsOnly, setShowUnreadsOnly] = React.useState(false);
  
  // Add a state for search query
  const [searchQuery, setSearchQuery] = React.useState("");
  
  // Use default data if no custom data is provided
  const defaultNavItems = [
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      isActive: true,
      tabValue: "inbox",
    },
    {
      title: "Drafts",
      url: "#",
      icon: File,
      isActive: false,
      tabValue: "drafts",
    },
    {
      title: "Sent",
      url: "#",
      icon: Send,
      isActive: false,
      tabValue: "sent",
    },
    {
      title: "Junk",
      url: "#",
      icon: ArchiveX,
      isActive: false,
      tabValue: "junk",
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
      isActive: false,
      tabValue: "trash",
    },
  ] as NavItem[];

  const data = sidebarData || {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: defaultNavItems,
    emails: [],
  };
  
  // Log emails count once to avoid repeated logging
  const emailsCount = data.emails?.length || 0;
  
  // Function to handle email selection
  const handleEmailSelect = (emailId: number) => {
    if (onSelectEmail) {
      onSelectEmail(emailId);
    }
  };

  // Date formatting helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Filter emails based on search query and unread state
  const filteredEmails = React.useMemo(() => {
    if (!data.emails || !data.emails.length) return [];
    
    return data.emails.filter(email => {
      // Filter by unread status if the toggle is on
      if (showUnreadsOnly && !email.isUnread) {
        return false;
      }
      
      // Filter by search query if there is one
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          email.subject.toLowerCase().includes(query) ||
          email.sender.toLowerCase().includes(query) ||
          email.summary.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [data.emails, searchQuery, showUnreadsOnly]);
  
  // Only show the sidebar with emails if we have emails to display
  const showEmailsSidebar = emailsCount > 0;
  
  // Get the active item for use in the sidebar header
  const activeItem = data.navMain.find(item => item.isActive);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar with navigation */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                   <MailQuestion className="h-4 w-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Smart Email</span>
                    <span className="truncate text-xs">Parser</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        if (onNavItemClick) {
                          onNavItemClick(item.tabValue);
                        }
                        setOpen(true);
                      }}
                      isActive={item.isActive}
                      className="px-2.5 md:px-2"
                      asChild
                    >
                      <a href={`#${item.tabValue}`}>
                        <div className="relative inline-flex items-center justify-center">
                          <item.icon className="h-4 w-4" />
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium z-10">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser 
            user={data.user} 
            onLogout={onLogout}
          />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar - email list view */}
      <Sidebar 
        collapsible="none" 
        className="hidden flex-1 md:flex max-w-full"
      >
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground truncate">
              {activeItem?.title || "Smart Email Parser"}
            </div>
            <Label className="flex items-center gap-2 text-sm flex-shrink-0 ml-2">
              <span>Unreads</span>
              <Switch 
                className="shadow-none" 
                checked={showUnreadsOnly} 
                onCheckedChange={setShowUnreadsOnly} 
              />
            </Label>
          </div>
          <SidebarInput 
            placeholder="Type to search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto overflow-x-hidden">
          <SidebarGroup className="px-0">
            <SidebarGroupContent className="max-w-full">
              {showEmailsSidebar ? (
                filteredEmails.length > 0 ? (
                  filteredEmails.map((email) => (
                    <a
                      href="#"
                      key={email.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleEmailSelect(email.id);
                      }}
                      className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full overflow-hidden"
                    >
                      <div className="flex w-full items-center gap-2 overflow-hidden">
                        <span className={`truncate max-w-[50%] ${email.isUnread ? 'font-bold' : 'font-medium'}`}>
                          {email.sender}
                        </span>
                        <span className="ml-auto flex-shrink-0 text-xs text-muted-foreground">{formatDate(email.received_at)}</span>
                      </div>
                      <span className={`truncate w-full ${email.isUnread ? 'font-bold' : 'font-medium'}`}>
                        {email.subject}
                      </span>
                      <span className="line-clamp-2 w-full text-xs text-muted-foreground">
                        {email.summary}
                      </span>
                    </a>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground w-full">
                    <Inbox className="h-8 w-8 mb-4" />
                    <p className="mb-2">No emails match your filters</p>
                    <p className="text-xs">{searchQuery ? 'Try a different search term' : 'Try changing your filters'}</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground w-full">
                  <Inbox className="h-8 w-8 mb-4" />
                  <p className="mb-2">No emails to display</p>
                  <p className="text-xs">Select a category from the sidebar</p>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
