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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Mail, AlertTriangle, ArrowRight } from "lucide-react";

type Email = {
  id: number;
  subject: string;
  sender: string;
  sender_email: string;
  received_at: string;
  summary: string;
  is_important: boolean;
};

interface ImportantEmailsProps {
  emails: Email[];
  isLoading: boolean;
  onSelectEmail: (emailId: number) => void;
  onRefresh: () => void;
}

export function ImportantEmails({ emails, isLoading, onSelectEmail, onRefresh }: ImportantEmailsProps) {
  if (isLoading) {
    return <ImportantEmailsSkeleton />;
  }

  if (!emails.length) {
    return <EmptyImportantEmailsList onRefresh={onRefresh} />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Important Emails
          </span>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Smart summaries of emails marked as important or detected as urgent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emails.map((email) => (
              <TableRow key={email.id}>
                <TableCell className="font-medium">{email.subject}</TableCell>
                <TableCell>{email.sender}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="max-w-[300px] truncate">{email.summary}</TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onSelectEmail(email.id)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ImportantEmailsSkeleton() {
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

function EmptyImportantEmailsList({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
          Important Emails
        </CardTitle>
        <CardDescription>
          No emails marked as important or detected as urgent were found
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Mail className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No important emails found</h3>
        <p className="text-muted-foreground text-center mb-6">
          You don&apos;t have any emails marked as important or detected as urgent. Mark emails as important 
          or detected as urgent to see them here with AI summaries.
        </p>
        <Button onClick={onRefresh}>Refresh Emails</Button>
      </CardContent>
    </Card>
  );
} 