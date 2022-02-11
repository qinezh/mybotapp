import { TeamsActivityHandler } from "botbuilder";

export class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");
      await next();
    });


    this.onMembersAdded(async (context, next) => {
      console.log("New member added.");
      await next();
    });
  }
}