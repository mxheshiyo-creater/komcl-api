module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let { url } = req.query;

  if (!url || !url.includes("instagram.com")) {
    return res.status(400).json({ error: "Please provide a valid Instagram link." });
  }

  const cleanUrl = url.split("?")[0].replace(/\/$/, "");

  try {
    const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`;
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const result = await response.json().catch(() => null);

    const mediaUrl =
      result?.url ||
      result?.video_url ||
      result?.media?.[0]?.url ||
      result?.data?.url ||
      result?.data?.[0]?.url;

    if (mediaUrl) {
      return res.status(200).json({
        success: true,
        download_url: mediaUrl
      });
    }

    const ddiUrl = cleanUrl.replace("instagram.com", "ddinstagram.com");
    const rawRes = await fetch(ddiUrl, {
      headers: { "User-Agent": "facebookexternalhit/1.1" }
    });
    const html = await rawRes.text();
    const match = html.match(/<meta\s+(?:property|name)="og:video(?::secure_url)?"\s+content="([^"]+)"/i) ||
                  html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i);

    if (match && match[1]) {
      return res.status(200).json({
        success: true,
        download_url: match[1].replace(/&amp;/g, "&")
      });
    }

    return res.status(404).json({ error: "Public media fetch failed. Check post visibility." });
  } catch (err) {
    return res.status(500).json({ error: "Internal processing error." });
  }
};
