import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface TermsPrivacyModalProps {
  open: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const TERMS_OF_SERVICE = `
MUVO Terms of Service
Last Updated: December 2024

1. ACCEPTANCE OF TERMS
By accessing or using MUVO ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.

2. DESCRIPTION OF SERVICE
MUVO is a community-driven travel application designed for RV users, van lifers, and travelers. The App allows users to discover, review, and share information about places to stay, including campgrounds, boondocking spots, and other accommodations.

3. USER ACCOUNTS
3.1 You must be at least 18 years old to create an account.
3.2 You are responsible for maintaining the confidentiality of your account credentials.
3.3 You agree to provide accurate, current, and complete information during registration.
3.4 You are responsible for all activities that occur under your account.

4. USER CONTENT
4.1 You retain ownership of content you submit ("User Content").
4.2 By submitting User Content, you grant MUVO a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the App.
4.3 You agree not to submit content that is:
   - False, misleading, or inaccurate
   - Defamatory, obscene, or offensive
   - Infringing on intellectual property rights
   - Promoting illegal activities
   - Spam or commercial solicitation

5. COMMUNITY GUIDELINES
5.1 Treat other users with respect.
5.2 Provide honest and accurate reviews.
5.3 Do not harass, threaten, or abuse other users.
5.4 Report inappropriate content or behavior.

6. PROHIBITED ACTIVITIES
You agree not to:
6.1 Use the App for any unlawful purpose.
6.2 Attempt to gain unauthorized access to the App or its systems.
6.3 Interfere with or disrupt the App's functionality.
6.4 Create multiple accounts for deceptive purposes.
6.5 Scrape or collect user data without permission.

7. DISCLAIMERS
7.1 The App is provided "as is" without warranties of any kind.
7.2 MUVO does not guarantee the accuracy of User Content or place information.
7.3 Users are responsible for verifying information before relying on it.
7.4 MUVO is not responsible for any damages or losses arising from use of the App.

8. LIMITATION OF LIABILITY
To the fullest extent permitted by law, MUVO shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.

9. INDEMNIFICATION
You agree to indemnify and hold harmless MUVO and its affiliates from any claims, damages, or expenses arising from your use of the App or violation of these Terms.

10. MODIFICATIONS
MUVO reserves the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.

11. TERMINATION
MUVO may terminate or suspend your account at any time for violations of these Terms or for any other reason at our discretion.

12. GOVERNING LAW
These Terms shall be governed by and construed in accordance with the laws of the United States.

13. CONTACT
For questions about these Terms, please contact us through the App.
`;

const PRIVACY_POLICY = `
MUVO Privacy Policy
Last Updated: December 2024

1. INTRODUCTION
MUVO ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.

2. INFORMATION WE COLLECT

2.1 Information You Provide
- Account information: name, email address, username, password
- Profile information: traveler type, home base location
- User content: reviews, photos, place submissions
- Communications: messages you send to us

2.2 Information Collected Automatically
- Device information: device type, operating system, unique device identifiers
- Usage data: features used, pages visited, time spent in the App
- Location data: with your permission, we may collect precise or approximate location

2.3 Information from Third Parties
- If you sign in using a third-party service, we may receive information from that service

3. HOW WE USE YOUR INFORMATION

We use your information to:
- Provide and maintain the App
- Create and manage your account
- Display your public profile and reviews
- Improve and personalize your experience
- Communicate with you about updates and features
- Enforce our Terms of Service
- Detect and prevent fraud or abuse
- Comply with legal obligations

4. SHARING YOUR INFORMATION

4.1 Public Information
Your username, profile information, and User Content (reviews, photos) are publicly visible to other users.

4.2 Service Providers
We may share information with third-party vendors who provide services on our behalf.

4.3 Legal Requirements
We may disclose information if required by law or to protect our rights.

4.4 Business Transfers
In the event of a merger or acquisition, your information may be transferred.

5. DATA RETENTION

We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data.

6. DATA SECURITY

We implement appropriate technical and organizational measures to protect your information. However, no method of transmission over the Internet is 100% secure.

7. YOUR RIGHTS

Depending on your location, you may have rights to:
- Access your personal data
- Correct inaccurate data
- Delete your data
- Restrict or object to processing
- Data portability
- Withdraw consent

To exercise these rights, contact us through the App.

8. CHILDREN'S PRIVACY

The App is not intended for children under 18. We do not knowingly collect information from children.

9. LOCATION DATA

With your permission, we collect location data to:
- Show places near you
- Improve place accuracy
- Enable check-in features

You can disable location services in your device settings.

10. COOKIES AND TRACKING

We may use cookies and similar technologies to:
- Remember your preferences
- Analyze usage patterns
- Improve the App

11. THIRD-PARTY LINKS

The App may contain links to third-party websites. We are not responsible for their privacy practices.

12. CHANGES TO THIS POLICY

We may update this Privacy Policy periodically. We will notify you of material changes through the App.

13. CONTACT US

If you have questions about this Privacy Policy, please contact us through the App.

14. CALIFORNIA RESIDENTS

If you are a California resident, you may have additional rights under the CCPA, including:
- Right to know what personal information is collected
- Right to delete personal information
- Right to opt-out of sale of personal information
- Right to non-discrimination

15. EUROPEAN USERS

If you are in the European Economic Area, we process your data based on:
- Your consent
- Performance of a contract
- Legal obligations
- Legitimate interests
`;

export function TermsPrivacyModal({ open, onClose, type }: TermsPrivacyModalProps) {
  const content = type === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;
  const title = type === 'terms' ? 'Terms of Service' : 'Privacy Policy';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0">
        <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-4 pb-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content.split('\n').map((line, index) => {
              if (!line.trim()) return <br key={index} />;
              
              // Headers (all caps or starts with number followed by .)
              if (/^[A-Z][A-Z\s]+$/.test(line.trim()) || /^\d+\.\s+[A-Z]/.test(line.trim())) {
                return (
                  <h3 key={index} className="font-semibold text-foreground mt-4 mb-2">
                    {line.trim()}
                  </h3>
                );
              }
              
              // Sub-points
              if (/^\d+\.\d+/.test(line.trim()) || /^-\s/.test(line.trim())) {
                return (
                  <p key={index} className="text-muted-foreground text-sm ml-4 mb-1">
                    {line.trim()}
                  </p>
                );
              }
              
              return (
                <p key={index} className="text-muted-foreground text-sm mb-2">
                  {line.trim()}
                </p>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-4 pt-2 border-t border-border">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
