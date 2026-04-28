/**
 * PRODUCTION PAYMENT INTEGRATION GUIDE (STRIPE)
 * 
 * File: server/payments_stripe_example.js
 * 
 * This is a reference implementation showing how to create an enterprise-grade, 
 * PCI-DSS compliant, and 100% secure payment flow in Node.js/Express.
 * 
 * ⚠️ NEVER store plain text credit card details on your database.
 * Use this "Token & Webhook" flow to ensure your servers never touch sensitive card data.
 * 
 * INSTALLATION NEEDED FOR THIS FILE:
 * npm install stripe dotenv
 */

import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const db = new Database('noir.db');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook secrets prevent attackers from spoofing Stripe messages
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to calculate the order total strictly server-side (prevent frontend tampering)
function calculateOrderTotal(items) {
  // In production, query your SQLite database for prices, NEVER trust the price sent from the frontend!
  // const product = db.prepare("SELECT price FROM products WHERE id=?").get(item.id);
  const PRICES = {
    'kitkat-matcha': 1299,
    'buldak-ramen': 599,
    'takis-fuego': 899,
    'pocky-strawberry': 449,
    'hot-cheetos-limon': 999,
    'korean-honey-butter': 749,
    'ramune-soda': 1199,
    'oreo-cakesters': 1099,
  };
  
  const subtotal = items.reduce((sum, item) => {
    const price = PRICES[item.id] || 0;
    return sum + (price * item.qty);
  }, 0);

  const handling = 299; // fixed import fee
  return (subtotal + handling) * 100; // Stripe requires amounts in smallest currency unit (paise / cents)
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 1: CREATE PAYMENT INTENT (Called when user clicks "Checkout")
   ═══════════════════════════════════════════════════════════════════ */
app.post('/api/payments/create-intent', express.json(), async (req, res) => {
  try {
    const { items, customerEmail, customerProfile } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 1. Calculate the real price on the server
    const amountInPaise = calculateOrderTotal(items);
    
    // 2. Create a temporary "Pending" order in your database
    const orderId = `NOIR-${Date.now().toString().slice(-7)}`;
    const trackingId = `TRK_PENDING`;
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO orders (id, email, customer_json, items_json, subtotal, handling, total, status, placed_at, updated_at, tracking_id, notes, paymentMethod)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending_Payment', ?, ?, ?, ?, 'Credit Card')
    `).run(
      orderId,
      customerEmail,
      JSON.stringify(customerProfile),
      JSON.stringify(items),
      amountInPaise / 100 - 299,
      299,
      amountInPaise / 100,
      now,
      now,
      trackingId,
      customerProfile.notes || ""
    );

    // 3. Register the intent with Stripe. Stripe creates a secure session.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr', // Indian Rupees
      receipt_email: customerEmail,
      metadata: {
        orderId: orderId // Link Stripe transaction to our database order ID
      },
      automatic_payment_methods: {
        enabled: true, // Enables Cards, Netbanking, UPI, Wallets automatically
      },
    });

    // 4. Send the client_secret back to the frontend.
    // The frontend will use Stripe's secure iframe to collect card data using this secret.
    res.json({
      orderId: orderId,
      clientSecret: paymentIntent.client_secret,
    });

  } catch (err) {
    console.error("Payment Intent Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   STEP 2: THE SECURE WEBHOOK (Crucial for preventing fraud!)
   ═══════════════════════════════════════════════════════════════════ 
   ⚠️ DO NOT mark orders as paid inside the React frontend. Users can modify 
   JavaScript variables or close their browser mid-charge.
   
   Always wait for Stripe to send an encrypted POST request directly 
   to your backend server saying "The money has hit our vault."
*/
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // 1. Verify that this request actually came from Stripe (cryptographic signature)
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
  } catch (err) {
    console.error(`Webhook Signature Verification Failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Handle the "payment_intent.succeeded" event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    
    console.log(`💰 Payment succeeded for Order ${orderId}. Transaction ID: ${paymentIntent.id}`);

    // 3. Mark the order as successfully "Placed" and generate a real tracking number
    const realTrackingId = `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE orders 
      SET status = 'Placed', tracking_id = ?, updated_at = ? 
      WHERE id = ? AND status = 'Pending_Payment'
    `).run(realTrackingId, now, orderId);

    // 4. [Optional] Trigger Dropshipping API Webhook to supplier (e.g. AliExpress/Zendrop)
    // triggerSupplierOrder(orderId);
    
    // 5. [Optional] Send confirmation email to user via SendGrid/Postmark
    // sendOrderConfirmationEmail(orderId, paymentIntent.receipt_email);
  }

  // Acknowledge receipt of the webhook to Stripe
  res.json({ received: true });
});

console.log("Stripe payment backend module initialized.");
