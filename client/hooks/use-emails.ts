import { useState, useEffect } from 'react';
import { 
  apiClient, 
  EmailSummary, 
  EmailDetail,
  ActionItem,
  Contact,
  EmailStatistics
} from '@/lib/api-client';
import { toast } from 'sonner';

export function useEmails(userId: number | null) {
  // Email lists
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [importantEmails, setImportantEmails] = useState<EmailSummary[]>([]);
  const [followupEmails, setFollowupEmails] = useState<EmailSummary[]>([]);
  const [starredEmails, setStarredEmails] = useState<EmailSummary[]>([]);
  
  // Email categories
  const [emailsByCategory, setEmailsByCategory] = useState<Record<string, EmailSummary[]>>({});
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  
  // Email sentiments
  const [emailsBySentiment, setEmailsBySentiment] = useState<Record<string, EmailSummary[]>>({});
  
  // Selected email
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  
  // Action items and contacts
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [completedActionItems, setCompletedActionItems] = useState<ActionItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Statistics
  const [statistics, setStatistics] = useState<EmailStatistics | null>(null);
  
  // Loading states
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isLoadingImportantEmails, setIsLoadingImportantEmails] = useState(false);
  const [isLoadingFollowupEmails, setIsLoadingFollowupEmails] = useState(false);
  const [isLoadingStarredEmails, setIsLoadingStarredEmails] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingActionItems, setIsLoadingActionItems] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingStatistics, setIsLoadingStatistics] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch emails when userId changes
  useEffect(() => {
    if (!userId) {
      // Reset all state when user is logged out
      setEmails([]);
      setImportantEmails([]);
      setFollowupEmails([]);
      setStarredEmails([]);
      setEmailsByCategory({});
      setCategoriesList([]);
      setEmailsBySentiment({});
      setSelectedEmailId(null);
      setSelectedEmail(null);
      setActionItems([]);
      setCompletedActionItems([]);
      setContacts([]);
      setStatistics(null);
      return;
    }

    // Validate userId
    const id = Number(userId);
    if (isNaN(id) || id <= 0) {
      console.error('Invalid user ID:', userId);
      return;
    }

    // Fetch all data
    fetchEmails();
    fetchImportantEmails();
    fetchFollowupEmails();
    fetchStarredEmails();
    fetchActionItems();
    fetchContacts();
    fetchEmailStatistics();
  }, [userId]);

  // Fetch selected email details when selectedEmailId changes
  useEffect(() => {
    if (!userId || !selectedEmailId) {
      setSelectedEmail(null);
      return;
    }

    fetchEmailDetail(selectedEmailId);
  }, [userId, selectedEmailId]);

  // Fetch all emails
  const fetchEmails = async () => {
    if (!userId) return;
    
    setIsLoadingEmails(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const emailsData = await apiClient.getEmails(id);
      setEmails(emailsData);
      
      // Extract unique categories from emails
      const categories = new Set<string>();
      emailsData.forEach(email => {
        if (email.category) {
          categories.add(email.category);
        }
      });
      
      // Fetch emails for each category
      const categoryList = Array.from(categories);
      setCategoriesList(categoryList);
      
      // Populate emails by category
      const byCategory: Record<string, EmailSummary[]> = {};
      for (const category of categoryList) {
        byCategory[category] = emailsData.filter(email => email.category === category);
      }
      setEmailsByCategory(byCategory);
      
      // Populate emails by sentiment
      const bySentiment: Record<string, EmailSummary[]> = {
        "Positive": [],
        "Negative": [],
        "Neutral": [],
        "Urgent": []
      };
      
      emailsData.forEach(email => {
        if (email.sentiment && bySentiment[email.sentiment]) {
          bySentiment[email.sentiment].push(email);
        }
      });
      
      setEmailsBySentiment(bySentiment);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to load emails', {
        description: (error as Error).message,
      });
      setEmails([]);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  // Fetch important emails
  const fetchImportantEmails = async () => {
    if (!userId) return;
    
    setIsLoadingImportantEmails(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const emailsData = await apiClient.getImportantEmails(id);
      setImportantEmails(emailsData);
    } catch (error) {
      console.error('Error fetching important emails:', error);
      toast.error('Failed to load important emails', {
        description: (error as Error).message,
      });
      setImportantEmails([]);
    } finally {
      setIsLoadingImportantEmails(false);
    }
  };

  // Fetch follow-up emails
  const fetchFollowupEmails = async () => {
    if (!userId) return;
    
    setIsLoadingFollowupEmails(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const emailsData = await apiClient.getFollowupEmails(id);
      setFollowupEmails(emailsData);
    } catch (error) {
      console.error('Error fetching follow-up emails:', error);
      toast.error('Failed to load follow-up emails', {
        description: (error as Error).message,
      });
      // Reset state on error
      setFollowupEmails([]);
    } finally {
      setIsLoadingFollowupEmails(false);
    }
  };

  // Fetch starred emails
  const fetchStarredEmails = async () => {
    if (!userId) return;
    
    setIsLoadingStarredEmails(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const emailsData = await apiClient.getStarredEmails(id);
      setStarredEmails(emailsData);
    } catch (error) {
      console.error('Error fetching starred emails:', error);
      toast.error('Failed to load starred emails', {
        description: (error as Error).message,
      });
      setStarredEmails([]);
    } finally {
      setIsLoadingStarredEmails(false);
    }
  };

  // Fetch emails by category
  const fetchEmailsByCategory = async (category: string) => {
    if (!userId) return [];
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const emailsData = await apiClient.getEmailsByCategory(id, category);
      
      // Update emails by category
      setEmailsByCategory(prev => ({
        ...prev,
        [category]: emailsData
      }));
      
      return emailsData;
    } catch (error) {
      console.error(`Error fetching ${category} emails:`, error);
      toast.error(`Failed to load ${category} emails`, {
        description: (error as Error).message,
      });
      return [];
    }
  };

  // Fetch emails by sentiment
  const fetchEmailsBySentiment = async (sentiment: string) => {
    if (!userId) return [];
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const emailsData = await apiClient.getEmailsBySentiment(id, sentiment);
      
      // Update emails by sentiment
      setEmailsBySentiment(prev => ({
        ...prev,
        [sentiment]: emailsData
      }));
      
      return emailsData;
    } catch (error) {
      console.error(`Error fetching ${sentiment} emails:`, error);
      toast.error(`Failed to load ${sentiment} emails`, {
        description: (error as Error).message,
      });
      return [];
    }
  };

  // Fetch specific email's details
  const fetchEmailDetail = async (emailId: number) => {
    if (!userId) return;
    
    setIsLoadingEmail(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const emailData = await apiClient.getEmailDetail(id, emailId);
      setSelectedEmail(emailData);
    } catch (error) {
      console.error('Error fetching email details:', error);
      toast.error('Failed to load email details', {
        description: (error as Error).message,
      });
      setSelectedEmail(null);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // Fetch action items
  const fetchActionItems = async (completed: boolean = false) => {
    if (!userId) return;
    
    setIsLoadingActionItems(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const items = await apiClient.getActionItems(id, completed);
      
      if (completed) {
        setCompletedActionItems(items);
      } else {
        setActionItems(items);
      }
    } catch (error) {
      console.error('Error fetching action items:', error);
      toast.error('Failed to load action items', {
        description: (error as Error).message,
      });
      // Reset state on error
      if (completed) {
        setCompletedActionItems([]);
      } else {
        setActionItems([]);
      }
    } finally {
      setIsLoadingActionItems(false);
    }
  };

  // Update action item status
  const updateActionItemStatus = async (actionItemId: number, completed: boolean) => {
    try {
      // Validate action item ID
      if (isNaN(actionItemId) || actionItemId <= 0) {
        throw new Error('Invalid action item ID');
      }
      
      await apiClient.updateActionItemStatus(actionItemId, completed);
      
      // Refresh action items
      fetchActionItems(false);
      fetchActionItems(true);
      
      toast.success(`Task marked as ${completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error('Error updating action item:', error);
      toast.error('Failed to update task', {
        description: (error as Error).message,
      });
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    if (!userId) return;
    
    setIsLoadingContacts(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const contactsData = await apiClient.getContacts(id);
      setContacts(contactsData);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts', {
        description: (error as Error).message,
      });
      setContacts([]);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Fetch email statistics
  const fetchEmailStatistics = async () => {
    if (!userId) return;
    
    setIsLoadingStatistics(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      const stats = await apiClient.getEmailStatistics(id);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching email statistics:', error);
      toast.error('Failed to load email statistics', {
        description: (error as Error).message,
      });
      setStatistics(null);
    } finally {
      setIsLoadingStatistics(false);
    }
  };

  // Fetch new emails from Gmail
  const fetchNewEmails = async () => {
    if (!userId) return;
    
    setIsFetching(true);
    
    try {
      // Ensure userId is a number
      const id = Number(userId);
      if (isNaN(id) || id <= 0) {
        throw new Error('Invalid user ID');
      }
      
      await apiClient.fetchNewEmails(id);
      
      toast.success('Processing emails', {
        description: 'Your emails are being processed. Refresh the list in a moment to see them.',
      });
      
      // Wait a bit before refreshing
      setTimeout(() => {
        // Refresh all data
        fetchEmails();
        fetchImportantEmails();
        fetchFollowupEmails();
        fetchStarredEmails();
        fetchActionItems(false);
        fetchActionItems(true);
        fetchContacts();
        fetchEmailStatistics();
      }, 3000);
      
    } catch (error) {
      console.error('Error fetching new emails:', error);
      toast.error('Failed to fetch new emails', {
        description: (error as Error).message,
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Select an email to view
  const selectEmail = (emailId: number) => {
    setSelectedEmailId(emailId);
  };

  // Clear selected email
  const clearSelectedEmail = () => {
    setSelectedEmailId(null);
    setSelectedEmail(null);
  };

  return {
    // Email lists
    emails,
    importantEmails,
    followupEmails,
    starredEmails,
    emailsByCategory,
    categoriesList,
    emailsBySentiment,
    
    // Selected email
    selectedEmail,
    
    // Action items and contacts
    actionItems,
    completedActionItems,
    contacts,
    
    // Statistics
    statistics,
    
    // Loading states
    isLoadingEmails,
    isLoadingImportantEmails,
    isLoadingFollowupEmails,
    isLoadingStarredEmails,
    isLoadingEmail,
    isLoadingActionItems,
    isLoadingContacts,
    isLoadingStatistics,
    isFetching,
    
    // Functions
    fetchEmails,
    fetchImportantEmails,
    fetchFollowupEmails,
    fetchStarredEmails,
    fetchEmailsByCategory,
    fetchEmailsBySentiment,
    fetchNewEmails,
    fetchActionItems,
    fetchContacts,
    fetchEmailStatistics,
    updateActionItemStatus,
    selectEmail,
    clearSelectedEmail
  };
} 