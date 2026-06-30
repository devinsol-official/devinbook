const data = new URLSearchParams({
    From: "whatsapp:+18777804236",
    Body: "I spent 15 on coffee",
}).toString();

console.log("Sending simulated Twilio webhook request...");

fetch('http://127.0.0.1:5000/api/whatsapp/webhook', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: data
})
    .then(res => res.text())
    .then(text => {
        console.log(`\nResponse from our server (TwiML):\n${text}`);
    })
    .catch(err => {
        console.error(`\nProblem with request: ${err.message}`);
    });
