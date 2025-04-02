import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/google-logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuthButtonProps {
  onAuthSuccess: (userId: number) => void;
  apiUrl: string;
}

export function AuthButton({ onAuthSuccess, apiUrl }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  // Clean up the auth window and event listener when component unmounts
  useEffect(() => {
    return () => {
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
    };
  }, [authWindow]);

  const handleMessage = (event: MessageEvent) => {
    // Only process messages from our origin
    if (event.origin !== window.location.origin) return;
    
    // Check if the message contains a user_id
    if (event.data && event.data.type === "auth_callback" && event.data.user_id) {
      // Clean up the window
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
      
      // Clean up the event listener
      window.removeEventListener("message", handleMessage);
      
      // Call the onAuthSuccess callback with the user ID
      onAuthSuccess(event.data.user_id);
      
      // Show success toast
      toast.success("Successfully authenticated", {
        description: "You can now fetch and analyze your emails.",
      });
      
      // End loading state
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Remove any existing event listeners
      window.removeEventListener("message", handleMessage);
      
      // Add new event listener
      window.addEventListener("message", handleMessage, false);
      
      // Get the auth URL from the backend
      const response = await fetch(`${apiUrl}/auth/login`);
      const data = await response.json();
      
      if (!data.auth_url) {
        throw new Error("Failed to get authentication URL");
      }

      // Close any existing auth window
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }

      // Open a popup window for authentication
      const newAuthWindow = window.open(
        data.auth_url,
        "Google Authorization",
        "width=600,height=800"
      );
      
      if (!newAuthWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }
      
      setAuthWindow(newAuthWindow);
      
      // Set a timeout to check if authentication is taking too long
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          
          if (newAuthWindow && !newAuthWindow.closed) {
            newAuthWindow.close();
          }
          
          toast.error("Authentication timed out", {
            description: "Please try again.",
          });
        }
      }, 120000); // 2 minutes timeout
      
      // Check if popup was closed manually
      const checkPopupClosed = setInterval(() => {
        if (newAuthWindow && newAuthWindow.closed) {
          clearInterval(checkPopupClosed);
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }, 1000);

    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Authentication failed", {
        description: (error as Error).message || "Could not authenticate with Google. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={isLoading} 
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleLogo className="mr-2 h-4 w-4" />
      )}
      Sign in with Google
    </Button>
  );
} 