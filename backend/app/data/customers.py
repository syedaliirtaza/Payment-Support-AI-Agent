"""Mock customer records — an in-memory stand-in for Stripe data.
Base Date for calculations: May 18, 2026.
"""

CUSTOMER_DATABASE: dict[str, dict] = {
    # 1 & 2. Standard 14-Day (Eligible)
    "alice.standard@example.com": {
        "customer_id": "cus_ALICE001",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_AliceM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-05-10",
                "current_period_end": "2026-06-10",
                "usage_percent": 5,
            }
        ],
    },
    "bob.standard.annual@example.com": {
        "customer_id": "cus_BOB002",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_BobA",
                "plan": "Team Annual",
                "status": "active",
                "amount": 290.00,
                "interval": "annual",
                "current_period_start": "2026-05-15",
                "current_period_end": "2027-05-15",
                "usage_percent": 2,
            }
        ],
    },
    # 3. Standard 14-Day (Ineligible - Month 2)
    "charlie.late@example.com": {
        "customer_id": "cus_CHARLIE003",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_CharM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-04-20",
                "current_period_end": "2026-05-20",
                "usage_percent": 15,
            }
        ],
    },
    # 4. Prorated Annual
    "david.prorate@example.com": {
        "customer_id": "cus_DAVID004",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_DaveA",
                "plan": "Enterprise Annual",
                "status": "active",
                "amount": 999.00,
                "interval": "annual",
                "current_period_start": "2026-01-01",
                "current_period_end": "2027-01-01",
                "usage_percent": 10,
            }
        ],
    },
    # 5 & 6. High Usage Exclusion (>40%)
    "eve.highuse@example.com": {
        "customer_id": "cus_EVE005",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_EveM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-05-16",
                "current_period_end": "2026-06-16",
                "usage_percent": 85,
            }
        ],
    },
    "frank.highuse.annual@example.com": {
        "customer_id": "cus_FRANK006",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_FrankA",
                "plan": "Team Annual",
                "status": "active",
                "amount": 290.00,
                "interval": "annual",
                "current_period_start": "2026-03-01",
                "current_period_end": "2027-03-01",
                "usage_percent": 65,
            }
        ],
    },
    # 7. Repeat Refunder Exclusion (>=2 historical refunds)
    "grace.abuser@example.com": {
        "customer_id": "cus_GRACE007",
        "historical_refund_count": 3,
        "subscriptions": [
            {
                "id": "sub_GraceM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-05-17",
                "current_period_end": "2026-06-17",
                "usage_percent": 0,
            }
        ],
    },
    # 8 & 9. Chargebacks & Disputes
    "henry.angry@example.com": {
        "customer_id": "cus_HENRY008",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_HenryM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-05-10",
                "current_period_end": "2026-06-10",
                "usage_percent": 5,
            }
        ],
    },
    "ivy.dispute@example.com": {
        "customer_id": "cus_IVY009",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_IvyM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-04-18",
                "current_period_end": "2026-05-18",
                "usage_percent": 20,
            }
        ],
    },
    # 10, 11, 12. Cancellations vs Refunds
    "jack.cancel.only@example.com": {
        "customer_id": "cus_JACK010",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_JackM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-05-01",
                "current_period_end": "2026-06-01",
                "usage_percent": 10,
            }
        ],
    },
    "karen.cancel.refund@example.com": {
        "customer_id": "cus_KAREN011",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_KarenM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-05-15",
                "current_period_end": "2026-06-15",
                "usage_percent": 5,
            }
        ],
    },
    "leo.cancel.late@example.com": {
        "customer_id": "cus_LEO012",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_LeoM",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-03-01",
                "current_period_end": "2026-04-01",
                "usage_percent": 15,
            }
        ],
    },
    # 15. Multi-subscription logic
    "olivia.multisub@example.com": {
        "customer_id": "cus_OLIVIA015",
        "historical_refund_count": 0,
        "subscriptions": [
            {
                "id": "sub_Oli1",
                "plan": "Pro Monthly",
                "status": "active",
                "amount": 29.00,
                "interval": "monthly",
                "current_period_start": "2026-05-15",
                "current_period_end": "2026-06-15",
                "usage_percent": 2,
            },
            {
                "id": "sub_Oli2",
                "plan": "Compute Add-on",
                "status": "active",
                "amount": 100.00,
                "interval": "monthly",
                "current_period_start": "2026-04-01",
                "current_period_end": "2026-05-01",
                "usage_percent": 80,
            },
        ],
    },
    # Note: 13 & 14 (Unknown/Pre-sales) are intentionally omitted from this dictionary so found=false.
}
