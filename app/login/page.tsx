"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-timber-beige flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-timber-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

