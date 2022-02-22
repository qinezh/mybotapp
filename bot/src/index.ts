import { MessageFactory } from "botbuilder";
import { TeamsFxBot } from "./sdk/bot";
import { BlobsStorage } from "botbuilder-azure-blobs";
import { AppSettingsProvider } from "./cards";
import { adapter } from "./adapter";
import { FileStorage } from "./sdk/fileStorage";
import { server } from "./server";

// create TeamsFx Bot with options. 
const teamsfxBot = new TeamsFxBot(adapter, {
  // You could also use Azure Blob storage to save subscribers info.
  // storage: new BlobsStorage(process.env.blobConnectionString, process.env.blobContainerName),
  storage: new FileStorage(".teamsfx.bot.json"),
  welcomeMessage: {
    message: MessageFactory.text("Hello, this is notification bot created by TeamsFx.")
  },
  settingsProvider: new AppSettingsProvider({
    commandName: "settings"
  })
});


// HTTP trigger for the notification.
server.post("/api/notify/default", async (req, res) => {
  await teamsfxBot.forEachSubscribers(async subscriber => {
    await teamsfxBot.notifySubscriber(subscriber, MessageFactory.text(`Hello world!`));
  });

  res.json({});
});
