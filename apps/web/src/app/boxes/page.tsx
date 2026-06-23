"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BoxesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/draw");
  }, [router]);

  return null;
}
