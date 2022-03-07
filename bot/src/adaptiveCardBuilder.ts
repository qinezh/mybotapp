import { Activity, CardFactory } from "botbuilder";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import notificationTemplate from "./adaptiveCards/notification-default.json";
import notificationWithListTemplate from "./adaptiveCards/notification-list.json";

/****** Card Data Model and Message Builder for notification-default.json template **********/
/**
 * Adaptive card data model
 */
export interface CardData {
  title: string,
  appName: string,
  description: string,
  notificationUrl: string
}

/**
 * Utility method to comvert the message data to adaptive card
 */
export function buildBotMessage(getCardData: () => CardData): Partial<Activity> {
  // Get notification raw data
  const cardData = getCardData();

  // Wrap the message in adaptive card
  return {
    attachments: [
      CardFactory.adaptiveCard(
        AdaptiveCards.declare<CardData>(notificationTemplate).render(cardData)
      )
    ]
  };
}

/****** Card Data Model and Message Builder for notification-list.json template **********/
/**
 * Adaptive card data model
 */
 export interface CardDataWithList {
  title: string,
  appName: string,
  description: string,
  notificationUrl: string,
  data: string[]
}

/**
 * Utility method to comvert the message data to adaptive card
 */
export function buildBotMessageWithList(getCardData: () => CardDataWithList): Partial<Activity> {
  // Get notification raw data
  const cardData = getCardData();

  // Wrap the message in adaptive card
  return {
    attachments: [
      CardFactory.adaptiveCard(
        AdaptiveCards.declare<CardData>(notificationWithListTemplate).render(cardData)
      )
    ]
  };
}
