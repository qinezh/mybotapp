// Import required packages
import { IncomingWebhookTarget, NotificationTarget } from "./sdk/context";
import { buildAdaptiveCard } from "./sdk/adaptiveCard";
import notificationTemplate from "./adaptiveCards/notification-default.json";

async function testIncomingWebhook() {
    const target: NotificationTarget = new IncomingWebhookTarget(new URL("webhook-url"));
    await target.sendAdaptiveCard(buildAdaptiveCard(() => {
        return {
            title: "New Event Occurred!",
            appName: "Contoso App Notification",
            description: "This is a sample http-triggered notification",
            notificationUrl: "https://www.adaptivecards.io/"
        }
    }, notificationTemplate));
}

testIncomingWebhook().then(() => console.log("Done")).catch(e => console.log(e));