module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  let { url } = req.query;

  if (!url || !url.includes("instagram.com")) {
    return res.status(400).json({ error: "Please provide a valid public Instagram link." });
  }

  // Tracking parameters (?igsh=..., ?stkn=...) ko saaf karna
  url = url.split("?")[0].trim();

  // Engine 1: Delirius API
  try {
    const res1 = await fetch(`https://delirius-api-oficial.vercel.app/api/download/instagram?url=${encodeURIComponent(url)}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data1 = await res1.json().catch(() => null);
    const media1 = data1?.data?.[0]?.url || data1?.data?.url;
    if (media1) {
      return res.status(200).json({ success: true, download_url: media1 });
    }
  } catch (e) {}

  // Engine 2: Siputzx Fast Engine
  try {
    const res2 = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`);
    const data2 = await res2.json().catch(() => null);
    const media2 = data2?.data?.[0]?.url || data2?.data?.url;
    if (media2) {
      return res.status(200).json({ success: true, download_url: media2 });
    }
  } catch (e) {}

  // Engine 3: SnapAny Core
  try {
    const res3 = await fetch("https://api.snapany.com/v1/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data3 = await res3.json().catch(() => null);
    const media3 = data3?.media?.[0]?.url || data3?.download_url;
    if (media3) {
      return res.status(200).json({ success: true, download_url: media3 });
    }
  } catch (e) {}

  return res.status(404).json({ error: "Media not found. Verify that the account is public." });
};
