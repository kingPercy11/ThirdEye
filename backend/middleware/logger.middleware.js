// Simple request logger for debugging incoming requests (headers + body)
export const requestLogger = (req, res, next) => {
  try {
    console.log(`--> ${req.method} ${req.originalUrl}`);
    const debugHeaders = {
      origin: req.headers.origin,
      "content-type": req.headers["content-type"],
      referer: req.headers.referer,
      "user-agent": req.headers["user-agent"],
    };
    console.log("    headers:", debugHeaders);
    if (req.method !== "OPTIONS") {
      console.log("    body:", req.body);
    }
  } catch (e) {
    console.warn("Request logger error:", e);
  }
  next();
};
