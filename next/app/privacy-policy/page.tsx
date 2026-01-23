import { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for the Society of Software Engineers website",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h1>Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 23, 2026</p>

            <p>
              The Society of Software Engineers (SSE) at Rochester Institute of Technology 
              operates the sse.rit.edu website. This page informs you of our policies 
              regarding the collection, use, and disclosure of personal information when 
              you use our website.
            </p>

            <h2>Information We Collect</h2>
            
            <h3>Google Account Information</h3>
            <p>
              When you sign in using your RIT Google account (@g.rit.edu), we collect:
            </p>
            <ul>
              <li><strong>Email address</strong> - Your RIT email address for identification and communication</li>
              <li><strong>Name</strong> - Your display name from your Google account</li>
              <li><strong>Profile picture</strong> - Your Google profile image (optional)</li>
            </ul>

            <h3>Gmail Send Permission</h3>
            <p>
              For officers and administrators, we request permission to send emails on your behalf 
              using the Gmail API. This permission is used <strong>only</strong> for:
            </p>
            <ul>
              <li>Sending officer invitation notifications to new officers</li>
              <li>Sending membership invitation notifications to new members</li>
              <li>Sending purchase request notifications to the treasurer</li>
              <li>Other official SSE organizational communications</li>
            </ul>
            <p>
              <strong>We never:</strong>
            </p>
            <ul>
              <li>Read your emails</li>
              <li>Access your email history</li>
              <li>Send emails without your knowledge (all emails are triggered by actions you take)</li>
              <li>Share your email credentials with third parties</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li><strong>Authentication</strong> - To verify your identity and restrict access to RIT students</li>
              <li><strong>Member Management</strong> - To track SSE membership and officer positions</li>
              <li><strong>Communication</strong> - To send official SSE notifications (invitations, announcements)</li>
              <li><strong>Event Management</strong> - To manage event attendance and participation</li>
              <li><strong>Mentoring</strong> - To connect mentors with students seeking help</li>
            </ul>

            <h2>Data Storage and Security</h2>
            <p>
              Your information is stored securely in our database hosted on RIT infrastructure. 
              We implement appropriate security measures to protect against unauthorized access, 
              alteration, disclosure, or destruction of your personal information.
            </p>
            <ul>
              <li>All data transmission is encrypted using HTTPS/TLS</li>
              <li>OAuth tokens are stored securely and never exposed to client-side code</li>
              <li>Access to the database is restricted to authorized SSE officers</li>
            </ul>

            <h2>Data Retention</h2>
            <p>
              We retain your account information for as long as you are an active member or 
              have an account on our platform. Alumni information may be retained with consent 
              for historical purposes. You can request deletion of your data by contacting us.
            </p>

            <h2>Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul>
              <li><strong>Google OAuth</strong> - For secure authentication</li>
              <li><strong>Gmail API</strong> - For sending official notifications (with your permission)</li>
              <li><strong>Google Calendar API</strong> - For event synchronization (optional)</li>
            </ul>
            <p>
              These services are governed by {" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Google&apos;s Privacy Policy
              </a>.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Revoke Gmail send permissions at any time through your {" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
                  Google Account settings
                </a>
              </li>
            </ul>

            <h2>Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. 
              These cookies are necessary for the website to function and cannot be disabled.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Our website is intended for RIT students and is not directed at children under 13. 
              We do not knowingly collect information from children under 13.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify users of any 
              significant changes by posting a notice on our website.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your rights, 
              please contact us:
            </p>
            <ul>
              <li>Location: GOL-1670, Golisano College of Computing and Information Sciences, RIT</li>
              <li>Website: <a href="https://sse.rit.edu">https://sse.rit.edu</a></li>
            </ul>

            <hr className="my-8" />

            <h2>Google API Services User Data Policy</h2>
            <p>
              Our use of information received from Google APIs adheres to the {" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p>
              Specifically, our application&apos;s use of data obtained via the Gmail API is limited to 
              sending emails on behalf of authenticated users for official SSE organizational purposes only. 
              We do not use this data for any other purpose, including advertising or data mining.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
