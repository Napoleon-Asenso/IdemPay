type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

export const logger = {
  info: (payload: LogPayload) => log("info", payload),
  warn: (payload: LogPayload) => log("warn", payload),
  error: (payload: LogPayload) => log("error", payload),
  debug: (payload: LogPayload) => log("debug", payload),
};

function log(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    context: payload.context || "IdemPay",
    message: payload.message,
    ...(payload.data ? { data: payload.data } : {}),
    ...(payload.error
      ? {
          error:
            payload.error instanceof Error
              ? {
                  name: payload.error.name,
                  message: payload.error.message,
                }
              : payload.error,
        }
      : {}),
  };

  // Safe structured output without leaking sensitive keys or PAN/CVV
  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}
