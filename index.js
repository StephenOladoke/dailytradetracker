const express = require('express')

const stripe = require('stripe')("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")

const bodyParser = require('body-parser')

const app = express()

app.post('/webhook', bodyParser.raw({type:"application/json"}), async(req, res) => {
    let signingsecret = "whsec_8ffe1c4bd859eb694887fa9e7ac2682748d0c7b22939aabb53bd38cde0883ff2";

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

app.listen(4242, () => {
    console.log('Server is running on port 4242')
})