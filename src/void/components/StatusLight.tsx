import { catchError, of } from "rxjs";
import { createMemo, createSignal, from, Show } from "solid-js";
import { registration$ } from "../services/service-worker";

interface StatusLightProps {
  isLoading?: () => boolean;
}

type ServiceWorkerStatus = "installing" | "active" | "stopped" | "error";
type ChatStatus = "idle" | "loading";

interface OverallStatus {
  swStatus: ServiceWorkerStatus;
  chatStatus: ChatStatus;
  color: "green" | "yellow" | "red";
  isBlinking: boolean;
  message: string;
  details?: string;
}

export default function StatusLight(props: StatusLightProps) {
  const [showTooltip, setShowTooltip] = createSignal(false);

  // Create a signal that includes error state
  const registrationState = from(
    registration$.pipe(
      catchError((err) => {
        console.error("Service worker error:", err);
        return of({ error: err });
      }),
    ),
  );

  // Compute service worker status
  const swStatus = createMemo((): ServiceWorkerStatus => {
    const state = registrationState();

    // Check if it's an error state
    if (state && "error" in state) return "error";

    // Check registration states
    const reg = state as ServiceWorkerRegistration | null;
    if (!reg) return "stopped";
    if (reg.installing) return "installing";
    if (reg.waiting) return "installing";
    if (reg.active) return "active";
    return "stopped";
  });

  // Compute chat status
  const chatStatus = createMemo((): ChatStatus => {
    return props.isLoading?.() ? "loading" : "idle";
  });

  // Compute overall status
  const status = createMemo((): OverallStatus => {
    const sw = swStatus();
    const chat = chatStatus();

    // Determine color and blinking
    let color: "green" | "yellow" | "red" = "green";
    let isBlinking = false;
    let message = "";
    let details = "";

    // Service worker status determines base color
    if (sw === "error" || sw === "stopped") {
      color = "red";
      message =
        sw === "error" ? "Service Worker Error" : "Service Worker Stopped";
      details =
        sw === "error"
          ? "Failed to initialize chat system"
          : "Chat system is not running";
    } else if (sw === "installing") {
      color = "yellow";
      message = "Service Worker Installing";
      details = "Setting up chat system...";
    } else if (sw === "active") {
      color = "green";
      message = "Service Worker Active";
      details = "Chat system is ready";
    }

    // Chat loading state adds blinking
    if (chat === "loading" && sw === "active") {
      isBlinking = true;
      message = "Processing Request";
      details = "Waiting for AI response...";
    }

    return {
      swStatus: sw,
      chatStatus: chat,
      color,
      isBlinking,
      message,
      details,
    };
  });

  const tooltipContent = createMemo(() => {
    const s = status();
    return (
      <div class="text-sm">
        <div class="font-semibold">{s.message}</div>
        {s.details && <div class="text-xs opacity-80 mt-1">{s.details}</div>}
        <div class="text-xs opacity-60 mt-2">
          <div>Service Worker: {s.swStatus}</div>
          <div>Chat: {s.chatStatus}</div>
        </div>
      </div>
    );
  });

  return (
    <div class="relative inline-block">
      <div
        class="status-light cursor-pointer"
        classList={{
          "status-green": status().color === "green",
          "status-yellow": status().color === "yellow",
          "status-red": status().color === "red",
          "status-blinking": status().isBlinking,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={status().message}
      />

      <Show when={showTooltip()}>
        <div class="absolute left-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-1">
          <div class="bg-base-200 text-base-content rounded-lg shadow-lg p-3 min-w-[200px] border border-base-300">
            {tooltipContent()}
          </div>
        </div>
      </Show>
    </div>
  );
}
