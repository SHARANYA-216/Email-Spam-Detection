// MailGuard AI - Centralized Demo Data Service
// Provides realistic samples without hardcoding in UI components

const DEMO_EMAILS = {
  safe: {
    id: "sample-safe-1",
    label: "Safe Email",
    category: "Legitimate",
    sender: "sarah.jenkins@acmecorp.com",
    subject: "Sprint Planning & Q3 Product Roadmap Alignment Meeting",
    body: `Hi Prashanthi,

Please find the agenda for tomorrow's Sprint Planning session at 10:00 AM UTC.

1. Review user stories for Sprint 42 release.
2. Discuss the caching layer PR #412 performance benchmarks.
3. Align on database index optimization for high-throughput email telemetry.

Please update your Jira board and feel free to add discussion topics in advance.

Best Regards,
Sarah Jenkins
Principal Engineering Lead | Acme Cloud Corp`
  },
  
  phishing: {
    id: "sample-phishing-1",
    label: "Phishing Email",
    category: "Phishing",
    sender: "security-noreply@microsoft-services-auth.com",
    subject: "URGENT: Your Office 365 Account is Scheduled for Immediate Deletion",
    body: `Dear Valued Employee,

Your Office 365 enterprise subscription has expired and your primary mailbox is queued for immediate deletion within 24 hours.

To prevent permanent loss of your Outlook emails, OneDrive documents, and SharePoint directories, you are required to verify your password and credentials immediately at:
http://185.220.101.5/auth/recover-login?user=account_verify

Failure to verify within the deadline will result in permanent corporate account deactivation.

IT Security Operations & Identity Management
Reference Code: SEC-89410-CRITICAL`
  },

  spam: {
    id: "sample-spam-1",
    label: "Spam Email",
    category: "Suspicious",
    sender: "claims-office@international-lottery-commission.cc",
    subject: "CONGRATULATIONS!! YOU HAVE WON $1,500,000 IN THE INTERNATIONAL LOTTERY",
    body: `DEAR BENEFICIARY,

YOUR EMAIL ADDRESS HAS BEEN SELECTED AS THE 1ST PRIZE WINNER OF $1,500,000.00 USD IN THE 2026 INTERNATIONAL LOTTERY DRAWING!

TO CLAIM YOUR CASH PRIZE IMMEDIATELY, SEND YOUR FULL NAME, MAILING ADDRESS, AND PASSPORT COPY TO CLAIMS-OFFICE@LOTTERY-PAYOUTS.CC.

DO NOT DELAY! UNCLAIMED FUNDS WILL BE TRANSFERRED TO GOVERNMENT TREASURY AFTER 72 HOURS.

CLAIMS COMMISSIONER
BATCH REF: #LOTTO-99281-WIN`
  },

  promotional: {
    id: "sample-promo-1",
    label: "Promotional Email",
    category: "Promotional",
    sender: "offers@cloudtech-academy-promotions.com",
    subject: "Exclusive 70% Off: Master Generative AI & Cloud Architecture Bundle!",
    body: `Hello Developer,

Unlock lifetime access to 50+ hands-on DevOps, Kubernetes, Python, and Generative AI courses for only $19.99!

Limited time flash sale ends tonight at midnight!

Claim your discount voucher here:
https://cloudtech-academy-promotions.com/deals/summer-sale

Use promo code SAVE70 at checkout.

Click unsubscribe if you no longer wish to receive special discount offers.`
  }
};

window.DEMO_EMAILS = DEMO_EMAILS;
