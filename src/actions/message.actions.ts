"use server";

import { Message, messages } from "@/db/dummy";
import { redis } from "@/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { pusherServer } from "@/lib/pusher";

type SendMessageActionArgs = {
  content: string;
  messageType: "text" | "image";
  receiverId: string;
};

export async function sendMessageAction({
  content,
  messageType,
  receiverId,
}: SendMessageActionArgs) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) return { success: false, message: "User not authenticated" };

  const senderId = user.id;

  const conversationId = `conversation:${[senderId, receiverId]
    .sort()
    .join(":")}`;

  const conversationExists = await redis.exists(conversationId);

  if (!conversationExists) {
    await redis.hset(conversationId, {
      participants1: senderId,
      participants2: receiverId,
    });

    await redis.sadd(`user:${senderId}:conversations`, conversationId);
    await redis.sadd(`user:${receiverId}:conversations`, conversationId);
  }

  //   generate a unique message id
  const messageId = `message:${Date.now()}:${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const timestamp = Date.now();

  //   create the message hash
  await redis.hmset(messageId, {
    senderId,
    content,
    messageType,
    timestamp,
  });

  await redis.zadd(`${conversationId}:messages`, {
    score: timestamp,
    member: JSON.stringify(messageId),
  });

  const channelName = `${senderId}__${receiverId}`
    .split("__")
    .sort()
    .join("__");
  await pusherServer?.trigger(channelName, "newMessage", {
    message: {
      senderId,
      content,
      messageType,
      timestamp,
    },
  });

  return { success: true, conversationId, messageId };
}

export async function getMessages(
  selectedUserId: string,
  currentUserId: string
) {
  const conversationId = `conversation:${[selectedUserId, currentUserId]
    .sort()
    .join(":")}`;
  const messageIds = await redis.zrange(`${conversationId}:messages`, 0, -1);
  if (!messageIds.length) return [];

  const pipeline = redis.pipeline();
  messageIds.forEach((messageId) => {
    pipeline.hgetall(messageId as string);
  });

  const messages = (await pipeline.exec()) as Message[];

  return messages;
}
