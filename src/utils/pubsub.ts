import { AppError } from './errors';

const { PubSub, v1 } = require('@google-cloud/pubsub');
import config from './../config';
import logger from './logger';
import { google } from '@google-cloud/pubsub/build/protos/protos';

/**
 * Publish a message to a pubsub topic
 * @param topicNameOrId
 * @param data
 * @param attributes
 * @param requestId
 */
export const publishMessageToPubSubTopic = async (
  topicNameOrId: string,
  data: object,
  attributes: object,
  requestId: string,
) => {
  // Creates a client;
  // TODO:: cache this for further use
  const pubSubClient = new PubSub({ projectId: config.projectId });
  try {
    const messageId = await pubSubClient
      .topic(topicNameOrId)
      .publishMessage({ data: Buffer.from(JSON.stringify(data)), attributes: attributes });
    logger.info(`Message ${messageId} published to ${topicNameOrId}`, { requestId: requestId });
  } catch (error: any) {
    throw new AppError(`Received error while publishing: ${error.message}`);
  }
};

/**
 * pull messages from a pub/sub subscription
 * @param subscriptionNameOrId
 * @param maxMessages
 */
export const pullMessagesFromPubSubTopic = async (
  subscriptionNameOrId: string,
  maxMessages: number = 5,
): Promise<google.pubsub.v1.IReceivedMessage[]> => {
  const messages: google.pubsub.v1.IReceivedMessage[] = [];

  // Creates a client;
  // TODO:: cache this for further use
  const subClient = new v1.SubscriberClient();
  const formattedSubscription =
    subscriptionNameOrId.indexOf('/') >= 0
      ? subscriptionNameOrId
      : subClient.subscriptionPath(config.projectId, subscriptionNameOrId);

  // The maximum number of messages returned for this request.
  const request = {
    subscription: formattedSubscription,
    maxMessages: maxMessages,
  };

  // The subscriber pulls a specified number of messages.
  const [response] = await subClient.pull(request);

  // Process the messages.
  const ackIds = [];
  for (const message of response.receivedMessages || []) {
    messages.push(message);
    if (message.ackId) {
      ackIds.push(message.ackId);
    }
  }

  if (ackIds.length !== 0) {
    logger.info(`Received ${ackIds.length} messages from subscription`);

    // Acknowledge all of the messages. You could also acknowledge
    // these individually, but this is more efficient.
    const ackRequest = {
      subscription: formattedSubscription,
      ackIds: ackIds,
    };

    await subClient.acknowledge(ackRequest);
  }

  return messages;
};
