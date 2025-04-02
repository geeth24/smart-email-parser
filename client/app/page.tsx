"use client";

import { Dashboard } from "@/components/dashboard";

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  
  return <Dashboard apiUrl={apiUrl} />;
}
