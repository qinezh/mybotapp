import { BotCommand } from "../helpers/botCommand";
import { ShowUserProfile } from "./showUserProfile";

export const commands: BotCommand[] = [
  new ShowUserProfile()
];
