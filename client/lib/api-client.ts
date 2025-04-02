// API client for the Smart Email Parser backend

export interface User {
  id: number;
  email: string;
  is_authenticated: boolean;
}

export interface EmailSummary {
  id: number;
  subject: string;
  sender: string;
  sender_email: string;
  received_at: string;
  summary: string;
  is_important: boolean;
  is_starred?: boolean;
  category?: string;
  sentiment?: string;
  priority_score?: number;
  needs_followup?: boolean;
}

export interface Entity {
  id: number;
  text: string;
  type: string;
}

export interface Keyword {
  id: number;
  word: string;
  score: number;
}

export interface ActionItem {
  id: number;
  text: string;
  deadline?: string;
  completed: boolean;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: string;
}

export interface EmailDetail extends EmailSummary {
  clean_content: string;
  sentiment_score?: number;
  followup_date?: string;
  keywords: Keyword[];
  entities: Entity[];
  action_items: ActionItem[];
  contacts: Contact[];
}

export interface EmailStatistics {
  total_emails: number;
  categories: Record<string, number>;
  sentiments: Record<string, number>;
  priority_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  followup_needed: number;
}

export class ApiClient {
  private apiUrl: string;

  constructor(apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.apiUrl = apiUrl;
  }

  // Get user information
  async getUser(userId: number): Promise<User> {
    const response = await fetch(`${this.apiUrl}/auth/user/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch email list for a user
  async getEmails(userId: number): Promise<EmailSummary[]> {
    const response = await fetch(`${this.apiUrl}/emails/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get emails: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch important emails for a user
  async getImportantEmails(userId: number): Promise<EmailSummary[]> {
    const response = await fetch(`${this.apiUrl}/emails/important/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get important emails: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch starred emails for a user
  async getStarredEmails(userId: number): Promise<EmailSummary[]> {
    const response = await fetch(`${this.apiUrl}/emails/starred/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get starred emails: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch emails by category
  async getEmailsByCategory(userId: number, category: string): Promise<EmailSummary[]> {
    const response = await fetch(`${this.apiUrl}/emails/category/${userId}/${category}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get emails by category: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch emails that need follow-up
  async getFollowupEmails(userId: number): Promise<EmailSummary[]> {
    const response = await fetch(`${this.apiUrl}/emails-followup?user_id=${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get follow-up emails: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch emails by sentiment
  async getEmailsBySentiment(userId: number, sentiment: string): Promise<EmailSummary[]> {
    const response = await fetch(`${this.apiUrl}/emails/sentiment/${userId}/${sentiment}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get emails by sentiment: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch a specific email with all details
  async getEmailDetail(userId: number, emailId: number): Promise<EmailDetail> {
    const response = await fetch(`${this.apiUrl}/email-detail/${userId}/${emailId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get email details: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Fetch and process new emails
  async fetchNewEmails(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.apiUrl}/emails/fetch/${userId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch new emails: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Get entities for a user
  async getEntities(userId: number): Promise<Entity[]> {
    const response = await fetch(`${this.apiUrl}/entities/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get entities: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Get keywords for a user
  async getKeywords(userId: number): Promise<Keyword[]> {
    const response = await fetch(`${this.apiUrl}/keywords/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get keywords: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Get action items for a user
  async getActionItems(userId: number, completed: boolean = false): Promise<ActionItem[]> {
    const response = await fetch(`${this.apiUrl}/user-action-items?user_id=${userId}&completed=${String(completed)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get action items: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Update action item status
  async updateActionItemStatus(actionItemId: number, completed: boolean): Promise<ActionItem> {
    const response = await fetch(`${this.apiUrl}/action-items/${actionItemId}?completed=${String(completed)}`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update action item: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Get contacts for a user
  async getContacts(userId: number): Promise<Contact[]> {
    const response = await fetch(`${this.apiUrl}/contacts/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get contacts: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Get email statistics
  async getEmailStatistics(userId: number): Promise<EmailStatistics> {
    const response = await fetch(`${this.apiUrl}/email-statistics/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get email statistics: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Logout user
  async logout(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.apiUrl}/auth/logout/${userId}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to logout: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Create a singleton instance
export const apiClient = new ApiClient(); 