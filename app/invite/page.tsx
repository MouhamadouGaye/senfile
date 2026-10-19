"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const NotFound = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);
  return <div></div>;
};

export default NotFound;
