import {
    TeamsActivityHandler,
    TurnContext,
    SigninStateVerificationQuery,
    BotState,
    MemoryStorage,
    ConversationState,
    UserState,
  } from "botbuilder";
  import { SSODialog } from "./helpers/ssoDialog";
  import { CommandsHelper } from "./helpers/commandHelpler";
  
  export class TeamsBot extends TeamsActivityHandler {
    likeCountObj: { likeCount: number };
    conversationState: BotState;
    userState: BotState;
    dialog: SSODialog;
    dialogState: any;
    commandsHelper: CommandsHelper;
  
    constructor() {
      super();
  
      // record the likeCount
      this.likeCountObj = { likeCount: 0 };
  
      // Define the state store for your bot.
      // See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
      // A bot requires a state storage system to persist the dialog and user state between messages.
      const memoryStorage = new MemoryStorage();
  
      // Create conversation and user state with in-memory storage provider.
      this.conversationState = new ConversationState(memoryStorage);
      this.userState = new UserState(memoryStorage);
      this.dialog = new SSODialog(new MemoryStorage());
      this.dialogState = this.conversationState.createProperty("DialogState");
  
      this.onMessage(async (context, next) => {
        console.log("Running with Message Activity.");
  
        let txt = context.activity.text;
        // remove the mention of this bot
        const removedMentionText = TurnContext.removeRecipientMention(
          context.activity
        );
        if (removedMentionText) {
          // Remove the line break
          txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
        }
  
        // Trigger command by IM text
        await CommandsHelper.triggerCommand(txt, {
          context: context,
          ssoDialog: this.dialog,
          dialogState: this.dialogState,
          likeCount: this.likeCountObj,
        });
  
        // By calling next() you ensure that the next BotHandler is run.
        await next();
      });
    }
  
    async run(context: TurnContext) {
      await super.run(context);
  
      // Save any state changes. The load happened during the execution of the Dialog.
      await this.conversationState.saveChanges(context, false);
      await this.userState.saveChanges(context, false);
    }
  
    async handleTeamsSigninVerifyState(
      context: TurnContext,
      query: SigninStateVerificationQuery
    ) {
      console.log(
        "Running dialog with signin/verifystate from an Invoke Activity."
      );
      await this.dialog.run(context, this.dialogState);
    }
  
    async handleTeamsSigninTokenExchange(
      context: TurnContext,
      query: SigninStateVerificationQuery
    ) {
      await this.dialog.run(context, this.dialogState);
    }
  
    async onSignInInvoke(context: TurnContext) {
      await this.dialog.run(context, this.dialogState);
    }
  }
  