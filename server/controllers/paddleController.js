const paddle = require("../utils/paddle");
const User = require("../models/User");
const SubscriptionLog = require("../models/SubscriptionLog");
const Setting = require("../models/Setting");
const Customer = require("../models/Customer");
const Subscription = require("../models/Subscription");
const sendEmail = require("../utils/sendEmail");
const { subscriptionActivatedTemplate, subscriptionRenewedTemplate } = require("../utils/emailTemplates");

exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId, userId } = req.body;
    const user = await User.findById(userId || req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let price = priceId;
    if (!price) {
      const priceSetting = await Setting.findOne({ key: "paddle_pro_price_id" });
      price = priceSetting ? priceSetting.value : process.env.PADDLE_PRO_PRICE_ID;
    }

    if (!price) {
      return res.status(400).json({ message: "Price ID not configured in database" });
    }

    const transaction = await paddle.transactions.create({
      items: [{ price_id: price, quantity: 1 }],
      customer: {
        email: user.email,
        external_customer_id: user._id.toString(),
      },
      custom_data: {
        user_id: user._id.toString(),
        subscription_type: "pro",
      },
      return_url: `${process.env.CLIENT_URL}/settings?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL}/settings?checkout=cancelled`,
    });

    res.json({ checkoutUrl: transaction.checkout.url });
  } catch (err) {
    console.error("Paddle checkout error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const customer = await Customer.findOne({ userId: user._id });
    if (!customer) {
      return res.status(404).json({ message: "No Paddle customer linked to this user" });
    }

    const portalSession = await paddle.customers.createPortalSession(customer.paddleCustomerId, {
      return_url: `${process.env.CLIENT_URL}/settings`,
    });

    res.json({ portalUrl: portalSession.url });
  } catch (err) {
    console.error("Paddle portal error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyTransaction = async (req, res) => {
  try {
    const { ptxn } = req.body;
    if (!ptxn) return res.status(400).json({ message: "Transaction ID is required" });

    const transaction = await paddle.transactions.get(ptxn);
    if (transaction && (transaction.status === "completed" || transaction.status === "paid")) {
      const customData = transaction.customData || transaction.custom_data;
      const userId = customData?.user_id || customData?.userId;
      if (!userId) return res.status(400).json({ message: "No user ID found in transaction" });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const subscriptionId = transaction.subscriptionId || transaction.subscription_id;
      if (subscriptionId) {
        if (user.paddleSubscriptionId === subscriptionId) {
          return res.json({ success: true, message: "Already updated", user });
        }

        const subscription = await paddle.subscriptions.get(subscriptionId);
        const currentBillingPeriod = subscription.currentBillingPeriod || subscription.current_billing_period;
        const currentPeriodEnd = new Date(currentBillingPeriod.endsAt || currentBillingPeriod.ends_at);

        user.plan = "pro";
        user.planActivatedAt = user.planActivatedAt || new Date();
        user.planExpiresAt = currentPeriodEnd;
        user.paddleSubscriptionId = subscription.id;
        user.paddleCustomerId = subscription.customerId || subscription.customer_id;
        await user.save();

        await SubscriptionLog.create({
          user: user._id,
          action: "Activated",
          newExpiryDate: user.planExpiresAt,
          details: `Subscription activated via frontend verify: ${subscription.id}`,
        });
      }

      return res.json({ success: true, message: "Subscription updated", user });
    }
    
    return res.json({ success: false, message: "Transaction not completed or missing data", status: transaction?.status, transaction });
  } catch (err) {
    console.error("Paddle verify error:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["paddle-signature"];
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    const bodyStr = req.body.toString();
    const event = paddle.webhooks.unmarshal(bodyStr, secret, signature);

    switch (event.event_type) {
      case "customer.created":
      case "customer.updated":
        await handleCustomerEvent(event.data);
        break;
      case "subscription.created":
      case "subscription.updated":
      case "subscription.canceled":
        await handleSubscriptionEvent(event.data);
        break;
      case "transaction.completed":
        await handleTransactionCompleted(event.data);
        break;
      default:
        // Safely ignore other types
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Paddle webhook error:", err);
    // Don't return 2xx on verification failure
    res.status(400).json({ message: err.message });
  }
};

async function handleCustomerEvent(data) {
  const customData = data.custom_data || {};
  const userId = customData.user_id || customData.userId;

  await Customer.findOneAndUpdate(
    { paddleCustomerId: data.id },
    {
      paddleCustomerId: data.id,
      email: data.email,
      userId: userId || null
    },
    { upsert: true, new: true }
  );
}

async function handleSubscriptionEvent(data) {
  const customerId = data.customer_id;
  
  const price = data.items && data.items[0] && data.items[0].price ? data.items[0].price : null;

  await Subscription.findOneAndUpdate(
    { paddleSubscriptionId: data.id },
    {
      paddleSubscriptionId: data.id,
      paddleCustomerId: customerId,
      status: data.status,
      priceId: price ? price.id : "",
      productId: price ? price.product_id : "",
      scheduledChangeAction: data.scheduled_change ? data.scheduled_change.action : null,
      scheduledChangeAt: data.scheduled_change ? new Date(data.scheduled_change.effective_at) : null
    },
    { upsert: true, new: true }
  );

  await updateAccessFromSubscriptions(customerId);
}

async function updateAccessFromSubscriptions(paddleCustomerId) {
  const customer = await Customer.findOne({ paddleCustomerId });
  if (!customer || !customer.userId) return;

  const user = await User.findById(customer.userId);
  if (!user) return;

  const activeSubscriptions = await Subscription.find({
    paddleCustomerId,
    status: { $in: ["active", "trialing"] }
  });

  const hasAccess = activeSubscriptions.length > 0;
  
  if (hasAccess) {
    user.plan = "pro";
    user.paddleSubscriptionId = activeSubscriptions[0].paddleSubscriptionId;
    user.paddleCustomerId = paddleCustomerId;
    if (!user.planActivatedAt) user.planActivatedAt = new Date();
  } else {
    user.plan = "free";
  }
  await user.save();
}

async function handleTransactionCompleted(data) {
  const customData = data.custom_data || {};
  const userId = customData.user_id || customData.userId;
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  await SubscriptionLog.create({
    user: user._id,
    action: "Transaction Completed",
    newExpiryDate: user.planExpiresAt,
    details: `Paddle transaction completed: ${data.id}, Amount: ${data.details?.totals?.total / 100} ${data.details?.totals?.currency_code}`,
  });
}