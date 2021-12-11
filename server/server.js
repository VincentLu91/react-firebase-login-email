const STRIPE_SECRET_KEY =
  "sk_test_51Jx1cdLBlaDAR7THINnFtmhlbxt3oaeehIMdTtpTitqJtX5eTtBenCXEF1bnHUN8xvpzUSAxgFhut1BfRu1bZljo00F6QMtxgc";
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const stripe = require("stripe")(STRIPE_SECRET_KEY);
const server = express();

const PORT = 8080;
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cors({ origin: "*" }));
server.post("/stripe/retrieve-subscription", async (req, res) => {
  //
  const stripeSubscriptionId = req.body.stripeSubscriptionId;
  if (!stripeSubscriptionId) {
    res.send("Invalid request - No subscription id was provided");
    return;
  }

  try {
    //Call stripe's API using Stripe SDK to check subscription details with the provided id
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    );
    res.send(subscription);
  } catch (error) {
    console.log(error.statusCode);
    res.send(error.message);
  }
});

server.post("/stripe/cancel-subscription", async (req, res) => {
  const stripeSubscriptionId = req.body.stripeSubscriptionId;
  if (!stripeSubscriptionId) {
    res.send("Invalid request - No subscription id was provided");
    return;
  }

  try {
    //Call stripe's API using Stripe SDK to check subscription details with the provided id
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    res.send("Succesfully deleted");
  } catch (error) {
    console.log(error.statusCode);
    res.send(error.message);
  }
});

server.post("/stripe/recover-subscription", async (req, res) => {
  const stripeSubscriptionId = req.body.stripeSubscriptionId;
  if (!stripeSubscriptionId) {
    res.send("Invalid request - No subscription id was provided");
    return;
  }

  try {
    //Call stripe's API using Stripe SDK to check subscription details with the provided id
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    res.send("Succesfully recovered");
  } catch (error) {
    console.log(error.statusCode);
    res.send(error.message);
  }
});

server.post("/stripe/switch-plans", async (req, res) => {
  const stripeSubscriptionId = req.body.stripeSubscriptionId;
  const newPriceId = req.body.newPriceId; //Use price id
  console.log("Switch plans called");
  if (!stripeSubscriptionId) {
    res.send("Invalid request - No subscription id was provided");
    return;
  }

  try {
    //Call stripe's API using Stripe SDK to check subscription details with the provided id
    //Active subscription data
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    );
    console.log(subscription.customer);
    console.log(newPriceId);

    let defaultPaymentMethod = subscription.default_payment_method;

    if (!defaultPaymentMethod) {
      const customer = await stripe.customers.retrieve(subscription.customer);
      defaultPaymentMethod = customer.invoice_settings.default_payment_method;
    }

    const newSubscription = await stripe.subscriptions.create({
      customer: subscription.customer,
      default_payment_method: defaultPaymentMethod,
      items: [{ price: newPriceId }],
    });
    await stripe.subscriptions.del(stripeSubscriptionId);
    res.send("Succesfully switched");
  } catch (error) {
    console.log(error.statusCode);
    res.send(error.message);
  }
});

// trying out the prebuilt checkout page
server.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: "{{PRICE_ID}}",
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `localhost:3000/?success=true`,
    cancel_url: `localhost:3000?canceled=true`,
  });

  res.redirect(303, session.url);
});

server.get("*", (req, res) => {
  res.status(200).send(req.query);
});

server.listen(PORT, () => {
  console.log(`Server started :) on PORT: ${PORT}`);
});
