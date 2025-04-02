import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground">
            At Smart Email Parser, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc ml-6 mt-2 text-muted-foreground">
            <li>Email content that you choose to process</li>
            <li>Account information (name, email address)</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use the information we collect to:
          </p>
          <ul className="list-disc ml-6 mt-2 text-muted-foreground">
            <li>Provide and maintain our service</li>
            <li>Process and analyze your emails</li>
            <li>Improve our service and user experience</li>
            <li>Communicate with you about updates and support</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-muted-foreground mt-2">
            Email: privacy@geeth.app
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Updates to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last Updated&rdquo; date.
          </p>
        </section>

        <div className="mt-8 text-sm text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
} 