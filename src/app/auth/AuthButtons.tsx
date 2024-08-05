"use client";

import { Button } from "@/components/ui/button";
import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import React, { useState } from "react";

const AuthButtons = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex flex-1 gap-3 flex-col md:flex-row relative z-50 ">
      <RegisterLink className="flex-1" onClick={() => setIsLoading(true)}>
        <Button className="w-full" variant={"outline"} disabled={isLoading}>
          Sign up
        </Button>
      </RegisterLink>

      <LoginLink className="flex-1" onClick={() => setIsLoading(true)}>
        <Button className="w-full" disabled={isLoading}>
          Login
        </Button>
      </LoginLink>
    </div>
  );
};

export default AuthButtons;
