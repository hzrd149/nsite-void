import { createSignal, Match, Switch } from "solid-js";
import { Show } from "solid-js";
import ChatInterface from "./components/Chat";
import ChatSettings from "./components/Settings";
import ServiceWorkerStatus from "./components/ServiceWorkerStatus";

export default function VoidModal() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [currentView, setCurrentView] = createSignal<"chat" | "settings">(
    "chat",
  );
  const [isServiceWorkerReady, setIsServiceWorkerReady] = createSignal(false);

  const openModal = () => {
    setIsOpen(true);
    setCurrentView("chat");
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const showSettings = () => {
    setCurrentView("settings");
  };

  const showChat = () => {
    setCurrentView("chat");
  };

  const handleServiceWorkerReady = () => {
    setIsServiceWorkerReady(true);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div class="fixed bottom-6 right-6 z-50">
        <button
          class="btn btn-primary btn-circle btn-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          onClick={openModal}
          aria-label="Open AI Chat"
        >
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      </div>

      {/* Modal */}
      <div class={`modal ${isOpen() ? "modal-open" : ""}`}>
        <div class="modal-box w-11/12 max-w-4xl h-5/6 max-h-screen flex flex-col p-0 relative">
          {/* Modal Content */}
          <div class="flex-1 overflow-hidden">
            <Show when={isOpen()}>
              <Switch>
                <Match when={!isServiceWorkerReady()}>
                  <ServiceWorkerStatus onReady={handleServiceWorkerReady} />
                </Match>
                <Match when={currentView() === "chat"}>
                  <ChatInterface onSettings={showSettings} />
                </Match>
                <Match when={currentView() === "settings"}>
                  <ChatSettings onBack={showChat} />
                </Match>
              </Switch>
            </Show>
          </div>
        </div>

        {/* Modal backdrop */}
        <div class="modal-backdrop" onClick={closeModal}>
          <button>close</button>
        </div>
      </div>
    </>
  );
}
