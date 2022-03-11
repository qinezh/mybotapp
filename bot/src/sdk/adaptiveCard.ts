import { Activity, CardFactory, StatusCodes } from "botbuilder";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";

export type AdaptiveCard = any;

/**
 * Adaptive card data model bound to the card template.
 */
export interface NotificationCardData {
  title: string,
  appName: string,
  description: string,
  notificationUrl: string
}

export interface DemoCommandCardData {
  firstName?: string,
  lastName?: string,
  age?: number
}

/**
 * Utility method to convert the message data to adaptive card for bot framework.
 * @param getCardData Function to prepare your card data.
 * @param cardTemplate The adaptive card template.
 * @returns A bot activity object attached with adaptive card.
 */
export function buildBotMessage<TData>(getCardData: () => TData, cardTemplate: any): Partial<Activity> {
  const cardData: TData = getCardData();

  // Wrap the message in adaptive card for bot framework
  return {
    attachments: [
      CardFactory.adaptiveCard(
        AdaptiveCards.declare<TData>(cardTemplate).render(cardData)
      )
    ]
  };
}

/**
 * Utility method to build adaptive card without user data
 */
 export function buildBotMessageWithCard(card: any): Partial<Activity> {
  // Wrap the message in adaptive card
  return {
    attachments: [
      CardFactory.adaptiveCard(
        AdaptiveCards.declareWithoutData(card).render()
      )
    ]
  };
}

export function buildAdaptiveCard<TData>(getCardData: () => TData, cardTemplate: any): Partial<Activity> {
  return AdaptiveCards.declare<TData>(cardTemplate).render(getCardData())
}

export function buildAdaptiveCardWithoutData(card: any): Partial<Activity> {
  return AdaptiveCards.declareWithoutData(card).render();
}

export function getInvokeResponse(card: any): any {
  const cardRes = {
    statusCode: StatusCodes.OK,
    type: 'application/vnd.microsoft.card.adaptive',
    value: card
  };

  const res = {
    status: StatusCodes.OK,
    body: cardRes
  };
  return res;
};