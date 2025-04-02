import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Clock, 
  Tag, 
  User, 
  Building, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  Reply,
  Phone,
  Briefcase,
  Star,
  ExternalLink,
  Mail,
  MessageCircle,
  LucideIcon,
  FileText,
  ArrowUpRight,
  Lightbulb,
  CheckSquare
} from "lucide-react";

type Entity = {
  id: number;
  text: string;
  type: string;
};

type Keyword = {
  id: number;
  word: string;
  score: number;
};

type EmailDetail = {
  id: number;
  subject: string;
  sender: string;
  sender_email: string;
  received_at: string;
  clean_content: string;
  summary: string;
  is_important: boolean;
  entities: Entity[];
  keywords: Keyword[];
  followup_date?: string;
  category?: string;
  sentiment?: string;
  needs_followup: boolean;
  priority_score?: number;
  action_items: { id: number; text: string; completed: boolean; deadline?: string }[];
  contacts: { id: number; name: string; email: string; phone?: string; company?: string; position?: string }[];
};

interface EmailDetailProps {
  email: EmailDetail | null;
  isLoading: boolean;
  onBack: () => void;
}

// Helper function to extract initials from a name
const getInitials = (name: string): string => {
  const names = name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to clean and format summary text with proper links
const formatSummaryText = (text: string) => {
  // Split text by common URL patterns
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a URL
    if (part.match(urlRegex)) {
      // Clean the URL by removing tracking parameters
      let cleanUrl = part;
      try {
        const url = new URL(part);
        // Remove common tracking parameters
        ['cm_mmc', 'customerEmail', 'sfmc_Sub', 'emId', 'cm_mmca2', 'mi_u', 'mi_ecmp'].forEach(param => {
          url.searchParams.delete(param);
        });
        cleanUrl = url.toString();
      } catch {
        // If URL parsing fails, use the original
      }
      
      // Extract domain for display
      let displayText = cleanUrl;
      try {
        const url = new URL(cleanUrl);
        displayText = url.hostname;
      } catch {
        // Keep original if parsing fails
      }
      
      // Return formatted link
      return (
        <a 
          key={index} 
          href={cleanUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center hover:underline"
        >
          {displayText}
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      );
    }
    
    // Return regular text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

// Helper function to clean and format email content
const formatContentText = (text: string) => {
  // Clean up invisible characters and spacing issues
  const cleanText = text.replace(/‌+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  
  // Find and format URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = cleanText.split(urlRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a URL
    if (part.match(urlRegex)) {
      // Clean the URL by removing tracking parameters
      let cleanUrl = part;
      try {
        const url = new URL(part);
        // Remove common tracking parameters
        ['qs', 'cm_mmc', 'customerEmail', 'sfmc_Sub', 'emId', 'cm_mmca2', 'mi_u', 'mi_ecmp'].forEach(param => {
          url.searchParams.delete(param);
        });
        cleanUrl = url.toString();
      } catch {
        // If URL parsing fails, use the original
      }
      
      // Extract domain for display
      let displayText = cleanUrl;
      try {
        const url = new URL(cleanUrl);
        displayText = url.hostname;
      } catch {
        // Keep original if parsing fails
      }
      
      // Return formatted link
      return (
        <a 
          key={index} 
          href={cleanUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center hover:underline"
        >
          {displayText}
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      );
    }
    
    // Return regular text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

interface CategoryInfo {
  icon: LucideIcon;
  color: string;
  label: string;
}

const getCategoryInfo = (category: string): CategoryInfo => {
  const categories: Record<string, CategoryInfo> = {
    "Meeting": { icon: Calendar, color: "text-blue-600", label: "Meeting" },
    "Sales": { icon: ArrowUpRight, color: "text-green-600", label: "Sales" },
    "Update": { icon: MessageCircle, color: "text-purple-600", label: "Update" },
    "Personal": { icon: User, color: "text-pink-600", label: "Personal" },
    "Finance": { icon: Star, color: "text-amber-600", label: "Finance" },
    "Technical": { icon: FileText, color: "text-slate-600", label: "Technical" },
    "Promotional": { icon: Tag, color: "text-orange-600", label: "Promotional" },
    "Other": { icon: Mail, color: "text-gray-600", label: "Other" }
  };
  
  return categories[category] || categories["Other"];
};

export function EmailDetail({ email, isLoading, onBack }: EmailDetailProps) {
  const [actionItems, setActionItems] = useState<
    { id: number; text: string; completed: boolean; deadline?: string }[]
  >(email?.action_items || []);
  
  if (isLoading || !email) {
    return <EmailDetailSkeleton onBack={onBack} />;
  }

  // Group entities by type
  const entityGroups = email.entities.reduce((groups, entity) => {
    const type = entity.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(entity);
    return groups;
  }, {} as Record<string, Entity[]>);

  // Sort keywords by score
  const sortedKeywords = [...email.keywords].sort((a, b) => b.score - a.score);

  // Format date for follow-up if needed
  const formattedFollowupDate = email.followup_date 
    ? format(new Date(email.followup_date), "PPP") 
    : null;
    
  // Handle action item toggling
  const toggleActionItem = (id: number) => {
    setActionItems(items => 
      items.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };
  
  // Get category info
  const categoryInfo = email.category ? getCategoryInfo(email.category) : null;

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Email Header Card */}
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl font-semibold">{email.subject}</CardTitle>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(email.sender)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{email.sender}</p>
                <p className="text-xs text-muted-foreground">{email.sender_email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {format(new Date(email.received_at), "PPP p")}
                </span>
              </div>
              
              {categoryInfo && (
                <div className="flex items-center gap-1">
                  <categoryInfo.icon className={`h-4 w-4 ${categoryInfo.color}`} />
                  <span className="text-sm font-medium">{categoryInfo.label}</span>
                </div>
              )}
              
              {email.priority_score && (
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${
                    email.priority_score >= 8 ? "bg-red-500" :
                    email.priority_score >= 4 ? "bg-amber-500" :
                    "bg-green-500"
                  }`} />
                  <span className="text-sm font-medium">
                    Priority {Math.round(email.priority_score)}/10
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Status Badges */}
        {(email.is_important || email.sentiment || email.needs_followup) && (
          <CardContent className="pb-0 pt-0">
            <div className="flex flex-wrap gap-2 mt-2">
              {email.is_important && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Important
                </Badge>
              )}
              {email.sentiment && (
                <Badge 
                  variant="secondary" 
                  className={
                    email.sentiment === "Positive" ? "bg-green-100 text-green-700 border-green-200" :
                    email.sentiment === "Negative" ? "bg-red-100 text-red-700 border-red-200" :
                    email.sentiment === "Urgent" ? "bg-purple-100 text-purple-700 border-purple-200" :
                    "bg-gray-100 text-gray-700 border-gray-200"
                  }
                >
                  {email.sentiment === "Positive" && <Smile className="h-3 w-3 mr-1" />}
                  {email.sentiment === "Negative" && <Frown className="h-3 w-3 mr-1" />}
                  {email.sentiment === "Urgent" && <Clock className="h-3 w-3 mr-1" />}
                  {email.sentiment === "Neutral" && <Meh className="h-3 w-3 mr-1" />}
                  {email.sentiment}
                </Badge>
              )}
              {email.needs_followup && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  <Reply className="h-3 w-3 mr-1" /> Follow-up
                  {formattedFollowupDate && ` by ${formattedFollowupDate}`}
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Email Summary Highlight Card */}
      <Card className="w-full bg-primary/5 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose-sm max-w-none">
            {email.summary.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">{formatSummaryText(paragraph)}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Body and Insights Tabs */}
      <Card className="w-full">
        <CardContent className="p-0">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full border-b rounded-none px-4 justify-start">
              <TabsTrigger value="content" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Content</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                <span>Insights</span>
              </TabsTrigger>
              <TabsTrigger value="action-items" className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                <span>Action Items {actionItems.length > 0 && `(${actionItems.length})`}</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Contacts {email.contacts.length > 0 && `(${email.contacts.length})`}</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="p-4 mt-0">
              <ScrollArea className="h-[400px] pr-4">
                {email.clean_content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 text-sm leading-relaxed">
                    {formatContentText(paragraph)}
                  </p>
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="insights" className="mt-0 p-4">
              <div className="space-y-6">
                {/* Keywords Card */}
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Tag className="h-4 w-4" /> Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sortedKeywords.length > 0 ? (
                      sortedKeywords.map((keyword) => (
                        <Badge key={keyword.id} variant="outline" className="bg-muted">
                          {keyword.word}
                          <span className="ml-1 text-xs opacity-70">
                            {keyword.score.toFixed(2)}
                          </span>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No keywords detected</p>
                    )}
                  </div>
                </div>
                
                {/* Entities Section */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Entities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(entityGroups).length > 0 ? (
                      Object.entries(entityGroups).map(([type, entities]) => (
                        <div key={type} className="border rounded-md p-3">
                          <h4 className="text-xs font-semibold flex items-center gap-1 mb-2 text-muted-foreground">
                            {type === "PERSON" && <User className="h-3 w-3" />}
                            {type === "ORG" && <Building className="h-3 w-3" />}
                            {type === "GPE" && <MapPin className="h-3 w-3" />}
                            {type === "DATE" && <Calendar className="h-3 w-3" />}
                            {type}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {entities.map((entity) => (
                              <Badge key={entity.id} variant="secondary">
                                {entity.text}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground col-span-2">No entities detected</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="action-items" className="mt-0 p-4">
              {actionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckSquare className="h-12 w-12 text-muted-foreground/20 mb-2" />
                  <p className="text-muted-foreground">No action items detected in this email.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {actionItems.map((item) => (
                    <li 
                      key={item.id} 
                      className={`flex items-start gap-3 p-3 border rounded-md transition-colors ${
                        item.completed ? 'bg-muted/50 border-muted' : 'bg-amber-50/50 border-amber-100'
                      }`}
                    >
                      <Checkbox 
                        id={`item-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={() => toggleActionItem(item.id)}
                        className={item.completed ? 'text-green-500' : ''}
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`item-${item.id}`}
                          className={`text-sm cursor-pointer ${item.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}
                        >
                          {item.text}
                        </label>
                        {item.deadline && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(item.deadline), "PPP")}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            
            <TabsContent value="contacts" className="mt-0 p-4">
              {email.contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <User className="h-12 w-12 text-muted-foreground/20 mb-2" />
                  <p className="text-muted-foreground">No contacts detected in this email.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {email.contacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className="border rounded-lg p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{contact.name}</h4>
                        <div className="space-y-1 mt-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" /> 
                            <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                              {contact.email}
                            </a>
                          </p>
                          {contact.phone && (
                            <p className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" /> {contact.phone}
                            </p>
                          )}
                          {contact.company && (
                            <p className="text-sm flex items-center gap-1">
                              <Building className="h-3 w-3 text-muted-foreground" /> {contact.company}
                            </p>
                          )}
                          {contact.position && (
                            <p className="text-sm flex items-center gap-1">
                              <Briefcase className="h-3 w-3 text-muted-foreground" /> {contact.position}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col space-y-4 w-full">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-7 w-72" />
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-36 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardContent className="p-0 pt-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="p-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 