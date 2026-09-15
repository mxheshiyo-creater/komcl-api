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
    // Open-source media proxy engine with rotating scraping pool
    const response = await fetch("https://api.snapany.com/v1/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    // Parse download URL from extraction payload
    const directUrl =
      data?.media?.[0]?.url ||
      data?.download_url ||
      data?.url ||
      (Array.isArray(data?.urls) && data.urls[0]) ||
      null;

    if (!directUrl) {
      // Secondary fallback engine
      const fallbackRes = await fetch(`https://api.vkrdownloader.xyz/server?vkr=${encodeURIComponent(url)}`);
      const fallbackData = await fallbackRes.json().catch(() => null);
      const fallbackUrl = fallbackData?.data?.downloads?.[0]?.url || fallbackData?.download;

      if (fallbackUrl) {
        return res.status(200).json({
          success: true,
          download_url: fallbackUrl
        });
      }

      return res.status(404).json({ error: "Media not found or account is private." });
    }

    return res.status(200).json({
      success: true,
      download_url: directUrl
    });
  } catch (err) {
    return res.status(500).json({ error: "Parser timeout. Please try another public post link." });
  }
};

