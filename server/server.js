const STRIPE_SECRET_KEY =
  "sk_test_51Jx1cdLBlaDAR7THINnFtmhlbxt3oaeehIMdTtpTitqJtX5eTtBenCXEF1bnHUN8xvpzUSAxgFhut1BfRu1bZljo00F6QMtxgc";

//Twilio Credentials
const TWILIO_ACCOUNT_SID = "ACd26c851e7d7d597599bf47a5731e37a5";
const TWILIO_FROM_NUMBER = "+12184322463";
const TWILIO_AUTH_TOKEN = "c75a54e3454e04512525f18d3997b139";

//Mailtrap Credentials
const MAILTRAP_HOST = "smtp.mailtrap.io";
const MAILTRAP_PORT = "465";
const MAILTRAP_USERNAME = "f042c9593f2598";
const MAILTRAP_PASSWORD = "d07709e2adc4ca";

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const stripe = require("stripe")(STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");
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
    res.status(400).send("Invalid request - No subscription id was provided");
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

server.post("/send-sms", (req, res) => {
  console.log("Running on localhost");
  const toPhoneNumber = req.body.toPhoneNumber;
  const messageText = req.body.messageText;
  twilio.messages
    .create({
      body: messageText,
      from: TWILIO_FROM_NUMBER,
      to: toPhoneNumber,
    })
    .then((message) => {
      res.send("Message sent");
    });
});

server.post("/send-email", async (req, res) => {
  const toEmail = req.body.email;
  const messageText = req.body.messageText;

  //SMTP Config
  let transporter = nodemailer.createTransport({
    host: MAILTRAP_HOST,
    port: MAILTRAP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: MAILTRAP_USERNAME, // generated ethereal user
      pass: MAILTRAP_PASSWORD, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Subscription APP 👻" <super@subscriptions.app>', // sender address
    to: toEmail, // list of receivers
    subject: "Hello from email✔", // Subject line
    text: messageText, // plain text body
    html: `<!DOCTYPE html>
<html lang="en" >

<head>
  <meta charset="UTF-8">
  <title>Welcome To Subscriptions APP</title>
  
  
  
  
  
</head>

<body>

  <head><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<title>SendGrid Signup Confirmation</title>
	<style media="all" type="text/css">@media only screen and (max-width: 480px) {
  table[class=body] h1 {
    font-size: 24px !important;
  }
  table[class=body] h2 {
    font-size: 20px !important;
  }
  table[class=body] h3 {
    font-size: 14px !important;
  }
  table[class=body] .content,
  table[class=body] .wrapper {
    padding: 15px !important;
  }
  table[class=body] .container {
    width: 100% !important;
    padding: 0 !important;
  }
  table[class=body] .column {
    width: 100% !important;
  }
  table[class=body] .stats .column {
    width: 50% !important;
  }
  table[class=body] .hero-image,
  table[class=body] .thumb {
    width: 100% !important;
    height: auto !important;
  }
  table[class=body] .btn table,
  table[class=body] .btn a {
    width: 100% !important;
  }
  table[class=body] .stats-table {
    display: none !important;
  }
  table[class=body] .stats-labels .label,
  table[class=body] .category-labels .label {
    font-size: 10px !important;
  }
  table[class=body] .credits table {
    table-layout: auto !important;
  }
  table[class=body] .credits .label {
    font-size: 11px !important;
  }
}
	</style>
	<style type="text/css">@font-face {
    font-family: 'Open Sans';
    font-style: normal;
    font-weight: 300;
    src: local('Open Sans Light'), local('OpenSans-Light'), url(https://fonts.gstatic.com/s/opensans/v13/DXI1ORHCpsQm3Vp6mXoaTYnF5uFdDttMLvmWuJdhhgs.ttf) format('truetype');
}


@font-face {
    font-family: 'Open Sans';
    font-style: normal;
    font-weight: 400;
    src: local('Open Sans'), local('OpenSans'), url(https://fonts.gstatic.com/s/opensans/v13/cJZKeOuBrn4kERxqtaUH3aCWcynf_cDxXwCLxiixG1c.ttf) format('truetype');
}


@font-face {
    font-family: 'Open Sans';
    font-style: normal;
    font-weight: 600;
    src: local('Open Sans Semibold'), local('OpenSans-Semibold'), url(https://fonts.gstatic.com/s/opensans/v13/MTP_ySUJH_bn48VBG8sNSonF5uFdDttMLvmWuJdhhgs.ttf) format('truetype');
}
	</style>
	<!--[if mso]>
		<style>
		  h1, h2, h3, h4,
		  p, ol, ul {
		    font-family: Arial, sans-serif !important;
		  }
		</style>
	<![endif]-->
</head>
<body style="font-size: 16px; background-color: #fdfdfd; margin: 0; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; line-height: 1.5; -ms-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; height: 100% !important; width: 100% !important;">
<table bgcolor="#fdfdfd" class="body" style="box-sizing: border-box; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; width: 100%; background-color: #fdfdfd; border-collapse: separate !important;" width="100%">
	<tbody>
		<tr>
			<td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;</td>
			<td class="container" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; display: block; width: 600px; max-width: 600px; margin: 0 auto !important;" valign="top" width="600">
			<div class="content" style="box-sizing: border-box; display: block; max-width: 600px; margin: 0 auto; padding: 10px;"><span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">Let's confirm your email address.</span>
			<div class="header" style="box-sizing: border-box; width: 100%; margin-bottom: 30px; margin-top: 15px;">
			<table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; border-collapse: separate !important;" width="100%">
				<tbody>
					<tr>
						<td align="left" class="align-left" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; text-align: left;" valign="top"><span class="sg-image" data-imagelibrary="%7B%22width%22%3A123%2C%22height%22%3A%2222%22%2C%22alt_text%22%3A%22SendGrid%22%2C%22alignment%22%3A%22%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//uiux.s3.amazonaws.com/2016-logos/email-logo%25402x.png%22%2C%22link%22%3A%22https%3A//sendgrid.com%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D"><a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none;" target="_blank"><img alt="SendGrid" height="22" src="https://uiux.s3.amazonaws.com/2016-logos/email-logo%402x.png" style="max-width: 100%; border-style: none; width: 123px; height: 22px;" width="123"></a></span></td>
					</tr>
				</tbody>
			</table>
			</div>

			<div class="block" style="box-sizing: border-box; width: 100%; margin-bottom: 30px; background: #ffffff; border: 1px solid #f0f0f0;">
			<table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; border-collapse: separate !important;" width="100%">
				<tbody>
					<tr>
						<td class="wrapper" style="box-sizing: border-box; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; padding: 30px;" valign="top">
						<table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; border-collapse: separate !important;" width="100%">
							<tbody>
								<tr>
									<td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">
									<h2 style="margin: 0; margin-bottom: 30px; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-weight: 300; line-height: 1.5; font-size: 24px; color: #294661 !important;">You're on your way!<br>
									Let's confirm your email address.</h2>
                  <h2>${messageText}</h2>

									<p style="margin: 0; margin-bottom: 30px; color: #294661; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 300;">By clicking on the following link, you are confirming your email address and agreeing to SendGrid's <a href="/policies/tos?utm_campaign=website&amp;utm_medium=email&amp;utm_source=sendgrid.com" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none;" target="_blank">Terms of Service</a>.</p>
									</td>
								</tr>
								<tr>
									<td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">
									<table cellpadding="0" cellspacing="0" class="btn btn-primary" style="box-sizing: border-box; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; width: 100%; border-collapse: separate !important;" width="100%">
										<tbody>
											<tr>
												<td align="center" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; padding-bottom: 15px;" valign="top">
												<table cellpadding="0" cellspacing="0" style="box-sizing: border-box; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; width: auto; border-collapse: separate !important;">
													<tbody>
														<tr>
															<td align="center" bgcolor="#348eda" style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top; background-color: #348eda; border-radius: 2px; text-align: center;" valign="top"><a href="#" style="box-sizing: border-box; border-color: #348eda; font-weight: 400; text-decoration: none; display: inline-block; margin: 0; color: #ffffff; background-color: #348eda; border: solid 1px #348eda; border-radius: 2px; cursor: pointer; font-size: 14px; padding: 12px 45px;" target="_blank">Confirm Email Address</a></td>
														</tr>
													</tbody>
												</table>
												</td>
											</tr>
										</tbody>
									</table>
									</td>
								</tr>
							</tbody>
						</table>
						</td>
					</tr>
				</tbody>
			</table>
			</div>

			<div class="footer" style="box-sizing: border-box; clear: both; width: 100%;">
			<table style="box-sizing: border-box; width: 100%; border-spacing: 0; mso-table-rspace: 0pt; mso-table-lspace: 0pt; font-size: 12px; border-collapse: separate !important;" width="100%">
				<tbody>
					<tr style="font-size: 12px;">
						<td align="center" class="align-center" style="box-sizing: border-box; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; vertical-align: top; font-size: 12px; text-align: center; padding: 20px 0;" valign="top"><span class="sg-image" data-imagelibrary="%7B%22width%22%3A89%2C%22height%22%3A%2216%22%2C%22alt_text%22%3A%22SendGrid%22%2C%22alignment%22%3A%22center%22%2C%22border%22%3A0%2C%22src%22%3A%22https%3A//uiux.s3.amazonaws.com/2016-logos/email-logo%25402x.png%22%2C%22link%22%3A%22https%3A//sendgrid.com%22%2C%22classes%22%3A%7B%22sg-image%22%3A1%7D%7D" style="float: none; display: block; text-align: center;"><a href="https://sendgrid.com?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none; font-size: 12px;" target="_blank"><img alt="SendGrid" height="16" src="https://uiux.s3.amazonaws.com/2016-logos/email-logo%402x.png" style="max-width: 100%; border-style: none; font-size: 12px; width: 89px; height: 16px;" width="89"></a></span>

						<p class="tagline" style="color: #294661; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; margin-bottom: 5px; margin: 10px 0 20px;">Send with Confidence</p>

						<p style="margin: 0; color: #294661; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-weight: 300; font-size: 12px; margin-bottom: 5px;">© SendGrid Inc. 1801 California Street, Suite 500, Denver, CO 80202 USA</p>

						<p style="margin: 0; color: #294661; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-weight: 300; font-size: 12px; margin-bottom: 5px;"><a href="https://sendgrid.com/blog/?utm_campaign=website&amp;utm_medium=email&amp;utm_source=sendgrid.com" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none; font-size: 12px; padding: 0 5px;" target="_blank">Blog</a> <a href="https://github.com/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none; font-size: 12px; padding: 0 5px;" target="_blank">GitHub</a> <a href="https://twitter.com/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none; font-size: 12px; padding: 0 5px;" target="_blank">Twitter</a> <a href="https://www.facebook.com/SendGrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none; font-size: 12px; padding: 0 5px;" target="_blank">Facebook</a> <a href="https://www.linkedin.com/company/sendgrid?utm_campaign=website&amp;utm_source=sendgrid.com&amp;utm_medium=email" style="box-sizing: border-box; color: #348eda; font-weight: 400; text-decoration: none; font-size: 12px; padding: 0 5px;" target="_blank">LinkedIn</a></p>
						</td>
					</tr>
				</tbody>
			</table>
			</div>
			</div>
			</td>
			<td style="box-sizing: border-box; padding: 0; font-family: 'Open Sans', 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;</td>
		</tr>
	</tbody>
</table>




</body>
  
  

</body>

</html>
`, // html body
  });
  res.send("Mail sent");
});

server.get("*", (req, res) => {
  res.status(200).send(req.query);
});

server.listen(PORT, () => {
  console.log(`Server started :) on PORT: ${PORT}`);
});
