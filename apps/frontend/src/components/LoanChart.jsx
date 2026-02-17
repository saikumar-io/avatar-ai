import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#FF8042"];

export const LoanChart = ({ analysis }) => {
  if (!analysis) return null;

  const data = [
    { name: "Principal", value: analysis.total_payment - analysis.total_interest },
    { name: "Interest", value: analysis.total_interest },
  ];

  return (
    <div className="bg-neutral-800 p-4 rounded-xl mt-4">
      <h2 className="text-lg mb-2 font-semibold">Loan Breakdown</h2>

      <p className="mb-2">EMI: ₹ {analysis.emi}</p>
      <p className="mb-2">Total Interest: ₹ {analysis.total_interest}</p>
      <p className="mb-4">Total Payment: ₹ {analysis.total_payment}</p>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
