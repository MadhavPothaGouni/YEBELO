import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from "recharts";

type TradeData = {
  token_address: string;
  rsi: number;
  block_time: string;
};

type Props = { trades: TradeData[] };

export default function RsiChart({ trades }: Props) {
  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>📈 RSI Chart</h2>
      <LineChart width={800} height={300} data={trades}>
        <XAxis dataKey="block_time" />
        <YAxis domain={[0, 100]} />
        <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
        <Tooltip />
        <Legend />
        <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" />
        <ReferenceLine y={30} stroke="green" strokeDasharray="3 3" />
        <Line type="monotone" dataKey="rsi" stroke="#82ca9d" />
      </LineChart>
    </div>
  );
}
