const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(''); // Replace with your Stripe secret key
const nodemailer = require('nodemailer');

const app = express();
const port = 4242;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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