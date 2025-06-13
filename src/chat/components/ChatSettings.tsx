import { createEffect, createSignal, from } from "solid-js";
import { config$, rpcClient } from "../services/rpc";
import { CloseIcon } from "./Icons";

interface ChatSettingsProps {
  onBack: () => void;
}

export default function ChatSettings(props: ChatSettingsProps) {
  const config = from(config$);

  const [apiUrl, setApiUrl] = createSignal(config()?.apiUrl || "");
  const [apiKey, setApiKey] = createSignal(config()?.apiKey || "");

  // Update values when config changes
  createEffect(() => {
    setApiUrl(config()?.apiUrl || "");
    setApiKey(config()?.apiKey || "");
  });

  const [saved, setSaved] = createSignal(false);
  const handleSave = () => {
    rpcClient
      .call("setConfig", { apiUrl: apiUrl(), apiKey: apiKey() })
      .subscribe({
        complete: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      });
  };

  const handleReset = () => {
    rpcClient.call("resetConfig", void 0).subscribe();
  };

  return (
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold">Chat Settings</h2>
        <button class="btn btn-ghost btn-sm btn-circle" onClick={props.onBack}>
          <CloseIcon />
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
            {saved() ? "Saved!" : "Save Settings"}
          </button>
          <button class="btn btn-outline" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
