"use client";

import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable";
import { cn } from "@/lib/utils";
import SideBar from "../SideBar";
import MessageContainer from "./MessageContainer";
import { User } from "@/db/dummy";
import { useSelectedUser } from "@/store/useSelectedUser";

interface ChatLayoutProps {
  defaultLayout: number[] | undefined;
  users: User[];
}

const ChatLayout = ({ defaultLayout = [320, 480], users }: ChatLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { selectedUser } = useSelectedUser();

  useEffect(() => {
    const cheakScrollWidth = () => {
      setIsMobile(window.innerWidth < 768);
    };

    cheakScrollWidth();

    window.addEventListener("resize", cheakScrollWidth);
    return () => window.removeEventListener("resize", cheakScrollWidth);
  }, []);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full bg-background items-stretch rounded-lg"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsedSize={8}
        collapsible={true}
        minSize={isMobile ? 0 : 24}
        maxSize={isMobile ? 8 : 30}
        onCollapse={() => {
          setIsCollapsed(true);
          document.cookie = `react-resizable-panels:collapsed=true`;
        }}
        onExpand={() => {
          setIsCollapsed(false);
          document.cookie = `react-resizable-panels:collapsed=false`;
        }}
        className={cn(
          isCollapsed && "min-w-[80px] transition-all duration-300 ease-in-out"
        )}
      >
        <SideBar isCollapsed={isCollapsed} users={users} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
        {!selectedUser && (
          <div className="flex justify-center items-center h-full w-full px-10">
            <div className="flex flex-col justify-center items-center gap-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full md:w-2/3 lg:w-1/2"
              />
              <p className="text-muted-foreground text-center">
                click on the chat to view the messages
              </p>
            </div>
          </div>
        )}
        {selectedUser && <MessageContainer />}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ChatLayout;
