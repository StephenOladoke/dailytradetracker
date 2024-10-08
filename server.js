require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 8080;

// Middleware to serve static files from the 'public' directory
app.use(express.static('public'));


// Middleware for JSON parsing on specific routes
app.use('/create-checkout-session', bodyParser.json());
app.use('/create-checkout-session', bodyParser.urlencoded({ extended: true }));


app.post('/create-checkout-session', async (req, res) => {
  try {
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Daily Trade Tracker Template',
          },
          unit_amount: 4000000, // $10.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://www.dailytradetracker.com/success.html',
      cancel_url: 'https://www.dailytradetracker.com/cancel.html',
      // success_url: 'http://localhost:8080/success.html',
      // cancel_url: 'http://localhost:8080/cancel.html',
    });

    console.log('Session created:', session.id);

    // Respond with the session ID
    res.json({ id: session.id });
  } catch (error) {
    console.error(`Error creating checkout session: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

// Webhook and email functionality
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
    return res.sendStatus(400);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const customerEmail = session.customer_details.email;
      await sendEmail(customerEmail, session.amount_total / 100);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).end();
});

async function sendEmail(to, amount) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Your Notion Template and Receipt',
    text: `Thank you for your purchase! Here is your Notion template: [link to template].
    Your payment of $${amount} was successful. Attached is your receipt.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email: ${error}`);
  }
}

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
  // console.log(`Server is running on http://localhost:${port}`);
});
