import type { Ticket } from "@/types/ticket";

export const seedTickets: Ticket[] = [
  // --- RULE 1: STANDARD 14-DAY ---
  {
    id: "TKT-1050",
    title: "Forgot to cancel",
    customerEmail: "alice.standard@example.com",
    priority: "medium",
    status: "pending",
    createdAt: "10 min ago",
    message:
      "Hi, I signed up a few days ago but my team decided to go with another tool. Can I get a full refund?", // EXPECT: approve_refund
  },
  {
    id: "TKT-1049",
    title: "Annual plan refund",
    customerEmail: "bob.standard.annual@example.com",
    priority: "high",
    status: "pending",
    createdAt: "20 min ago",
    message:
      "We bought the Team Annual plan 3 days ago but the compliance team rejected the software. Need a full refund to my card immediately.", // EXPECT: approve_refund
  },
  {
    id: "TKT-1048",
    title: "Monthly refund request",
    customerEmail: "charlie.late@example.com",
    priority: "low",
    status: "pending",
    createdAt: "1 hr ago",
    message:
      "I haven't used this much this month, can I get my money back for the last invoice?", // EXPECT: deny_refund (past 14 days on monthly)
  },

  // --- RULE 2: PRORATED ANNUAL ---
  {
    id: "TKT-1047",
    title: "Downsizing - partial refund?",
    customerEmail: "david.prorate@example.com",
    priority: "medium",
    status: "pending",
    createdAt: "2 hrs ago",
    message:
      "We paid for a year upfront in January, but we are shutting down the project. I know it's past 14 days, but can we get the rest of the year prorated?", // EXPECT: approve_refund (partial calculation)
  },

  // --- RULE 3: HIGH USAGE EXCLUSION ---
  {
    id: "TKT-1046",
    title: "App is too slow, refund me",
    customerEmail: "eve.highuse@example.com",
    priority: "high",
    status: "pending",
    createdAt: "3 hrs ago",
    message:
      "I signed up 2 days ago and ran a bunch of massive data pipelines. Your servers are too slow. I want my $29 back.", // EXPECT: deny_refund (85% usage > 40% rule)
  },
  {
    id: "TKT-1045",
    title: "Switching providers",
    customerEmail: "frank.highuse.annual@example.com",
    priority: "medium",
    status: "pending",
    createdAt: "4 hrs ago",
    message:
      "We are moving away from DevForge. We paid for the year but we want a prorated refund for the remaining months.", // EXPECT: deny_refund (65% usage > 40% rule overrides proration)
  },

  // --- RULE 4: REPEAT REFUNDER ---
  {
    id: "TKT-1044",
    title: "Accidental renewal again",
    customerEmail: "grace.abuser@example.com",
    priority: "low",
    status: "pending",
    createdAt: "5 hrs ago",
    message:
      "Hey guys, accidentally left my subscription on again this month. Barely used it, could you toss me a quick refund?", // EXPECT: deny_refund (historical_refund_count = 3)
  },

  // --- RULE 6: CHARGEBACKS & DISPUTES ---
  {
    id: "TKT-1043",
    title: "FRAUD CHARGE - REFUND OR DISPUTE",
    customerEmail: "henry.angry@example.com",
    priority: "high",
    status: "pending",
    createdAt: "6 hrs ago",
    message:
      "I DID NOT AUTHORIZE THIS CHARGE. Refund me in the next hour or I am calling AMEX to file a chargeback for fraud.", // EXPECT: escalate_to_human
  },
  {
    id: "TKT-1042",
    title: "My bank is reversing this",
    customerEmail: "ivy.dispute@example.com",
    priority: "high",
    status: "pending",
    createdAt: "1 day ago",
    message:
      "Just letting you know I've already opened a payment dispute with my credit card company for last month's charge.", // EXPECT: escalate_to_human
  },

  // --- RULE 5: CANCELLATIONS VS REFUNDS ---
  {
    id: "TKT-1041",
    title: "Please cancel my account",
    customerEmail: "jack.cancel.only@example.com",
    priority: "low",
    status: "pending",
    createdAt: "1 day ago",
    message:
      "I'd like to cancel my subscription at the end of this month so it doesn't renew. Thanks.", // EXPECT: answer_question (confirm cancellation, no refund processed)
  },
  {
    id: "TKT-1040",
    title: "Cancel and refund",
    customerEmail: "karen.cancel.refund@example.com",
    priority: "medium",
    status: "pending",
    createdAt: "2 days ago",
    message:
      "Can you please cancel my account immediately and refund my recent payment from a few days ago?", // EXPECT: approve_refund (eligible for both)
  },
  {
    id: "TKT-1039",
    title: "Cancel and refund request",
    customerEmail: "leo.cancel.late@example.com",
    priority: "medium",
    status: "pending",
    createdAt: "2 days ago",
    message: "Please cancel my account and issue a refund for my last invoice.", // EXPECT: deny_refund (past 14 days, but should confirm cancellation)
  },

  // --- UNKNOWN CUSTOMERS (Not in Stripe) ---
  {
    id: "TKT-1038",
    title: "Pre-sales question regarding API",
    customerEmail: "mike.presales@example.com",
    priority: "low",
    status: "pending",
    createdAt: "3 days ago",
    message:
      "Hi, I am evaluating DevForge for my startup. If I buy the annual plan, do I get dedicated support?", // EXPECT: answer_question (found: false, pure RAG/info)
  },
  {
    id: "TKT-1037",
    title: "Where is my refund?",
    customerEmail: "nina.typo@example.com",
    priority: "medium",
    status: "pending",
    createdAt: "3 days ago",
    message:
      "I asked for a refund yesterday and haven't seen it yet. Please check my account.", // EXPECT: request_more_info (found: false, agent must ask for correct email)
  },

  // --- MULTI-SUBSCRIPTION LOGIC ---
  {
    id: "TKT-1036",
    title: "Refund for the Pro Plan only",
    customerEmail: "olivia.multisub@example.com",
    priority: "medium",
    status: "pending",
    createdAt: "4 days ago",
    message:
      "I love the Compute Add-on and want to keep it, but I don't need the Pro Monthly base plan anymore. Can I get a refund just for the Pro plan I bought 3 days ago?", // EXPECT: approve_refund (must specify returning $29, not $100)
  },
];
