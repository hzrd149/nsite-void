import { createEffect, createSignal, from } from "solid-js";
import { rpc } from "../services/rpc-client";

interface ChatSettingsProps {
  onBack: () => void;
}

export default function ChatSettings(props: ChatSettingsProps) {
  const config = from(rpc.getConfig());

  const [apiUrl, setApiUrl] = createSignal(config()?.apiUrl || "");
  const [apiKey, setApiKey] = createSignal(config()?.apiKey || "");

  // Update values when config changes
  createEffect(() => {
    setApiUrl(config()?.apiUrl || "");
    setApiKey(config()?.apiKey || "");
  });

  const [saved, setSaved] = createSignal(false);
  const handleSave = () => {
    rpc.setConfig({ apiUrl: apiUrl(), apiKey: apiKey() }).subscribe({
      complete: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const handleReset = () => {
    rpc.resetConfig().subscribe();
  };

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">Chat Settings</h2>
        <button class="btn btn-ghost btn-sm btn-circle" onClick={props.onBack}>
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">OpenAI API URL</span>
          </label>
          <input
            type="url"
            placeholder="https://api.openai.com/v1"
            class="input input-bordered w-full"
            value={apiUrl()}
            onInput={(e) => setApiUrl(e.currentTarget.value)}
          />
          <label class="label">
            <span class="label-text-alt">
              The base URL for your OpenAI-compatible API
            </span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">API Key</span>
          </label>
          <input
            type="password"
            placeholder="sk-..."
            class="input input-bordered w-full"
            value={apiKey()}
            onInput={(e) => setApiKey(e.currentTarget.value)}
          />
          <label class="label">
            <span class="label-text-alt">
              Your OpenAI API key (stored locally)
            </span>
          </label>
        </div>

        <div class="flex gap-3">
          <button
            class="btn btn-primary flex-1"
            onClick={handleSave}
            disabled={!apiUrl() || !apiKey()}
          >
            {saved() ? (
              <>
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </button>
          <button class="btn btn-outline" onClick={handleReset}>
            Reset
          </button>
        </div>

        <div class="alert alert-info">
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="text-sm">
            Your API credentials are stored locally in your browser and never
            sent to our servers.
          </span>
        </div>
      </div>
    </div>
  );
}
