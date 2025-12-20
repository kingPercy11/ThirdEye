import express from "express";

const router = express.Router();

// Debug endpoint to echo request details
router.all("/debug", (req, res) => {
  res.json({
    method: req.method,
    origin: req.headers.origin || null,
    headers: {
      "content-type": req.headers["content-type"] || null,
      referer: req.headers.referer || null,
      "user-agent": req.headers["user-agent"] || null,
    },
    body: req.body || null,
  });
});

export default router;
