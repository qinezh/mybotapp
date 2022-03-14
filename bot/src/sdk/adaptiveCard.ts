import { Activity, CardFactory, StatusCodes } from "botbuilder";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";

export type AdaptiveCard = any;

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
 * Utility method to build adaptive card bot message without user data
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

/**
 * Build adaptive card payload with card template and data.
 * @param getCardData Function to prepare your card data.
 * @param cardTemplate The adaptive card template.
 * @returns An adaptive card object.
 */
export function buildAdaptiveCard<TData>(getCardData: () => TData, cardTemplate: any): Partial<Activity> {
  return AdaptiveCards.declare<TData>(cardTemplate).render(getCardData())
}

/**
 * Build adaptive card payload with card template and data.
 * @param card The adaptive card JSON.
 * @returns An adaptive card object.
 */
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