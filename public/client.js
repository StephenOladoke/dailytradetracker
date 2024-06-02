const stripe = Stripe('pk_live_51PGnOZEePaIrUnLNbTcjzEUYQUwGpYfwYz7y1EDXqqJWH1lFCeKX9c8FF2G85DKyPIYUx5u0t9XyfdKxBPvIAKOx001bDOhWqa');

const paymentForm = document.getElementById('contact-form');


paymentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    console.log('Form submitted');

    const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    if (response.ok) {
        const session = await response.json();
        console.log('Session:', session);

        if (session.id) {
            console.log('Redirecting to Stripe Checkout...');
            const { error } = await stripe.redirectToCheckout({
                sessionId: session.id
            });
            
            if (error) {
                console.error('Error redirecting to Stripe Checkout:', error);
            }
        } else {
            console.error('No session ID received');
        }
    } else {
        console.error('Error fetching session:', response.statusText);
    }
});