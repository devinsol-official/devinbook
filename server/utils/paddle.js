const { Paddle } = require("@paddle/paddle-node-sdk");

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
  environment: process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox",
});

module.exports = paddle;