import React, { useState } from "react";
import { MailQuestion, Star, Reply, ClipboardList, BarChart, Zap, Shield, Clock, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthButton } from "@/components/auth-button";
import { ModeToggle } from "@/components/mode-toggle";

interface LandingPageProps {
  onLogin: (userId: number) => void;
  apiUrl: string;
}

export function LandingPage({ onLogin, apiUrl }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MailQuestion className="h-6 w-6 text-primary" />
            <span className="font-semibold">Smart Email Parser</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <ModeToggle />
           
            <div className="hidden md:block">
              <AuthButton onAuthSuccess={onLogin} apiUrl={apiUrl} />
            </div>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t p-4 bg-background">
            <nav className="container max-w-7xl mx-auto flex flex-col space-y-4">
              <a 
                href="#features" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="#testimonials" 
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <div className="pt-2">
                <AuthButton onAuthSuccess={onLogin} apiUrl={apiUrl} />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="w-full pt-24 md:pt-32 lg:pt-40 pb-12 md:pb-24 lg:pb-32 flex flex-col items-center justify-center text-center">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="bg-primary/10 p-3 rounded-full">
                <MailQuestion className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
              Smart Email Analysis
            </h1>
            <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
              Organize your inbox intelligently. Extract insights, action items, and important information automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <AuthButton onAuthSuccess={onLogin} apiUrl={apiUrl} />
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section id="features" className="w-full py-12 md:py-24 bg-secondary/10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Powerful Email Management</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our AI-powered email parser analyzes your messages and helps you stay organized
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <div className="mb-2">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Priority Inbox</CardTitle>
                <CardDescription>
                  Smart filtering highlights your most important emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                Never miss critical communications with AI-powered importance detection
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Action Items</CardTitle>
                <CardDescription>
                  Automatically extract tasks and to-dos from your emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                Turn your inbox into a productivity tool with automatic task identification
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2">
                  <Reply className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Follow-up Tracking</CardTitle>
                <CardDescription>
                  Never forget to respond to important messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                Smart detection of emails requiring your response with gentle reminders
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Email Analytics</CardTitle>
                <CardDescription>
                  Understand your email patterns and communication habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                Gain insights into your email usage to improve productivity
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* How It Works */}
      <section id="how-it-works" className="w-full py-12 md:py-24">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Simple setup, powerful results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">1. Secure Sign In</h3>
              <p className="text-muted-foreground mt-2">
                Sign in with your Google account. We only request read-access to your emails.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">2. AI Analysis</h3>
              <p className="text-muted-foreground mt-2">
                Our AI analyzes your emails to extract important information, action items, and contacts.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">3. Save Time</h3>
              <p className="text-muted-foreground mt-2">
                Spend less time organizing your inbox and more time on what matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Testimonials */}
      <section id="testimonials" className="w-full py-12 md:py-24 bg-secondary/10">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">What Users Say</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their email workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <p className="italic">
                  &quot;This tool has cut my email processing time in half. The action item extraction is particularly helpful for managing my team&apos;s tasks.&quot;
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <div className="font-semibold">Sarah K.</div>
                <div className="text-sm text-muted-foreground">Product Manager</div>
              </CardFooter>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="italic">
                  &quot;I used to miss important client emails. Now the priority inbox ensures I see critical messages first. Game changer!&quot;
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <div className="font-semibold">Michael T.</div>
                <div className="text-sm text-muted-foreground">Freelance Designer</div>
              </CardFooter>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="italic">
                  &quot;As someone who receives hundreds of emails daily, this tool has brought sanity back to my inbox. The follow-up reminders are invaluable.&quot;
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <div className="font-semibold">Jamie W.</div>
                <div className="text-sm text-muted-foreground">Marketing Director</div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Ready to transform your email experience?</h2>
            <p className="text-muted-foreground">
              Start analyzing your emails with our powerful AI tools today.
            </p>
            <AuthButton onAuthSuccess={onLogin} apiUrl={apiUrl} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-secondary/20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <MailQuestion className="h-6 w-6 mr-2 text-primary" />
              <span className="font-semibold">Smart Email Parser</span>
            </div>
            <div className="flex gap-4">
              <a href="/privacy" className="text-sm hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Smart Email Parser. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 