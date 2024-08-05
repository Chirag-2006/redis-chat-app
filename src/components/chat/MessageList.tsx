import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useSelectedUser } from "@/store/useSelectedUser";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useQuery } from "@tanstack/react-query";
import { getMessages } from "@/actions/message.actions";
import { useEffect, useRef } from "react";
import MessageSkeleton from "../skeletons/MessageSkeleton";

const MessageList = () => {
  const { selectedUser } = useSelectedUser();
  const { user: currentUser, isLoading: isUserLoading } =
    useKindeBrowserClient();
  const MessageContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading: isMessageLoading } = useQuery({
    queryKey: ["messages", selectedUser?.id],
    queryFn: async () => {
      // exclude the query if the selected user or current user is not available
      if (selectedUser && currentUser) {
        return await getMessages(selectedUser?.id, currentUser?.id);
      }
    },
    enabled: !!selectedUser && !!currentUser && !isUserLoading,
  });

  // scroll to the bottom of the message container when new messages are added
  useEffect(() => {
    if (MessageContainerRef.current) {
      MessageContainerRef.current.scrollTop =
        MessageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={MessageContainerRef}
      className="w-full overflow-y-auto overflow-x-hidden flex flex-col h-full"
    >
      {/* this component ensure that animation applied when item are added to or removed from the list */}
      <AnimatePresence>
        {!isMessageLoading &&
          messages?.map((message, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
              transition={{
                opacity: { duration: 0.1 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration: messages.indexOf(message) * 0.05 + 0.2,
                },
              }}
              style={{
                originX: 0.5,
                originY: 0.5,
              }}
              className={cn(
                "flex flex-col p-4 gap-2 whitespace-pre-wrap",
                message.senderId === currentUser?.id
                  ? "items-end"
                  : "items-start"
              )}
            >
              <div className="flex items-center gap-3">
                {message.senderId === selectedUser?.id && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage
                      src={selectedUser?.image}
                      alt={selectedUser?.name}
                      className="border-2 border-white rounded-full"
                    />
                  </Avatar>
                )}

                {message.messageType === "text" ? (
                  <span className="bg-accent p-3 rounded-md max-w-xs">
                    {message.content}
                  </span>
                ) : (
                  <img
                    src={message.content}
                    alt="Message Image"
                    className=" border p-2 rounded h-40 md:h-52 object-cover"
                  />
                )}

                {message.senderId === currentUser?.id && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage
                      src={currentUser?.picture || "/user-placeholder.svg"}
                      alt={currentUser?.given_name || "User Image"}
                      className="border-2 border-white rounded-full"
                    />
                  </Avatar>
                )}
              </div>
            </motion.div>
          ))}

          {isMessageLoading && (
            <>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
            </>
          )}

      </AnimatePresence>
    </div>
  );
};

export default MessageList;
