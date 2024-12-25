const express = require("express");
const shortid = require("shortid");
const URL = require("../models/URL");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/create", authMiddleware, async (req, res) => {
  const { originalUrl } = req.body;
  const shortUrl = shortid.generate();
  try {
    const url = new URL({ originalUrl, shortUrl, createdBy: req.user.id });
    await url.save();
    res.json(url);
  } catch (error) {
    res.status(500).json({ message: "Error creating short URL" });
  }
});


router.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const url = await URL.findOne({ shortUrl });
    if (!url) return res.status(404).json({ message: "URL not found" });

    url.clicks++;
    await url.save();
    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({ message: "Error redirecting to URL" });
  }
});

module.exports = router;
