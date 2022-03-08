import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Activity } from "botbuilder";
import { teamsfxBot } from "./.initialize";
import { buildBotMessage } from "./adaptiveCardBuider";

// HTTP trigger to send notification.
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const message: Partial<Activity> = buildBotMessage(() => {
    return {
      title: "New Event Occurred!",
      appName: "Contoso App Notification",
      description: "This is a sample http-triggered notification",
      notificationUrl: "https://www.adaptivecards.io/"
    }
  });

  await teamsfxBot.forEachAppInstallation(async appInstallation =>
    {
      teamsfxBot.notifyAppInstallation(appInstallation, message);
      const members = await appInstallation.members;
      for (const member of members) {
        await teamsfxBot.notifyMember(member, message);
      }
    } 
    
  );

  // try
  await notify({
    target: AppInstallation | Channel | Member
  }, message);

  context.res = {};
};

export default httpTrigger;