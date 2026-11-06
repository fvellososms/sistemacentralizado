"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseStoredUserSession } from "@/modules/users";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const existingSession = parseStoredUserSession(localStorage.getItem("rdo_user_session"));
    if (existingSession) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}

