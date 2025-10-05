import { useEffect, useState } from "react";
import PriceChart from "../components/PriceChart";
import RsiChart from "../components/RsiChart";

type TradeData = {
  token_address: string;
  price_in_sol: number;
  rsi: number;
  block_time: string;
};

export default function Dashboard() {
  const [trades, setTrades] = useState<TradeData[]>([]);

  useEffect(() => {
    const evtSource = new EventSource("/api/stream");

    evtSource.onmessage = (event) => {
      const data: TradeData = JSON.parse(event.data);
      setTrades((prev) => [...prev.slice(-49), data]); // Keep last 50 points
    };

    return () => evtSource.close();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🚀 Real-Time Trade Dashboard</h1>
      <PriceChart trades={trades} />
      <RsiChart trades={trades} />
    </div>
  );
}
