"use client";

import { useCallback, useMemo, useState } from "react";
import AgentKitPanel from "@/components/AgentKitPanel";

const AgentKitPage = () => {
  const [theme, setTheme] = useState<string | undefined>("light");

  const handleWidgetAction = useCallback((event: unknown) => {
    console.debug("Agentkit widget action", event);
  }, []);

  const handleResponseEnd = useCallback((event: unknown) => {
    console.debug("Agentkit response end", event);
  }, []);

  const handleThemeRequest = useCallback((event: unknown) => {
    if (
      typeof event === "object" &&
      event !== null &&
      "theme" in event &&
      typeof (event as { theme?: string }).theme === "string"
    ) {
      setTheme((event as { theme?: string }).theme);
    }
  }, []);

  const containerClassName = useMemo(
    () =>
      "flex h-full min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors", // basic container styling
    [],
  );

  return (
    <main className={containerClassName}>
      <div className="flex flex-1 flex-col">
        <AgentKitPanel
          theme={theme}
          onWidgetAction={handleWidgetAction}
          onResponseEnd={handleResponseEnd}
          onThemeRequest={handleThemeRequest}
        />
      </div>
    </main>
  );
};

export default AgentKitPage;
