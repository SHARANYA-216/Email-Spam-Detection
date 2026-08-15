export const DEMO_SAMPLES = [
  {
    id: "safe-sample",
    type: "SAFE",
    label: "Safe Email",
    iconColor: "text-emerald-600",
    buttonClass: "border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 shadow-xs",
    sender: "sarah.jenkins@acmecorp.com",
    subject: "Project Update & Weekly Sprint Sync",
    body: `Hi Team,

Here is the weekly update for our Cloud Security project. Sprint 14 review is scheduled for tomorrow at 2:00 PM EST via Zoom.

Please ensure all pull requests are merged and unit tests pass before the meeting. The updated project roadmap document is attached for your review.

Best regards,
Sarah Jenkins
Lead Cloud Developer | Acme Corp`
  },
  {
    id: "spam-sample",
    type: "SPAM",
    label: "Spam Email",
    iconColor: "text-rose-600",
    buttonClass: "border-rose-200 hover:border-rose-400 bg-rose-50 hover:bg-rose-100/70 text-rose-800 shadow-xs",
    sender: "rewards@global-lottery-winner2026.org",
    subject: "Congratulations! You have WON ₹10,00,000 Cash Prize!",
    body: `Dear Lucky Winner,

Congratulations! You have been selected as the grand prize winner of ₹10,00,000 in the International Email Sweepstakes 2026!

To claim your reward, click here immediately: http://global-lottery-winner2026.org/claim-reward and transfer a small processing fee of ₹1,500.

Reply immediately with your full bank account number and bank IFSC code before midnight to secure your prize money.`
  },
  {
    id: "phishing-sample",
    type: "PHISHING",
    label: "Phishing Email",
    iconColor: "text-purple-600",
    buttonClass: "border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100/70 text-purple-800 shadow-xs",
    sender: "security-alert@paypal-verify-user.com",
    subject: "URGENT: Your PayPal Account Has Been Suspended!",
    body: `Dear Customer,

We detected unauthorized login attempts on your PayPal account from an unknown IP address in Moscow, Russia.

To prevent permanent suspension, you must verify your identity immediately by clicking the secure link below:
http://paypal-verify-user.com/login?id=9284

Failure to do so within 24 hours will result in permanent account termination and forfeiture of remaining funds.`
  },
  {
    id: "promotional-sample",
    type: "PROMOTIONAL",
    label: "Promotional Email",
    iconColor: "text-amber-600",
    buttonClass: "border-amber-200 hover:border-amber-400 bg-amber-50 hover:bg-amber-100/70 text-amber-800 shadow-xs",
    sender: "deals@top-fashion-discounts-store.com",
    subject: "Exclusive Offer: Up to 80% OFF on Electronics & Clothing!",
    body: `Huge Summer Sale!

Get up to 80% off on all premium fashion items, smartphones, and laptops. Limited time offer!

Shop now at http://top-fashion-discounts-store.com/sale and use coupon code SUMMER80 at checkout.

Free shipping on all orders above ₹999. Unsubscribe anytime.`
  }
];
