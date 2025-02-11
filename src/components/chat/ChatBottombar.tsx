import { AnimatePresence, motion } from "framer-motion";
import {
  Image as ImageIcon,
  Loader,
  SendHorizonal,
  ThumbsUp,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import EmojiPicker from "./EmojiPicker";
import { Button } from "../ui/button";
import useSound from "use-sound";
import { usePreferences } from "@/store/usePreferences";
import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { sendMessageAction } from "@/actions/message.actions";
import { useSelectedUser } from "@/store/useSelectedUser";
import { CldUploadWidget, CloudinaryUploadWidgetInfo } from "next-cloudinary";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import Image from "next/image";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { pusherClient } from "@/lib/pusher";
import { Message } from "@/db/dummy";

const ChatBottombar = () => {
  const [message, setMessage] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedUser } = useSelectedUser();
  const [imgUrl, setImgUrl] = useState("");
  const { user: currentUser } = useKindeBrowserClient();
  const queryClient = useQueryClient();

  const { soundEnabled } = usePreferences();

  const [playSound1] = useSound("/sounds/keystroke1.mp3");
  const [playSound2] = useSound("/sounds/keystroke2.mp3");
  const [playSound3] = useSound("/sounds/keystroke3.mp3");
  const [playSound4] = useSound("/sounds/keystroke4.mp3");

  const [playNotificationSound] = useSound("/sounds/notification.mp3", {
    volume: 0.5,
  });

  const playSoundFuntion = [playSound1, playSound2, playSound3, playSound4];
  const playRandomKeyStrokeSound = () => {
    const randomIdx = Math.floor(Math.random() * playSoundFuntion.length);
    soundEnabled && playSoundFuntion[randomIdx]();
  };

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: sendMessageAction,
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage({
      content: message,
      messageType: "text",
      receiverId: selectedUser?.id!,
    });
    setMessage("");
    textAreaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setMessage(message + "\n");
    }
  };

  useEffect(() => {
    const channelName = `${currentUser?.id}__${selectedUser?.id}`
      .split("__")
      .sort()
      .join("__");
    const channel = pusherClient?.subscribe(channelName);

    const handleNewMessage = (data: { message: Message }) => {
      queryClient.setQueryData(
        ["messages", selectedUser?.id],
        (oldMessages: Message[]) => {
          return [...oldMessages, data.message];
        }
      );

      if (soundEnabled && data.message.senderId !== currentUser?.id) {
        playNotificationSound();
      }
    };

    channel.bind("newMessage", handleNewMessage);

    return () => {
      channel.unbind("newMessage", handleNewMessage);
      pusherClient.unsubscribe(channelName);
    };
  }, [
    currentUser?.id,
    queryClient,
    selectedUser?.id,
    soundEnabled,
    playNotificationSound,
  ]);

  return (
    <div className="p-2 flex justify-between w-full items-center gap-2">
      {!message.trim() && (
        <CldUploadWidget
          signatureEndpoint={"/api/sign-cloudinary-params"}
          onSuccess={(result, { widget }) => {
            setImgUrl((result.info as CloudinaryUploadWidgetInfo).secure_url);
            widget.close();
          }}
        >
          {({ open }) => {
            return (
              <ImageIcon
                size={20}
                onClick={() => open()}
                className="cursor-pointer text-muted-foreground"
              />
            );
          }}
        </CldUploadWidget>
      )}

      <Dialog open={!!imgUrl}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center relative h-96 w-full mx-auto">
            <Image
              src={imgUrl}
              alt="Image Preview"
              className="object-contain"
              fill
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => {
                sendMessage({
                  content: imgUrl,
                  messageType: "image",
                  receiverId: selectedUser?.id!,
                });
                setImgUrl("");
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        <motion.div
          layout
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{
            opacity: { duration: 0.5 },
            layout: {
              type: "spring",
              bounce: 0.15,
            },
          }}
          className="w-full relative"
        >
          <Textarea
            placeholder="Aa"
            autoComplete="off"
            rows={1}
            className="w-full h-9 border rounded-full flex items-center resize-none overflow-hidden bg-background min-h-0"
            value={message}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setMessage(e.target.value);
              playRandomKeyStrokeSound();
            }}
            ref={textAreaRef}
          />
          <div className="absolute right-2 bottom-0.5">
            <EmojiPicker
              onchange={(emoji) => {
                setMessage((message) => message + emoji);
                if (textAreaRef.current) {
                  textAreaRef.current.focus();
                }
              }}
            />
          </div>
        </motion.div>

        {message.trim() ? (
          <Button
            className="size-9 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0"
            variant={"ghost"}
            size={"icon"}
            onClick={handleSendMessage}
          >
            <SendHorizonal size={20} className="text-muted-foreground" />
          </Button>
        ) : (
          <Button
            className="size-9 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0"
            variant={"ghost"}
            size={"icon"}
          >
            {!isPending && (
              <ThumbsUp
                size={20}
                className="text-muted-foreground"
                onClick={() => {
                  sendMessage({
                    content: "👍",
                    messageType: "text",
                    receiverId: selectedUser?.id!,
                  });
                }}
              />
            )}
            {isPending && <Loader size={20} className="animate-spin" />}
          </Button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBottombar;
