"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const userId = searchParams.get("user_id");
    
    if (userId) {
      // Store the user ID in localStorage
      localStorage.setItem("userId", userId);
      
      // Send a message to the parent window if this is in a popup
      if (window.opener) {
        window.opener.postMessage(
          { 
            type: "auth_callback", 
            user_id: parseInt(userId, 10) 
          }, 
          window.location.origin
        );
        // Close the popup window
        window.close();
      } else {
        // If not in a popup, redirect to the main page
        router.push("/");
      }
    } else {
      // If no user ID is found, redirect to the main page
      router.push("/");
    }
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-muted-foreground">Completing authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 