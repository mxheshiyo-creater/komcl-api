const ig = require("instagram-url-direct");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url || !url.includes("instagram.com")) {
    return res.status(400).json({ error: "Please provide a valid public Instagram link." });
  }

  try {
    const results = await ig(url);

    if (!results || !results.url_list || results.url_list.length === 0) {
      return res.status(404).json({ error: "Media not found. Ensure account is public." });
    }

    return res.status(200).json({
      success: true,
      download_url: results.url_list[0],
      all_urls: results.url_list
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to parse public media link." });
  }
};

