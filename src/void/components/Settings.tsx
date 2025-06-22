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
  const [model, setModel] = createSignal(config()?.model || "claude-sonnet-4");
  const [maxSteps, setMaxSteps] = createSignal(Number(config()?.maxSteps) || 5);

  // Update values when config changes
  createEffect(() => {
    setApiUrl(config()?.apiUrl || "");
    setApiKey(config()?.apiKey || "");
    setModel(config()?.model || "claude-sonnet-4");
    setMaxSteps(Number(config()?.maxSteps) || 5);
  });

  const [saved, setSaved] = createSignal(false);
  const handleSave = () => {
    rpcClient
      .call("setConfig", {
        apiUrl: apiUrl(),
        apiKey: apiKey(),
        model: model(),
        maxSteps: maxSteps(),
      })
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

  const handleClearFileSystem = () => {
    rpcClient.call("fs.clear", void 0).subscribe({
      complete: () => {
        // Reload the page after clearing the file system
        window.location.reload();
      },
    });
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

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Model</span>
          </label>
          <input
            type="text"
            placeholder="claude-sonnet-4"
            class="input input-bordered w-full"
            value={model()}
            onInput={(e) => setModel(e.currentTarget.value)}
          />
          <label class="label">
            <span class="label-text-alt">
              The model to use for chat (e.g., gpt-3.5-turbo, claude-sonnet-4)
            </span>
          </label>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">Max Tool Steps</span>
          </label>
          <div class="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={maxSteps()}
              class="range range-primary flex-1"
              onInput={(e) => setMaxSteps(Number(e.currentTarget.value))}
            />
            <input
              type="number"
              min="1"
              max="10"
              value={maxSteps()}
              class="input input-bordered w-16 text-center"
              onInput={(e) => {
                let v = Number(e.currentTarget.value);
                if (v < 1) v = 1;
                if (v > 10) v = 10;
                setMaxSteps(v);
              }}
            />
          </div>
          <label class="label">
            <span class="label-text-alt">
              Maximum number of tool steps the AI can take per message (1-10)
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

        <div class="divider"></div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium text-warning">Danger Zone</span>
          </label>
          <div class="card bg-base-200 p-4">
            <p class="text-sm text-base-content/70 mb-4">
              This will permanently delete all local files and changes stored in
              the browser. This action cannot be undone.
            </p>
            <button
              class="btn btn-error btn-sm w-fit"
              onClick={handleClearFileSystem}
            >
              Clear All Local Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
