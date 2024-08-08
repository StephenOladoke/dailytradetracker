const express = require('express')

const stripe = require('stripe')("")

const bodyParser = require('body-parser')

const app = express()

app.post('/webhook', bodyParser.raw({type:"application/json"}), async(req, res) => {
    let signingsecret = "";

    const payload = req.body
    const sig = req.headers['stripe-signature']

    //matching these webhook is from stripe

    let event 

    try {
        event = stripe.webhooks.constructEvent(payload, sig, signingsecret)
    } catch (error){
        console.log(error.message)
        res.status(400).json({success:false})
        return
    }

    // Successful

    console.log(event.type)
    console.log(event.data.object)
    console.log(event.data.object.id)
    res.json({
        success:true
    })
})

app.listen(8080, () => {
    console.log('Server is running on port 8080')
})