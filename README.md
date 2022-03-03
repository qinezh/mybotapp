# TeamsFx Notification

## Try It

Install the latest version of VS Code extension [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension&ssr=false#overview), and press `F5` to launch the app in Teams.

## Basic Usage

```ts
await teamsfxBot.forEachAppInstallation(async appInstallation => {
  await teamsfxBot.notifyAppInstallation(appInstallation, MessageFactory.text(`Hello world!`));
});
```

Check [httpTrigger.ts](bot/src/httpTrigger.ts) or [timerTrigger.ts](bot/src/timerTrigger.ts) for more details.

## Options to create TeamsFx Bot

- `storage`: specify the storage to save app installations info, by default it's local file storage, and you could use Azure Blob instead.
- `welcomeMessage`: setup welcome message once bot is install.
- `appSettingsProvider`: Setup notification settings.

Sample usage:
```ts
// create TeamsFx Bot with options. 
const teamsfxBot = new TeamsFxBot(adapter, {
  // You could also use Azure Blob storage to save app installations info.
  storage: new BlobsStorage(process.env.blobConnectionString, process.env.blobContainerName),
  welcomeMessage: {
    message: MessageFactory.text("Hello, this is notification bot created by TeamsFx.")
  },
  settingsProvider: new AppSettingsProvider({
    commandName: "settings"
  })
});
```

## More Usages

### Case 1: Time trigger for the notification.
Scheduled job to send notification to the default place (Teams/Group Chat/Personal Chat) where the bot is installed.

Sample usage:
```ts
setInterval(async () => {
  await teamsfxBot.forEachAppInstallation(async appInstallation => {
    await teamsfxBot.notifyAppInstallation(appInstallation, MessageFactory.text(`Hello world! (this is a scheduled notification.)`));
  });
}, 30 * 1000); // every 30 seconds

```

### Case 2: Send notification to all the members of the subscribed team/group chat.

Sample usage:
```ts
await teamsfxBot.forEachAppInstallation(async appInstallation => {
  for (const member of await appInstallation.members) {
    await teamsfxBot.notifyMember(member, MessageFactory.text(`Hello ${member.account.name}!`));
  }
});
```

### Case 3: send notification to particular channel of the subscribed team.

Sample usage:
```ts
await teamsfxBot.forEachAppInstallation(async appInstallation => {
  for (const channel of await appInstallation.channels) {
    switch (channel.info.name) {
      case "Test":
        await teamsfxBot.notifyChannel(channel, MessageFactory.text(`Hello world!`));
        break;
      default:
      // pass
    }
  }
});
```

### Case 4: send notification to the Teams channels which can be configured.
Type bot command `settings` in Teams to select the channels that needs to be notified.

Sample usage:
```ts
await teamsfxBot.forEachAppInstallation(async appInstallation => {
  const settings = await appInstallation.settings;
  for (const channel of await appInstallation.channels) {
    // check if the channel is enabled.
    if (settings[channel.info.id]) {
      await teamsfxBot.notifyChannel(channel, MessageFactory.text(`Hello world!`));
    }
  }
});
```

### Case 5: reply to particular conversation in a subscribed Teams channel.

Sample usage:
```ts
await teamsfxBot.forEachAppInstallation(async appInstallation => {
  const channels = await appInstallation.channels;
  const channel = channels.find(c => c.info.name === "Test");
  if (channel) {
    // send notification as a new conversation.
    const messageId = await teamsfxBot.notifyChannel(channel, MessageFactory.text(`Ping`));

    // send notification as a reply to an existing conversation.
    await teamsfxBot.replyConversation(channel, messageId, MessageFactory.text(`Pong`));
  }
});
```
