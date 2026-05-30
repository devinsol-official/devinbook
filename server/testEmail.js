require("dotenv").config();
const sendEmail = require("./utils/sendEmail");
const { subscriptionActivatedTemplate, subscriptionRenewedTemplate, subscriptionCancelledTemplate } = require("./utils/emailTemplates");

async function test() {
  const email = "tabarakyaseen46@gmail.com";
  
  console.log("Sending Activated Email...");
  await sendEmail({
    to: email,
    subject: "Test - Welcome to DevinBook Pro! 👑",
    html: subscriptionActivatedTemplate("Tabarak", new Date()),
  });

  console.log("Sending Renewed Email...");
  await sendEmail({
    to: email,
    subject: "Test - Subscription Renewed! 🎉",
    html: subscriptionRenewedTemplate("Tabarak", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  });

  console.log("Sending Cancelled Email...");
  await sendEmail({
    to: email,
    subject: "Test - Subscription Ended 😢",
    html: subscriptionCancelledTemplate("Tabarak"),
  });

  console.log("All test emails sent!");
}

test();

test();
