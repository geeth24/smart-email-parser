import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, ClipboardList, Clock } from "lucide-react";

type ActionItem = {
  id: number;
  text: string;
  deadline?: string;
  completed: boolean;
};

interface ActionItemsProps {
  actionItems: ActionItem[];
  completedItems: ActionItem[];
  isLoading: boolean;
  onUpdateStatus: (id: number, completed: boolean) => void;
  onRefresh: () => void;
}

export function ActionItems({ 
  actionItems, 
  completedItems, 
  isLoading, 
  onUpdateStatus, 
  onRefresh 
}: ActionItemsProps) {
  
  if (isLoading) {
    return <ActionItemsSkeleton />;
  }

  const hasPendingItems = actionItems.length > 0;
  const hasCompletedItems = completedItems.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-primary" />
            Action Items
          </span>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Tasks and action items extracted from your emails
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
            <TabsTrigger value="pending">
              Pending {hasPendingItems && `(${actionItems.length})`}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed {hasCompletedItems && `(${completedItems.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            {!hasPendingItems ? (
              <div className="text-center p-6">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any pending action items from your emails.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <ActionItemCard 
                    key={item.id} 
                    item={item} 
                    onUpdateStatus={onUpdateStatus}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {!hasCompletedItems ? (
              <div className="text-center p-6">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">No completed items</h3>
                <p className="text-muted-foreground">
                  You don&apos;t have any completed action items yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedItems.map((item) => (
                  <ActionItemCard 
                    key={item.id} 
                    item={item} 
                    onUpdateStatus={onUpdateStatus}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ActionItemCard({ 
  item, 
  onUpdateStatus 
}: { 
  item: ActionItem; 
  onUpdateStatus: (id: number, completed: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg">
      <Checkbox 
        checked={item.completed} 
        onCheckedChange={(checked) => {
          if (typeof checked === 'boolean') {
            onUpdateStatus(item.id, checked);
          }
        }}
        className="mt-1"
      />
      <div className="flex-1">
        <p className={item.completed ? "line-through text-muted-foreground" : ""}>
          {item.text}
        </p>
        {item.deadline && (
          <div className="mt-2 flex items-center">
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" /> 
              Due: {format(new Date(item.deadline), "PPP")}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItemsSkeleton() {
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
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  );
} 