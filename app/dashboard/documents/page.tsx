"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const DocumentEditor = dynamic(
  () => import("@/components/editor/DocumentEditor"),
  { ssr: false }
);

export default function DocumentsPage() {
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  if (!isLocalhost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Feature Not Available
          </h2>
          <p className="text-gray-500">
            Document Editor is only available in local development mode.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Contact your administrator if you need this feature.
          </p>
        </div>
      </div>
    );
  }

  return <DocumentEditor />;
}
