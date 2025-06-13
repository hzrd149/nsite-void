export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  model?: string; // Optional model field for chat model
  maxSteps?: number; // Maximum number of steps for AI tool usage
}
