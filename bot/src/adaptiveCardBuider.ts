import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import notificationTemplate from "./adaptiveCards/notification-default.json";

/**
 * Adaptive card data model bound to the card template.
 */
export interface CardData {
  title: string,
  appName: string,
  description: string,
  notificationUrl: string
}

/**
 * Utility method to convert the message data to adaptive card
 * @param getCardData Function to prepare your card data.
 * @returns An adaptive card object.
 */
export function buildAdaptiveCard(getCardData: () => CardData): any {
  // Wrap the message in adaptive card
  return AdaptiveCards.declare<CardData>(notificationTemplate).render(getCardData());
}
