import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import { Mail, Star, ArrowRight } from "lucide-react";

type Email = {
  id: number;
  subject: string;
  sender: string;
  sender_email: string;
  received_at: string;
  summary: string;
  is_starred: boolean;
};

interface StarredEmailsProps {
  emails: Email[];
  isLoading: boolean;
  onSelectEmail: (emailId: number) => void;
  onRefresh: () => void;
}

export function StarredEmails({ emails, isLoading, onSelectEmail, onRefresh }: StarredEmailsProps) {
  if (isLoading) {
    return <StarredEmailsSkeleton />;
  }

  if (!emails.length) {
    return <EmptyStarredEmailsList onRefresh={onRefresh} />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Star className="mr-2 h-5 w-5 text-yellow-500" />
            Starred Emails
          </span>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Smart summaries of your starred emails from Gmail
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

function StarredEmailsSkeleton() {
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

function EmptyStarredEmailsList({ onRefresh }: { onRefresh: () => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="mr-2 h-5 w-5 text-yellow-500" />
          Starred Emails
        </CardTitle>
        <CardDescription>
          No starred emails found
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Mail className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No starred emails found</h3>
        <p className="text-muted-foreground text-center mb-6">
          Star emails in Gmail that you want to analyze and summarize, then click 
          the refresh button to fetch them.
        </p>
        <Button onClick={onRefresh}>Refresh Emails</Button>
      </CardContent>
    </Card>
  );
} 