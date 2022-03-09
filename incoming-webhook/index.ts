// Import required packages
import * as restify from "restify";
import { buildIncomingWebhookMessage } from "./adaptiveCardBuider";
import { AppNotification } from "./notification";

// Create notification instance
const webhook = "your-incoming-webhook-url";
const appNotification = new AppNotification(new URL(webhook));

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\nApp Started, ${server.name} listening to ${server.url}`);
});

// Listen for incoming requests.
server.post("/api/notification", async (req, res) => {
    await appNotification.notify(buildIncomingWebhookMessage(() => {
        return {
            title: "New Event Occurred!",
            appName: "Contoso App Notification",
            description: "This is a sample http-triggered notification",
            notificationUrl: "https://www.adaptivecards.io/"
        }
    }));

    res.json({});
});