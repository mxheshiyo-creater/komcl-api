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
    // Clean URL to extract post shortcode
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    const shortcode = parts[parts.length - 1] || parts[parts.length - 2];

    // Request direct public data via Instagram open GraphQL API
    const igFetchUrl = `https://www.instagram.com/graphql/query/?query_hash=b3055c2e470540da1454e421e649174b&variables=${encodeURIComponent(
      JSON.stringify({ shortcode })
    )}`;

    const response = await fetch(igFetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const data = await response.json();
    const mediaData = data?.data?.shortcode_media;

    if (!mediaData) {
      // Fallback method: Direct page stream parser
      const rawPage = await fetch(cleanUrl + "/?__a=1&__d=dis", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      const rawJson = await rawPage.json().catch(() => null);
      const item = rawJson?.items?.[0];

      const directUrl = item?.video_versions?.[0]?.url || item?.image_versions2?.candidates?.[0]?.url;

      if (directUrl) {
        return res.status(200).json({
          success: true,
          download_url: directUrl
        });
      }

      return res.status(404).json({ error: "Media not found or account is private." });
    }

    // Determine if reel/video or image
    const finalMediaUrl = mediaData.is_video ? mediaData.video_url : mediaData.display_url;

    return res.status(200).json({
      success: true,
      download_url: finalMediaUrl
    });

  } catch (err) {
    return res.status(500).json({ error: "Failed to parse public media link." });
  }
};
