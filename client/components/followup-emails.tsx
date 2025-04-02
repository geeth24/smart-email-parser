import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, } from "date-fns";
import { Mail, Reply, ArrowRight, Calendar } from "lucide-react";

type Email = {
  id: number;
  subject: string;
  sender: string;
  sender_email: string;
  received_at: string;
  summary: string;
  is_important: boolean;
  needs_followup: boolean;
  followup_date?: string;
};

interface FollowupEmailsProps {
  emails: Email[];
  isLoading: boolean;
  onSelectEmail: (emailId: number) => void;
  onRefresh: () => void;
}

export function FollowupEmails({ emails, isLoading, onSelectEmail, onRefresh }: FollowupEmailsProps) {
  if (isLoading) {
    return <FollowupEmailsSkeleton />;
  }

  if (!emails.length) {
    return <EmptyFollowupList onRefresh={onRefresh} />;
  }

  // Group emails by follow-up date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() + 7);
  
  // Group emails by follow-up timing
  const overdueEmails = emails.filter(email => {
    if (!email.followup_date) return false;
    const followupDate = new Date(email.followup_date);
    return followupDate < today;
  });
  
  const todayEmails = emails.filter(email => {
    if (!email.followup_date) return false;
    const followupDate = new Date(email.followup_date);
    return followupDate >= today && followupDate < tomorrow;
  });
  
  const thisWeekEmails = emails.filter(email => {
    if (!email.followup_date) return false;
    const followupDate = new Date(email.followup_date);
    return followupDate >= tomorrow && followupDate < thisWeek;
  });
  
  const laterEmails = emails.filter(email => {
    if (!email.followup_date) return true; // Emails with no specific date
    const followupDate = new Date(email.followup_date);
    return followupDate >= thisWeek;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Reply className="mr-2 h-5 w-5 text-indigo-500" />
            Follow-up Emails
          </span>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Emails that need your response or follow-up
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {overdueEmails.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-3 flex items-center text-red-600">
                <Badge variant="destructive" className="mr-2">Overdue</Badge>
                Needs immediate attention
              </h3>
              <EmailTable emails={overdueEmails} onSelectEmail={onSelectEmail} />
            </div>
          )}
          
          {todayEmails.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-3 flex items-center">
                <Badge className="bg-amber-500 mr-2">Today</Badge>
                Follow up today
              </h3>
              <EmailTable emails={todayEmails} onSelectEmail={onSelectEmail} />
            </div>
          )}
          
          {thisWeekEmails.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-3 flex items-center">
                <Badge className="bg-blue-500 mr-2">This Week</Badge>
                Follow up this week
              </h3>
              <EmailTable emails={thisWeekEmails} onSelectEmail={onSelectEmail} />
            </div>
          )}
          
          {laterEmails.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-3 flex items-center">
                <Badge variant="outline" className="mr-2">Later</Badge>
                Follow up later
              </h3>
              <EmailTable emails={laterEmails} onSelectEmail={onSelectEmail} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmailTable({ emails, onSelectEmail }: { emails: Email[], onSelectEmail: (id: number) => void }) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Follow-up By</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((email) => (
            <TableRow key={email.id}>
              <TableCell className="font-medium">{email.subject}</TableCell>
              <TableCell>{email.sender}</TableCell>
              <TableCell>
                {email.followup_date ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> 
                    {format(new Date(email.followup_date), "PP")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No specific date</span>
                )}
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onSelectEmail(email.id)}
                >
                  <ArrowRight className="h-4 w-4 mr-1" /> View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FollowupEmailsSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-24" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-72" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

function EmptyFollowupList({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Reply className="mr-2 h-5 w-5 text-indigo-500" />
          Follow-up Emails
        </CardTitle>
        <CardDescription>
          No follow-up emails found
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Mail className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">All caught up!</h3>
        <p className="text-muted-foreground text-center mb-6">
          You don&apos;t have any emails that need follow-up at the moment.
        </p>
        <Button onClick={onRefresh}>Refresh Emails</Button>
      </CardContent>
    </Card>
  );
} 