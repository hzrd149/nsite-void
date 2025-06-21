import { catchError, EMPTY, ignoreElements, of } from "rxjs";
import { createEffect, createSignal, from } from "solid-js";
import { registration$ } from "../services/service-worker";

interface ServiceWorkerStatusProps {
  onReady: () => void;
}

export default function ServiceWorkerStatus(props: ServiceWorkerStatusProps) {
  const registration = from(registration$.pipe(catchError(() => EMPTY)));
  const error = from(
    registration$.pipe(
      ignoreElements(),
      catchError((error) => of(error as Error)),
    ),
  );
  const [showDetails, setShowDetails] = createSignal(false);

  const installing = () => registration()?.installing;
  const waiting = () => registration()?.waiting;
  const active = () => registration()?.active;

  const handleUpdate = () => registration()?.update();
  const handleShowDetails = () => setShowDetails(true);

  createEffect(() => {
    if (active()) props.onReady();
  });

  const getRegistrationState = () => {
    if (installing()) return { status: "registering" };
    if (waiting()) return { status: "updating" };
    if (active()) return { status: "ready" };
    if (error()) return { status: "error", error: error()?.message };
    return { status: "idle" };
  };

  const getStatusMessage = () => {
    const state = getRegistrationState();
    switch (state.status) {
      case "idle":
        return "Initializing chat system...";
      case "registering":
        return "Setting up chat service worker...";
      case "ready":
        return "Chat system ready!";
      case "error":
        return "Failed to initialize chat system";
      case "updating":
        return "Updating chat service worker...";
      default:
        return "Unknown status";
    }
  };

  const getStatusColor = () => {
    const state = getRegistrationState();
    switch (state.status) {
      case "idle":
      case "registering":
      case "updating":
        return "text-info";
      case "ready":
        return "text-success";
      case "error":
        return "text-error";
      default:
        return "text-base-content";
    }
  };

  const getSwInfo = () => {
    const state = getRegistrationState();
    return {
      status: state.status,
      error: state.error,
      registration: registration(),
    };
  };

  return (
    <div class="flex flex-col items-center justify-center h-full p-8">
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          {/* Loading Spinner */}
          {(installing() || waiting()) && (
            <div class="loading loading-spinner loading-lg text-primary mb-4"></div>
          )}

          {/* Success Icon */}
          {active() && (
            <div class="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-success"
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
            </div>
          )}

          {/* Error Icon */}
          {error() && (
            <div class="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-error"
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
            </div>
          )}

          {/* Status Message */}
          <h2 class={`card-title ${getStatusColor()}`}>{getStatusMessage()}</h2>

          {/* Error Details */}
          {getRegistrationState().status === "error" &&
            getRegistrationState().error && (
              <div class="alert alert-error mt-4">
                <svg
                  class="stroke-current shrink-0 w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-sm">{getRegistrationState().error}</span>
              </div>
            )}

          {/* Action Buttons */}
          <div class="card-actions justify-center mt-6">
            {getRegistrationState().status === "error" && (
              <>
                <button
                  class="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>

                <button
                  class="btn btn-ghost btn-sm"
                  onClick={handleShowDetails}
                >
                  Show Details
                </button>
              </>
            )}

            {getRegistrationState().status === "ready" && (
              <button class="btn btn-outline btn-sm" onClick={handleUpdate}>
                Check for Updates
              </button>
            )}
          </div>

          {/* Technical Details Modal */}
          {showDetails() && (
            <div class="modal modal-open">
              <div class="modal-box">
                <h3 class="font-bold text-lg">Service Worker Details</h3>
                <div class="py-4">
                  <pre class="text-xs bg-base-200 p-4 rounded overflow-auto">
                    {JSON.stringify(getSwInfo(), null, 2)}
                  </pre>
                </div>
                <div class="modal-action">
                  <button class="btn" onClick={() => setShowDetails(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress indicator for multiple steps */}
      {getRegistrationState().status === "registering" && (
        <div class="mt-6 text-center">
          <div class="text-sm text-base-content/70">
            This may take a few moments on first load...
          </div>
          <progress class="progress progress-primary w-56 mt-2"></progress>
        </div>
      )}
    </div>
  );
}
