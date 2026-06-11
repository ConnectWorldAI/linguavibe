# RevenueCat Research Notes

## Webhook Events to Handle
- INITIAL_PURCHASE - New subscription purchased
- RENEWAL - Subscription renewed
- CANCELLATION - Cancelled or refunded
- UNCANCELLATION - Re-enabled cancelled subscription
- NON_RENEWING_PURCHASE - One-time purchase (lifetime)
- EXPIRATION - Subscription expired, revoke access
- BILLING_ISSUE - Payment problem (don't revoke yet)
- PRODUCT_CHANGE - User changed plan
- TRANSFER - Transactions transferred between users
- SUBSCRIPTION_EXTENDED - Expiration pushed back

## Webhook Best Practices
- Return 200 quickly, defer processing
- Use authorization header for security
- Handle duplicates (track event `id`)
- Retries: 5 times at 5, 10, 20, 40, 80 min intervals
- After receiving webhook, call GET /subscribers REST API for full customer info

## REST API
- Base URL: https://api.revenuecat.com/v1
- Auth: Bearer token (secret key for server-side)
- GET /subscribers/{app_user_id} - Get customer info with entitlements
- POST /receipts - Create a purchase

## Key Fields in Webhook
- event.type - Event type
- event.id - Unique event ID (for dedup)
- event.app_user_id - Customer ID
- event.product_id - Product purchased
- event.entitlement_ids - Array of entitlements
- event.expiration_at_ms - When subscription expires
- event.environment - PRODUCTION or SANDBOX
- event.price - Price in USD
- event.currency - Currency code
- event.cancel_reason - Why cancelled (UNSUBSCRIBE, BILLING_ERROR, etc.)

## Our Products
- connectworld_plus_monthly / yearly
- connectworld_pro_monthly / yearly  
- connectworld_enterprise_monthly / yearly
- connectworld_lifetime (NON_RENEWING_PURCHASE)

## Our Entitlements
- plus_access
- pro_access
- enterprise_access
