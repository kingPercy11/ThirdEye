// CORS middleware with proper origin check and error handling
const allowedOrigin = (origin) => {
  if (!origin) return true; // Allow non-browser requests like curl or postman
  return (
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1")
  );
};

export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigin(origin)) {
    console.warn("Blocked CORS request from origin:", origin);
    return res.status(403).json({ error: "Not allowed by CORS" });
  }
  // Set CORS headers for allowed origins
  if (origin && allowedOrigin(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Origin, Accept"
    );
  }

  if (req.method === "OPTIONS") {
    // Preflight request
    return res.sendStatus(204);
  }
  next();
};
