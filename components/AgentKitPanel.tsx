"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatKit, ChatKitProvider } from "@openai/chatkit-react";
import { CREATE_SESSION_ENDPOINT, DEFAULT_CHATKIT_BASE } from "@/lib/config";

const WORKFLOW_STORAGE_KEY = "user_agentkit_workflow_id";
const OPENAI_KEY_STORAGE_KEY = "user_openai_api_key";
const CHATKIT_BASE_STORAGE_KEY = "user_chatkit_api_base";

type AgentKitConfig = {
  workflowId: string;
  openaiApiKey: string;
  chatkitApiBase: string;
};

type AgentKitPanelProps = {
  theme?: unknown;
  onWidgetAction?: (event: unknown) => void;
  onResponseEnd?: (event: unknown) => void;
  onThemeRequest?: (event: unknown) => void;
};

const AgentKitPanel = ({
  theme,
  onWidgetAction,
  onResponseEnd,
  onThemeRequest,
}: AgentKitPanelProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [config, setConfig] = useState<AgentKitConfig>({
    workflowId: "",
    openaiApiKey: "",
    chatkitApiBase: "",
  });
  const [draftConfig, setDraftConfig] = useState<AgentKitConfig>(config);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedWorkflow =
      typeof window !== "undefined"
        ? window.localStorage.getItem(WORKFLOW_STORAGE_KEY) ?? ""
        : "";
    const storedApiKey =
      typeof window !== "undefined"
        ? window.localStorage.getItem(OPENAI_KEY_STORAGE_KEY) ?? ""
        : "";
    const storedBase =
      typeof window !== "undefined"
        ? window.localStorage.getItem(CHATKIT_BASE_STORAGE_KEY) ?? ""
        : "";

    const initialConfig: AgentKitConfig = {
      workflowId: storedWorkflow,
      openaiApiKey: storedApiKey,
      chatkitApiBase: storedBase,
    };

    setConfig(initialConfig);
    setDraftConfig(initialConfig);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!settingsOpen) {
      setDraftConfig(config);
    }
  }, [settingsOpen, config]);

  const persistConfig = useCallback((next: AgentKitConfig) => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(WORKFLOW_STORAGE_KEY, next.workflowId);
    window.localStorage.setItem(OPENAI_KEY_STORAGE_KEY, next.openaiApiKey);

    if (next.chatkitApiBase) {
      window.localStorage.setItem(
        CHATKIT_BASE_STORAGE_KEY,
        next.chatkitApiBase,
      );
    } else {
      window.localStorage.removeItem(CHATKIT_BASE_STORAGE_KEY);
    }
  }, []);

  const handleSaveSettings = useCallback(() => {
    const trimmed: AgentKitConfig = {
      workflowId: draftConfig.workflowId.trim(),
      openaiApiKey: draftConfig.openaiApiKey.trim(),
      chatkitApiBase: draftConfig.chatkitApiBase.trim(),
    };

    setConfig(trimmed);
    persistConfig(trimmed);
    setSettingsOpen(false);
    setSaveMessage("Konfigurace byla uložena.");
    setTimeout(() => setSaveMessage(null), 3000);
  }, [draftConfig, persistConfig]);

  const handleDraftChange = useCallback(
    (field: keyof AgentKitConfig, value: string) => {
      setDraftConfig((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const getClientSecret = useCallback(async () => {
    if (!config.workflowId || !config.openaiApiKey) {
      throw new Error(
        "Pro zahájení konverzace je potřeba zadat workflowId i OPENAI_API_KEY.",
      );
    }

    const response = await fetch(CREATE_SESSION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflowId: config.workflowId,
        openaiApiKey: config.openaiApiKey,
        chatkitApiBase: config.chatkitApiBase || undefined,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        message || "Nepodařilo se vytvořit sezení pro Agentkit chat.",
      );
    }

    const payload = await response.json();
    return payload;
  }, [config]);

  const providerConfig = useMemo(() => {
    return {
      workflowId: config.workflowId,
      baseUrl: config.chatkitApiBase || DEFAULT_CHATKIT_BASE,
    } as Record<string, unknown>;
  }, [config.workflowId, config.chatkitApiBase]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Došlo k neočekávané chybě.");
    }
  }, []);

  const hasRequiredConfig =
    Boolean(config.workflowId) && Boolean(config.openaiApiKey);

  return (
    <div className="flex h-full flex-col bg-white text-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Agentkit chat</h2>
          <p className="text-sm text-gray-500">
            Nastavte vlastní workflow a API klíč pro komunikaci s Agentkitem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage ? (
            <span className="text-sm text-green-600">{saveMessage}</span>
          ) : null}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <span aria-hidden>⚙️</span>
            <span className="ml-2">Nastavení</span>
          </button>
        </div>
      </div>

      {!isHydrated ? (
        <div className="flex flex-1 items-center justify-center px-6 text-sm text-gray-500">
          Načítám konfiguraci...
        </div>
      ) : !hasRequiredConfig ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-gray-600">
          <p className="text-base font-medium">
            Nejprve vyplňte workflowId a OPENAI_API_KEY v sekci Nastavení.
          </p>
          <p className="text-sm">
            Bez těchto hodnot nelze vytvořit sezení a chat zůstane neaktivní.
          </p>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Otevřít nastavení
          </button>
        </div>
      ) : (
        <ChatKitProvider
          config={providerConfig as Record<string, unknown>}
          getClientSecret={async () => {
            try {
              return await getClientSecret();
            } catch (err) {
              handleError(err);
              throw err;
            }
          }}
          theme={theme}
          onWidgetAction={onWidgetAction}
          onResponseEnd={onResponseEnd}
          onThemeRequest={onThemeRequest}
        >
          <div className="flex flex-1">
            <ChatKit
              theme={theme as unknown}
              onWidgetAction={onWidgetAction}
              onResponseEnd={onResponseEnd}
              onThemeRequest={onThemeRequest}
            />
          </div>
        </ChatKitProvider>
      )}

      {error ? (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold">Nastavení Agentkit chatu</h3>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="text-gray-500 transition hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Workflow ID
                </label>
                <input
                  value={draftConfig.workflowId}
                  onChange={(event) =>
                    handleDraftChange("workflowId", event.target.value)
                  }
                  placeholder="např. user_agentkit_workflow_id"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  OPENAI_API_KEY
                </label>
                <input
                  value={draftConfig.openaiApiKey}
                  onChange={(event) =>
                    handleDraftChange("openaiApiKey", event.target.value)
                  }
                  placeholder="např. sk-..."
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  type="password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Volitelná základní URL (CHATKIT_API_BASE)
                </label>
                <input
                  value={draftConfig.chatkitApiBase}
                  onChange={(event) =>
                    handleDraftChange("chatkitApiBase", event.target.value)
                  }
                  placeholder="např. https://api.openai.com/v1/agentkit"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Pokud není vyplněno, použije se výchozí hodnota {DEFAULT_CHATKIT_BASE}.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Uložit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AgentKitPanel;
