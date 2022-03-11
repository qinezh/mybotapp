// Import required packages
import { buildAdaptiveCard } from "./adaptiveCardBuider";
import { IncomingWebhookTarget, NotificationTarget } from "./sdk/context";

async function testIncomingWebhook() {
    const target: NotificationTarget = new IncomingWebhookTarget(new URL("webhook-url"));
    await target.sendAdaptiveCard(buildAdaptiveCard(() => {
        return {
            title: "New Event Occurred!",
            appName: "Contoso App Notification",
            description: "This is a sample http-triggered notification",
            notificationUrl: "https://www.adaptivecards.io/"
        }
    }));
}

testIncomingWebhook().then(() => console.log("Done")).catch(e => console.log(e));