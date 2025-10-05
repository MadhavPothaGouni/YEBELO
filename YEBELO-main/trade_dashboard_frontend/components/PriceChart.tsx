import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

type TradeData = {
  token_address: string;
  price_in_sol: number;
  block_time: string;
};

type Props = { trades: TradeData[] };

export default function PriceChart({ trades }: Props) {
  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>💰 Price Chart</h2>
      <LineChart width={800} height={300} data={trades}>
        <XAxis dataKey="block_time" />
        <YAxis />
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="price_in_sol" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
