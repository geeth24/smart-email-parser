import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useEmails } from "@/hooks/use-emails";
import { ImportantEmails } from "@/components/important-emails";
import { StarredEmails } from "@/components/starred-emails";
import { FollowupEmails } from "@/components/followup-emails";
import { ActionItems } from "@/components/action-items";
import { EmailDetail } from "@/components/email-detail";
import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  MailQuestion, 
  Star, 
  AlertTriangle, 
  Reply, 
  ClipboardList, 
  Mail
} from "lucide-react";
import { EmailSummary, EmailDetail as ApiEmailDetail } from "@/lib/api-client";
import { ModeToggle } from "@/components/mode-toggle";

// Define adapter types to match component expectations
type Email = {
  id: number;
  subject: string;
  sender: string;
  sender_email: string;
  received_at: string;
  summary: string;
  is_important: boolean;
  is_starred: boolean;
  needs_followup: boolean;
};

// Component expects this type structure
type ComponentEmailDetail = {
  id: number;
  subject: string;
  sender: string;
  sender_email: string;
  received_at: string;
  clean_content: string;
  summary: string;
  is_important: boolean;
  entities: { id: number; text: string; type: string }[];
  keywords: { id: number; word: string; score: number }[];
  followup_date?: string;
  category?: string;
  sentiment?: string;
  needs_followup: boolean;
  priority_score?: number;
  action_items: { id: number; text: string; completed: boolean; deadline?: string }[];
  contacts: { id: number; name: string; email: string; phone?: string; company?: string; position?: string }[];
};

// Adapter function to convert EmailSummary to Email
const adaptEmailSummaries = (emails: EmailSummary[]): Email[] => {
  return emails.map(email => ({
    ...email,
    is_starred: email.is_starred === true,
    needs_followup: email.needs_followup === true
  }));
};

// Simple email preview for sidebar
type EmailPreview = {
  id: number;
  subject: string;
  sender: string;
  received_at: string;
  summary: string;
};

const mapToEmailPreviews = (emails: EmailSummary[]): EmailPreview[] => {
  return emails.map(email => ({
    id: email.id,
    subject: email.subject,
    sender: email.sender,
    received_at: email.received_at,
    summary: email.summary,
  }));
};

// Adapter for EmailDetail
const adaptEmailDetail = (email: ApiEmailDetail | null): ComponentEmailDetail | null => {
  if (!email) return null;
  
  return {
    ...email,
    needs_followup: email.needs_followup === true
  };
};

interface DashboardProps {
  apiUrl: string;
}

export function Dashboard({ apiUrl }: DashboardProps) {
  const { 
    userId, 
    user, 
    isAuthenticated, 
    isLoading: isLoadingAuth, 
    login, 
    logout 
  } = useAuth();
  
  const { 
    emails, 
    importantEmails,
    followupEmails,
    actionItems,
    completedActionItems,
    selectedEmail, 
    isLoadingEmails, 
    isLoadingImportantEmails,
    isLoadingFollowupEmails,
    isLoadingActionItems,
    isFetching,
    fetchEmails, 
    fetchImportantEmails,
    fetchFollowupEmails, 
    fetchNewEmails, 
    fetchActionItems,
    updateActionItemStatus,
    selectEmail, 
    clearSelectedEmail,
    starredEmails,
    isLoadingStarredEmails
  } = useEmails(userId);

  // Track active tab
  const [activeTab, setActiveTab] = useState("all");
  // Track current emails to display in sidebar
  const [sidebarEmails, setSidebarEmails] = useState<EmailPreview[]>([]);
  // Track if an email is being viewed in the main panel
  const [, setIsViewingEmail] = useState(false);

  // Update sidebar emails when emails or activeTab changes
  useEffect(() => {
    // Skip updating sidebar when not needed
    if (!isAuthenticated) return;
    
    // Skip if we're still loading data
    if (isLoadingEmails || isLoadingImportantEmails || 
        isLoadingFollowupEmails || isLoadingStarredEmails) {
      return;
    }
    
    // Pick the right email list based on active tab
    let currentEmails: EmailSummary[] = [];
    
    switch (activeTab) {
      case "all":
        console.log(`All emails available: ${emails.length}`);
        currentEmails = emails;
        break;
      case "starred":
        console.log(`Starred emails available: ${starredEmails.length}`);
        currentEmails = starredEmails;
        break;
      case "important":
        console.log(`Important emails available: ${importantEmails.length}`);
        currentEmails = importantEmails;
        break;
      case "followup":
        console.log(`Followup emails available: ${followupEmails.length}`);
        currentEmails = followupEmails;
        break;
      // No emails for actions tab
      default:
        currentEmails = [];
    }
    
    const emailPreviews = mapToEmailPreviews(currentEmails);
    console.log(`Setting sidebar emails from '${activeTab}': ${emailPreviews.length}`);
    setSidebarEmails(emailPreviews);
  }, [
    activeTab, 
    emails, 
    importantEmails, 
    followupEmails, 
    starredEmails, 
    isLoadingEmails,
    isLoadingImportantEmails,
    isLoadingFollowupEmails,
    isLoadingStarredEmails,
    isAuthenticated
  ]);

  // Set viewing state when selectedEmail changes - use a ref to avoid loops
  const previousSelectedEmailRef = React.useRef<typeof selectedEmail>(null);
  useEffect(() => {
    // Only update if the selected email has actually changed
    if (selectedEmail !== previousSelectedEmailRef.current) {
      setIsViewingEmail(!!selectedEmail);
      previousSelectedEmailRef.current = selectedEmail;
    }
  }, [selectedEmail]);

  // Fetch data initially or when user changes - use ref to track initialization
  const hasInitializedRef = React.useRef(false);
  useEffect(() => {
    if (userId && !hasInitializedRef.current) {
      console.log("Initializing data fetch");
      hasInitializedRef.current = true;
      
      // Stagger the fetch calls to avoid overwhelming the API
      const fetchData = async () => {
        await fetchEmails();
        await fetchImportantEmails();
        await fetchFollowupEmails();
        await fetchActionItems(false);
        await fetchActionItems(true);
      };
      
      fetchData();
    }
  }, [userId]); // Remove dependencies to prevent re-fetching
  
  // Enhanced handleSelectEmail function
  const handleSelectEmail = (emailId: number) => {
    console.log(`Selecting email with ID: ${emailId}`);
    // Remember which tab/list the user was viewing when they selected this email
    const emailSourceTab = activeTab;
    console.log(`Email selected from tab: ${emailSourceTab}`);
    
    selectEmail(emailId);
    setIsViewingEmail(true);
  };

  // Enhanced handleClearSelectedEmail function
  const handleClearSelectedEmail = () => {
    clearSelectedEmail();
    setIsViewingEmail(false);
  };

  const handleNavItemClick = (tabValue: string) => {
    setActiveTab(tabValue);
    // Clear selected email when switching tabs
    if (selectedEmail) {
      handleClearSelectedEmail();
    }
  };

  if (!isAuthenticated && !isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <MailQuestion className="h-24 w-24 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-center">
          Smart Email Analysis
        </h2>
        <p className="text-muted-foreground text-center max-w-lg">
          Sign in with your Google account to analyze and summarize your important emails.
          We&apos;ll extract key information, action items, contacts, and provide AI-powered insights.
        </p>
        <AuthButton onAuthSuccess={login} apiUrl={apiUrl} />
      </div>
    );
  }

  // Loading state
  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Prepare the sidebar data without memoization
  const sidebarData = {
    user: user ? {
      name: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      avatar: '', // Could add user avatar if available
    } : {
      name: 'User',
      email: '',
      avatar: '',
    },
    navMain: [
      {
        title: "All Emails",
        url: "#",
        icon: Mail,
        isActive: activeTab === "all",
        tabValue: "all",
      },
      {
        title: "Starred",
        url: "#",
        icon: Star,
        isActive: activeTab === "starred",
        tabValue: "starred",
        badge: starredEmails.length > 0 ? starredEmails.length : undefined,
      },
      {
        title: "Important",
        url: "#",
        icon: AlertTriangle,
        isActive: activeTab === "important",
        tabValue: "important",
      },
      {
        title: "Follow-ups",
        url: "#",
        icon: Reply,
        isActive: activeTab === "followup",
        tabValue: "followup",
        badge: followupEmails.length > 0 ? followupEmails.length : undefined,
      },
      {
        title: "Tasks",
        url: "#",
        icon: ClipboardList,
        isActive: activeTab === "actions",
        tabValue: "actions",
        badge: actionItems.length > 0 ? actionItems.length : undefined,
      },
    ],
    emails: sidebarEmails,
  };

  const renderContent = () => {
    // If we have a selected email, show email detail
    if (selectedEmail) {
      return (
        <EmailDetail 
          email={adaptEmailDetail(selectedEmail)}
          isLoading={isLoadingEmails}
          onBack={handleClearSelectedEmail}
        />
      );
    }

    // Otherwise, show the appropriate tab content
    switch (activeTab) {
      case "all":
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-lg text-muted-foreground">Select an email</p>
          </div>
        );
      case "starred":
        return (
          <StarredEmails
            emails={adaptEmailSummaries(starredEmails)}
            isLoading={isLoadingStarredEmails || isFetching}
            onSelectEmail={handleSelectEmail}
            onRefresh={fetchNewEmails}
          />
        );
      case "important":
        return (
          <ImportantEmails 
            emails={adaptEmailSummaries(importantEmails)}
            isLoading={isLoadingImportantEmails || isFetching}
            onSelectEmail={handleSelectEmail}
            onRefresh={fetchNewEmails}
          />
        );
      case "followup":
        return (
          <FollowupEmails
            emails={adaptEmailSummaries(followupEmails)}
            isLoading={isLoadingFollowupEmails || isFetching}
            onSelectEmail={handleSelectEmail}
            onRefresh={fetchFollowupEmails}
          />
        );
      case "actions":
        return (
          <ActionItems
            actionItems={actionItems}
            completedItems={completedActionItems}
            isLoading={isLoadingActionItems}
            onUpdateStatus={updateActionItemStatus}
            onRefresh={() => {
              fetchActionItems(false);
              fetchActionItems(true);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        sidebarData={sidebarData}
        onNavItemClick={handleNavItemClick}
        onLogout={logout}
        onSelectEmail={handleSelectEmail}
      />

      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" onClick={selectedEmail ? handleClearSelectedEmail : undefined}>
                  {selectedEmail ? "Emails" : sidebarData.navMain.find(item => item.tabValue === activeTab)?.title || "Emails"}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {selectedEmail && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="max-w-[50vw]">
                    <BreadcrumbPage className="truncate">{selectedEmail.subject}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <div className="ml-auto">
                <Button variant="outline" onClick={() => fetchNewEmails()} disabled={isFetching}>
                  {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Refresh Emails
              </Button>
              </div>
              <ModeToggle />
            </div>
          )}
        </header>
        
        <div className="flex flex-1 flex-col p-4 overflow-x-auto">
          {renderContent()}
        </div>
      </SidebarInset>
      
      <Toaster />
    </SidebarProvider>
  );
} 