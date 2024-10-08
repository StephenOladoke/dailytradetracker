const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(''); // Replace with your Stripe secret key
const nodemailer = require('nodemailer');

const app = express();
const port = 4242;

// Middleware for JSON parsing on specific routes
app.use('/create-checkout-session', bodyParser.json());
app.use('/create-checkout-session', bodyParser.urlencoded({ extended: true }));

// Stripe webhook endpoint
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = ''; // Replace with your Webhook signing secret
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const customerEmail = session.customer_details.email;

      // Send email with Notion template and receipt
      await sendEmail(customerEmail, session.amount_total / 100);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).end();
});

// Route to create a Stripe Checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Notion Template',
          },
          unit_amount: 1000, // $10.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:4242/success',
      cancel_url: 'http://localhost:4242/cancel',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error(`Error creating checkout session: ${error}`);
    res.status(500).send('Internal Server Error');
  }
});

// Function to send email
async function sendEmail(to, amount) {
  // Set up Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '', // Replace with your email
      pass: '', // Replace with your email password or an app-specific password
    },
  });

  const mailOptions = {
    from: 'your-email@gmail.com',
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

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
