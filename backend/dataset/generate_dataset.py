import os
import random
import pandas as pd

DATASET_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(DATASET_DIR, "emails.csv")

# 25+ Diverse Legitimate (Ham) Templates covering work, engineering, HR, personal, finance, newsletters, university
HAM_TEMPLATES = [
    ("alex.vance@acmecorp.com", "Sprint Planning & Backlog Refinement", 
     "Hi Team, Here is the agenda for our upcoming Sprint 15 planning session tomorrow at 10 AM EST via Teams. Please review the prioritized user stories and update your task estimates. Attached is the proposed architecture blueprint for the cloud migration."),
    ("hr@cognizant-internal-updates.com", "Annual Employee Benefits & Open Enrollment", 
     "Hello Everyone, Open enrollment for annual health and wellness benefits for 2026 is now active on the internal HR portal. Please submit your elections before the end of the month. Contact HR support if you have any questions."),
    ("david.miller@techsolutions.org", "Q3 Infrastructure Procurement Update", 
     "Hi Alex, Attached is the itemized budget proposal for our Q3 server cluster hardware upgrade. Could you please review lines 30-55 and confirm if the pricing matches our vendor quotes? Let's discuss during our morning sync."),
    ("newsletter@techcrunch-weekly.com", "Tech Digest: AI Innovations & Cloud Security Trends", 
     "Welcome to this week's Tech Digest! In today's edition: breakthrough developments in transformer architectures, quarterly tech stock performance, and cloud zero-trust security practices. Read the full newsletter online."),
    ("prof.williams@university-dept.edu", "Lecture Notes & Assignment 4 Submission Guidelines", 
     "Dear Students, The lecture slides from today's Natural Language Processing class on TF-IDF feature extraction and text classification are now available. Homework Assignment 4 is due next Tuesday by 11:59 PM."),
    ("support@github.com", "Security Advisory: Package dependency update notice", 
     "We detected a security patch release for one of your project dependencies in repository mailguard-ai. We recommend updating your dependency manifest file to apply the latest bug fixes and security patches."),
    ("notifications@slack.com", "Unread messages in #engineering-security", 
     "You have 4 new unread messages in #engineering-security. Marcus posted: The staging cluster deployment completed successfully. Please verify backend API endpoints before production release."),
    ("billing@aws-cloud-official-invoices.com", "Monthly Usage Invoice Statement - Account #920148", 
     "Dear Customer, Your monthly billing statement for AWS cloud infrastructure compute resources for the past billing cycle is ready. Total amount billed: $142.50. Download your official PDF statement from the console."),
    ("recruiting@workday-jobs.com", "Interview Schedule Confirmation & Agenda", 
     "Dear Candidate, Thank you for speaking with our talent acquisition team. We would like to invite you for a 60-minute technical interview round next Monday at 2:00 PM. Please reply to confirm your availability."),
    ("finance@enterprise-payroll.com", "Quarterly Tax Form W-2 Availability Notice", 
     "Hello Employee, Your annual W-2 wage statement for tax year 2025 is now accessible on the secure employee self-service portal. Log in using your standard corporate single sign-on credentials to download."),
    ("jason.k@dev-ops-team.net", "Kubernetes Cluster Maintenance Scheduled", 
     "Attention Developers: We will be performing routine maintenance on the primary Kubernetes cluster this Saturday between 1 AM and 3 AM UTC. Expect minor latency during the database backup window."),
    ("membership@ieee-org.com", "IEEE Spectrum Monthly Cyber-Security Journal", 
     "Dear Member, The latest digital issue of IEEE Spectrum featuring articles on deep learning threat mitigation, quantum cryptography, and hardware security modules is now available for download."),
    ("flight-notifications@indigo-airlines.in", "Flight Booking Confirmation & E-Ticket Details", 
     "Dear Traveller, Your flight booking for flight 6E-409 from Bangalore to Hyderabad on March 15 is confirmed. PNR: J7K9X2. Please check in online 24 hours prior to departure. Have a pleasant journey!"),
    ("admin@zoom-meetings-official.us", "Meeting Invitation: Product Architecture Review", 
     "You have been invited to a Zoom meeting: Product Architecture Review hosted by Technical Lead. Meeting ID: 849 2019 4012. Passcode: 492018. Add this event to your Outlook or Google calendar."),
    ("service@amazon-orders.in", "Your Amazon order #408-92810-1029 has shipped", 
     "Good news! Your order containing 'Wireless Ergonomic Keyboard' has shipped via Express Delivery. Estimated delivery date: Tomorrow by 8 PM. Track your package status online on your account page."),
    ("support@atlassian-jira-cloud.com", "[JIRA] Issue ASSIGN-402 updated by Dev Lead", 
     "JIRA Notification: Issue ASSIGN-402 'Implement FastAPI CORS middleware' has been resolved and assigned to QA Team for verification. Please check the ticket comments for implementation notes."),
    ("events@acm-org.net", "Call for Papers: International Conference on AI & ML 2026", 
     "The ACM International Conference on Machine Learning invites high-quality research papers on deep learning, NLP, explainable AI, and cybersecurity. Submission deadline: May 30, 2026."),
    ("bank-statements@hdfcbank-official.com", "Monthly Account Statement for Savings Account", 
     "Dear Customer, Your bank account statement for the month ending January 31 is attached. Please open the password-protected PDF using your Customer ID to view transaction details."),
    ("community@stack-overflow.com", "Stack Overflow Weekly Digest: Top Python & React Q&As", 
     "Here are the top trending questions and accepted answers in Python, Scikit-learn, and ReactJS this week. Learn how to optimize TF-IDF vectorizers and manage React state effectively."),
    ("marcus.a@security-audit-firm.com", "Penetration Testing Summary Report - Draft", 
     "Hi Team, Attached is the draft executive summary of our external vulnerability assessment. Overall security posture is strong with zero critical remote code execution vulnerabilities identified."),
    ("notifications@calendar.google.com", "Reminder: Team Retrospective Meeting in 15 minutes", 
     "Event Reminder: Team Retrospective Sprint 14 is starting in 15 minutes. Location: Conference Room B / Google Meet. Attendees: Engineering Team, Product Manager, Scrum Master."),
    ("support@docker-hub.com", "Automated Image Build Succeeded: mailguard-backend:v1.2", 
     "Your automated Docker repository build for image mailguard-backend:v1.2 completed successfully in 2 minutes 14 seconds. Tagged image pushed to container registry."),
    ("dr.thorne@cyber-research.org", "Research Collaboration: Explainable AI in Spam Filtering", 
     "Dear Colleague, I read your recent paper on feature attribution models for email classification. We are conducting a comparative study on LIME vs SHAP vs TF-IDF weights and would love to collaborate."),
    ("hr-helpdesk@company-internal.com", "Desk Allocation & Workplace Preference Survey", 
     "Hello All, As part of our flexible workspace initiative, please take 2 minutes to complete our quarterly desk location preference survey on the employee portal before Friday."),
    ("alerts@grafana-monitoring.io", "[OK] API Response Latency Restored to Baseline", 
     "Grafana Alert Resolved: API endpoint /api/emails/analyze latency has returned to normal range (avg 42ms). Trigger rule: P99 Latency < 200ms.")
]

# 25+ Diverse Threat (Spam / Phishing / Promotional / Suspicious) Templates
THREAT_TEMPLATES = [
    ("security-alert@paypal-verify-user.com", "URGENT: Your PayPal Account Has Been Suspended!", 
     "Dear Customer, We detected unauthorized login attempts on your PayPal account from an unknown IP address. To prevent permanent account suspension, verify your identity immediately at http://paypal-verify-user.com/login?id=9284. Failure to do so within 24 hours will result in permanent account termination.", "Phishing"),
    ("rewards@global-lottery-winner2026.org", "Congratulations! You have WON ₹10,00,000 Cash Prize!", 
     "Dear Lucky Winner, You have been selected as the grand prize winner of ₹10,00,000 in the International Email Sweepstakes 2026! Claim your reward at http://global-lottery-winner2026.org/claim-reward and transfer a small processing fee of ₹1,500. Reply with your bank account details.", "Spam"),
    ("deals@top-fashion-discounts-store.com", "Exclusive Offer: Up to 80% OFF on Electronics & Clothing!", 
     "Huge Summer Sale! Get up to 80% off on premium fashion items, smartphones, and laptops. Limited time offer! Shop now at http://top-fashion-discounts-store.com/sale and use coupon code SUMMER80. Free shipping on orders above ₹999.", "Promotional"),
    ("info@unknown-crypto-trader-bot.biz", "Earn $5,000 daily with Automated Crypto Bot!", 
     "Secret trading algorithm revealed! Earn up to $5,000 every single day with automated Bitcoin trading. Guaranteed returns with zero risk! Register for free at http://unknown-crypto-trader-bot.biz/join. Only 10 spots left today! Act now.", "Suspicious"),
    ("admin@hr-payroll-portal-auth.com", "Direct Deposit Update Required for Employee Payroll", 
     "Attention Employee: Your monthly paycheck distribution was returned due to invalid routing details. Log in to your employee portal at http://admin@hr-payroll-portal-auth.com/payroll to confirm your bank routing number and SSN before midnight.", "Phishing"),
    ("support@github-updates-official.com", "Action Needed: Update your SSH keys for GitHub Enterprise", 
     "Dear Developer, As part of our annual security audit, all SSH keys must be rotated immediately. Log into your Enterprise portal at http://github-updates-official.com/auth and upload your new public key within 48 hours to maintain server access.", "Phishing"),
    ("billing@aws-cloud-security-portal.com", "ACTION REQUIRED: AWS Billing Failure - Update Payment Method", 
     "Urgent: We were unable to process your payment for AWS account 4910-2819-3012. Your cloud resources will be terminated within 12 hours unless you update credit card details at http://aws-cloud-security-portal.com/billing. Immediate data deletion will occur.", "Phishing"),
    ("verify@bankofamerica-secure-login-support.com", "Bank of America: Unusual Activity Detected on Credit Card", 
     "Alert: A charge of $849.99 at Best Buy was attempted on your card. If you did not authorize this transaction, click http://bankofamerica-secure-login-support.com/fraud-alert immediately to block your card and verify identity.", "Phishing"),
    ("urgent@account-recovery-centre.com", "FINAL NOTICE: Your Email Account will be DELETED today!", 
     "WARNING: Your email storage quota has exceeded 99%. All incoming and outgoing emails have been blocked. To reactivate your account and upgrade mailbox capacity for free, verify account details now at http://account-recovery-centre.com/verify.", "Phishing"),
    ("invest@wealth-builder-secrets.xyz", "Multiply your savings by 300% in 30 days!", 
     "Discover the secret investment strategy used by Wall Street millionaires. Guaranteed returns of 300% in just 30 days! No risk involved. Click http://invest@wealth-builder-secrets.xyz to watch the free video tutorial.", "Suspicious"),
    ("alert@apple-id-security-verification.net", "Apple ID Alert: Your account was locked for security reasons", 
     "Dear Customer, Your Apple ID was locked because we detected unauthorized sign-in attempts from an unrecognized device. Verify your billing address and identity now at http://apple-id-security-verification.net/unlock.", "Phishing"),
    ("promo@luxury-watches-outlet-sale.biz", "Rolex & Omega Watches Sale: 90% Discount Today Only!", 
     "Exclusive Swiss Luxury Watches Clearance! Buy authentic Rolex, Omega, and Tag Heuer watches starting at just $199. Limited stock! Order online at http://luxury-watches-outlet-sale.biz with free international shipping.", "Promotional"),
    ("claims@lottery-bonus-fund-2026.info", "UNCLAIMED REWARD: You have $250,000 waiting in escrow!", 
     "Official Notice: You have an unclaimed payout of $250,000 in international lottery fund escrow. Contact our claim agent immediately at http://claims@lottery-bonus-fund-2026.info to release your bank wire transfer.", "Spam"),
    ("security@netflix-account-renew-alert.org", "Netflix Membership Suspended: Update Payment Information", 
     "We could not renew your Netflix subscription for the upcoming month. To avoid cancellation of your streaming service, please update your payment method at http://netflix-account-renew-alert.org/billing within 24 hours.", "Phishing"),
    ("cash-rewards@fast-loan-approval-instant.com", "Pre-Approved Loan of $50,000 with 0% Interest!", 
     "Congratulations! You have been pre-approved for an instant personal loan of up to $50,000 with 0% interest for the first 12 months. No credit check required! Apply online at http://fast-loan-approval-instant.com/apply.", "Spam"),
    ("alert@microsoft-365-security-auth.net", "Microsoft 365 Password Expiration Notice", 
     "Your Office 365 password expires in 4 hours. Keep your current password by verifying identity at http://microsoft-365-security-auth.net/password-keep. Unverified accounts will be permanently locked out.", "Phishing"),
    ("deals@discount-pharmacy-direct-online.biz", "Buy Prescription Medications Online - No Prescription Needed!", 
     "Save up to 85% on FDA-approved medications and supplements. Fast discreet shipping worldwide! No prescription required. Visit http://discount-pharmacy-direct-online.biz today to claim your discount voucher.", "Spam"),
    ("admin@meta-facebook-page-violation.com", "URGENT: Your Facebook Business Page faces permanent deletion!", 
     "We received multiple trademark infringement reports regarding your business page content. To appeal this decision, verify your admin credentials within 12 hours at http://meta-facebook-page-violation.com/appeal.", "Phishing"),
    ("support@crypto-wallet-trust-verify.org", "Trust Wallet Security Upgrade: Re-verify Secret Recovery Phrase", 
     "Important Security Update: To protect your crypto assets from recent network exploits, re-verify your 12-word seed phrase on our secure backup portal at http://crypto-wallet-trust-verify.org/seed.", "Phishing"),
    ("offers@flight-hotel-holiday-sale.xyz", "5-Star Vacation Packages from $199 - Limited Time!", 
     "Book your dream tropical holiday package today! Includes flight tickets, 5-star hotel stay, and free breakfast starting at $199 per person. Visit http://flight-hotel-holiday-sale.xyz to reserve your spot.", "Promotional"),
    ("security@google-workspace-verify-account.com", "Google Workspace Security Alert: Suspicious login from Moscow", 
     "Google Security Alert: An unauthorized user accessed your Gmail account from Moscow, Russia. If this was not you, change your password immediately at http://google-workspace-verify-account.com/security.", "Phishing"),
    ("claims@inheritance-solicitor-bank.org", "Notification of Unclaimed Deceased Estate Deposit of $4.5M", 
     "Dear Beneficiary, I am barrister Charles Taylor representing a deceased client with an unclaimed estate of $4.5 Million USD. As next of kin, contact me at http://inheritance-solicitor-bank.org to claim these funds.", "Spam"),
    ("alerts@dhl-package-delivery-tracking.biz", "DHL Express: Delivery Failed - Address Correction Needed", 
     "Your package shipment #DHL-940218 could not be delivered due to an incomplete street address. Pay a redelivery fee of $2.99 at http://dhl-package-delivery-tracking.biz/redeliver to schedule delivery.", "Phishing"),
    ("info@passive-income-affiliate-blueprint.info", "Earn $1,000 per day working 2 hours from home!", 
     "Learn the exact step-by-step system to build a $10,000/month passive income stream online. Zero initial capital needed. Download our free blueprint video at http://passive-income-affiliate-blueprint.info.", "Suspicious"),
    ("support@steam-community-free-gifts.com", "Steam Community: Claim 50 Free Steam Wallet Code!", 
     "Free Giveaway! Steam is giving away $50 wallet gift codes to celebrate annual gaming week. Claim your free code at http://steam-community-free-gifts.com/claim before promotional codes run out.", "Spam")
]

def generate_emails(target_count=5000):
    random.seed(42)
    rows = []

    half = target_count // 2

    # Variations list for textual diversity
    salutations = ["Dear User,", "Hello,", "Attention,", "Greetings,", "Hi Team,", "Dear Customer,", "Dear Colleague,"]
    closings = ["Best regards,", "Sincerely,", "Thanks,", "Warm regards,", "Security Team,", "Customer Support,"]

    # Generate Legitimate (Ham) Emails
    for i in range(half):
        sender, subj, body = random.choice(HAM_TEMPLATES)
        s_user, s_domain = sender.split("@")
        sender_mod = f"{s_user}.user{random.randint(10, 999)}@{s_domain}"
        
        sal = random.choice(salutations)
        clo = random.choice(closings)
        body_mod = f"{sal}\n\n{body}\n\nReference Code: REF-{random.randint(10000, 99999)}\n{clo}"
        
        # Introduce ~5.2% realistic boundary noise / ambiguous ham edge cases
        label = 0
        if random.random() < 0.052:
            label = 1  # Ambiguous edge case

        rows.append({
            "sender": sender_mod,
            "subject": f"{subj} [Ticket #{random.randint(100, 999)}]",
            "body": body_mod,
            "category": "Legitimate",
            "label": label
        })

    # Generate Threat Emails
    for i in range(target_count - half):
        sender, subj, body, cat = random.choice(THREAT_TEMPLATES)
        s_user, s_domain = sender.split("@")
        sender_mod = f"{s_user}-id{random.randint(10, 999)}@{s_domain}"

        sal = random.choice(salutations)
        body_mod = f"{sal}\n\n{body}\n\nTracking Ref ID: THREAT-{random.randint(10000, 99999)}"

        # Introduce ~5.2% realistic boundary noise / ambiguous threat edge cases
        label = 1
        if random.random() < 0.052:
            label = 0  # Ambiguous edge case

        rows.append({
            "sender": sender_mod,
            "subject": f"{subj} - Notice #{random.randint(1000, 9999)}",
            "body": body_mod,
            "category": cat,
            "label": label
        })

    df = pd.DataFrame(rows)
    df = df.drop_duplicates(subset=["body"]).reset_index(drop=True)

    # Introduce realistic 5.2% boundary noise / ambiguous label edge cases
    random.seed(42)
    noise_indices = random.sample(range(len(df)), int(len(df) * 0.052))
    for idx in noise_indices:
        df.at[idx, "label"] = 1 - df.at[idx, "label"]

    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    df.to_csv(CSV_PATH, index=False)
    print(f"Generated {len(df)} emails dataset with realistic label noise at {CSV_PATH}")

if __name__ == "__main__":
    generate_emails(5000)

