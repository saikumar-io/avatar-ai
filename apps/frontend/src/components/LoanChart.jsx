import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

export const LoanChart = ({ analysis, isSpeaking }) => {
  if (!analysis || !analysis.loan_products) return null;

  const { loan_products, recommended_plan, loan_category } = analysis;

  const glow = isSpeaking
    ? "scale-105 shadow-[0_0_40px_rgba(59,130,246,0.6)]"
    : "scale-100";

  return (
    <div className={`bg-neutral-900 p-6 rounded-2xl mt-6 
                     border border-neutral-700 transition-all duration-700 ${glow}`}>

      <h2 className="text-2xl font-bold text-white mb-6">
        {loan_category.toUpperCase()} Loan Intelligence
      </h2>

      {/* RECOMMENDED PLAN */}
      <div className="bg-blue-900/20 border border-blue-500 
                      rounded-xl p-5 mb-8 transition-all duration-500">

        <h3 className="text-blue-400 font-semibold text-lg mb-3">
          Most Suitable Plan
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-neutral-400">Plan</p>
            <p className="text-white font-medium">{recommended_plan.type}</p>
          </div>
          <div>
            <p className="text-neutral-400">Interest</p>
            <p className="text-white">{recommended_plan.interest_rate}%</p>
          </div>
          <div>
            <p className="text-neutral-400">Tenure</p>
            <p className="text-white">{recommended_plan.years} Years</p>
          </div>
          <div>
            <p className="text-neutral-400">EMI</p>
            <p className="text-green-400 font-semibold">
              ₹ {recommended_plan.emi}
            </p>
          </div>
        </div>

        {/* METERS */}
        <Indicator label="Affordability Score"
          value={recommended_plan.affordability_score} color="bg-green-500" />

        <Indicator label="Cash Flow Stability"
          value={recommended_plan.cash_flow_stability} color="bg-blue-500" />

        <Indicator label="Risk Adjusted Flexibility"
          value={recommended_plan.risk_flexibility} color="bg-purple-500" />
      </div>

      {/* BAR CHART */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={loan_products}>
          <CartesianGrid stroke="#333" />
          <XAxis dataKey="type" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip />
          <Legend />
          <Bar dataKey="emi" fill="#3b82f6" animationDuration={1200} />
          <Bar dataKey="total_interest" fill="#f59e0b" animationDuration={1200} />
        </BarChart>
      </ResponsiveContainer>

      {/* LINE CHART */}
      <div className="mt-10">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={loan_products}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="type" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="emi"
              stroke="#22c55e"
              strokeWidth={3}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="total_interest"
              stroke="#ef4444"
              strokeWidth={3}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

const Indicator = ({ label, value, color }) => (
  <div className="mb-4">
    <p className="text-neutral-300 text-sm mb-1">{label}</p>
    <div className="w-full bg-neutral-700 h-3 rounded-full overflow-hidden">
      <div
        className={`${color} h-3 transition-all duration-1000`}
        style={{ width: `${value}%` }}
      />
    </div>
    <p className="text-xs text-neutral-400 mt-1">{value} / 100</p>
  </div>
);