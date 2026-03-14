"use client";

import { useEffect, useState } from "react";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const roleCookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith("hf_role="))
      ?.split("=")[1];
    setRole(roleCookie ?? null);
  }, []);

  return role;
}
