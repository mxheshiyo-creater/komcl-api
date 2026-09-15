module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let { url } = req.query;

  if (!url || !url.includes("instagram.com")) {
    return res.status(400).json({ error: "Please provide a valid Instagram link." });
  }

  // URL cleaning
  const cleanUrl = url.split("?")[0].replace(/\/$/, "");

  try {
    // Engine 1: DDInstagram / Instafix Open Gateway
    const ddiUrl = cleanUrl.replace("instagram.com", "ddinstagram.com");
    const ddiRes = await fetch(ddiUrl, {
      headers: {
        "User-Agent": "facebookexternalhit/1.1; Twitterbot/1.0"
      },
      redirect: "follow"
    });

    const html = await ddiRes.text();

    // Extract OpenGraph meta video / image tags
    const videoMatch = html.match(/<meta\s+(?:property|name)="og:video(?::secure_url)?"\s+content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"\s+(?:property|name)="og:video(?::secure_url)?"/i);

    const imageMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"\s+(?:property|name)="og:image"/i);

    const mediaUrl = videoMatch ? videoMatch[1] : (imageMatch ? imageMatch[1] : null);

    if (mediaUrl) {
      // Decode HTML entities like &amp;
      const cleanMediaUrl = mediaUrl.replace(/&amp;/g, "&");
      return res.status(200).json({
        success: true,
        download_url: cleanMediaUrl
      });
    }

    // Engine 2: Fallback direct shortcode resolver
    const shortcode = cleanUrl.split("/").filter(Boolean).pop();
    const fallbackRes = await fetch(`https://instastories.watch/api/v1/post/${shortcode}`).catch(() => null);
    const fallbackData = await fallbackRes?.json().catch(() => null);
    const fallbackUrl = fallbackData?.video_url || fallbackData?.image_url;

    if (fallbackUrl) {
      return res.status(200).json({
        success: true,
        download_url: fallbackUrl
      });
    }

    return res.status(404).json({ error: "Media not found. Ensure the post is public." });

  } catch (err) {
    return res.status(500).json({ error: "Failed to parse public media link." });
  }
};
