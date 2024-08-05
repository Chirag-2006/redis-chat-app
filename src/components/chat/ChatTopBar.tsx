import React from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Info, X } from "lucide-react";
import { useSelectedUser } from "@/store/useSelectedUser";

const ChatTopBar = () => {
  const { selectedUser, setSelectedUser } = useSelectedUser();

  return (
    <div className="w-full h-20 flex p-4 items-center justify-between border-b">
      <div className="flex items-center gap-2">
        <Avatar className="flex items-center justify-center">
          <AvatarImage
            src={selectedUser?.image || "/user-placeholder.png"}
            alt="User Image"
            className="size-10 rounded-full object-cover"
          />
        </Avatar>
        <span className="font-medium">{selectedUser?.name}</span>
      </div>
      <div className="flex gap-2">
        <Info className="text-muted-foreground hover:text-primary cursor-pointer" />
        <X
          className="text-muted-foreground hover:text-primary cursor-pointer"
          onClick={() => setSelectedUser(null)}
        />
      </div>
    </div>
  );
};

export default ChatTopBar;
