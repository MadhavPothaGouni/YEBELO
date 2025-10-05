import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(() => {
    // Fetch or generate latest trade + RSI data
    // Example dummy data, replace with actual API call from Rust backend
    const data = {
      token_address: `Token${Math.floor(Math.random() * 5) + 1}`,
      price_in_sol: parseFloat((Math.random() * 3).toFixed(2)),
      rsi: parseFloat((Math.random() * 100).toFixed(2)),
      block_time: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 2000); // send every 2 seconds

  req.on("close", () => clearInterval(interval));
}
