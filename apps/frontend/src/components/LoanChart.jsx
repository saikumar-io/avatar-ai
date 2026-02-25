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
  if (!analysis) return null;

  const {
    loan_products = [],
    recommended_plan,
    comparison_plan,
    loan_category,
  } = analysis;

  if (!recommended_plan) return null;

  const subtleGlow = isSpeaking
    ? "shadow-[0_0_12px_rgba(197,160,89,0.25)]"
    : "";

  const emiSaving =
    comparison_plan &&
    ((comparison_plan.emi - recommended_plan.emi) /
      comparison_plan.emi) *
      100;

  const interestDifference =
    comparison_plan &&
    (recommended_plan.total_interest -
      comparison_plan.total_interest);

  return (
    <div
      className={`bg-neutral-900 border border-neutral-700 
                  p-6 rounded-2xl mt-6 transition-all duration-500 ${subtleGlow}`}
    >
      {/* HEADER */}
      <h2 className="text-2xl font-bold text-white mb-6">
        {loan_category?.toUpperCase()} Loan Decision Dashboard
      </h2>

      {/* RECOMMENDED PLAN SUMMARY */}
      <div className="bg-neutral-800 p-6 rounded-xl mb-8 border border-neutral-700">
        <h3 className="text-lg font-semibold text-[#c5a059] mb-4">
          Recommended Plan
        </h3>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <Metric label="Plan" value={recommended_plan.type} />
          <Metric
            label="Interest"
            value={`${recommended_plan.interest_rate}%`}
          />
          <Metric
            label="Tenure"
            value={`${recommended_plan.years} yrs`}
          />
          <Metric
            label="Monthly EMI"
            value={`₹ ${recommended_plan.emi}`}
            highlight
          />
        </div>

        <div className="mt-5 text-sm text-neutral-400">
          Selected using composite financial scoring model:
          <div className="mt-2">
            <span className="text-green-400 font-semibold">
              Composite Score: {recommended_plan.composite_score}
            </span>
          </div>
          <div className="mt-1">
            Affordability: {recommended_plan.affordability_score}/100 | 
            Stability: {recommended_plan.cash_flow_stability}/100 | 
            Risk Balance: {recommended_plan.risk_flexibility}/100
          </div>
        </div>
      </div>

      {/* EMI & INTEREST COMPARISON */}
      {comparison_plan && (
        <div className="grid grid-cols-2 gap-6 mb-10">
          <ChartCard title="Monthly EMI Comparison">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[recommended_plan, comparison_plan]}
              >
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="type" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Legend />
                <Bar dataKey="emi" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Total Interest Comparison">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[recommended_plan, comparison_plan]}
              >
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="type" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_interest" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* TRADEOFF ANALYSIS */}
      {comparison_plan && (
        <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 mb-10">
          <h3 className="text-lg font-semibold text-blue-400 mb-4">
            Financial Impact Analysis
          </h3>

          <ul className="text-sm text-neutral-300 space-y-2">
            <li>
              • EMI Change:{" "}
              <span className="text-green-400 font-semibold">
                {emiSaving?.toFixed(2)}%
              </span>
            </li>

            <li>
              • Total Interest Difference:{" "}
              <span className="text-yellow-400 font-semibold">
                ₹ {Math.abs(interestDifference)?.toFixed(2)}
              </span>
            </li>

            <li>
              • Higher composite score indicates better balance across
                affordability and repayment structure.
            </li>
          </ul>
        </div>
      )}

      {/* TREND VISUALIZATION */}
      <ChartCard title="EMI & Interest Trend Across Tenures">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={loan_products}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="years" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="emi"
              stroke="#22c55e"
              strokeWidth={3}
            />
            <Line
              type="monotone"
              dataKey="total_interest"
              stroke="#ef4444"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* STABILITY INDICATORS */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-green-400 mb-4">
          Stability Indicators
        </h3>

        <Indicator
          label="Affordability Score"
          value={recommended_plan.affordability_score}
        />
        <Indicator
          label="Cash Flow Stability"
          value={recommended_plan.cash_flow_stability}
        />
        <Indicator
          label="Risk Flexibility"
          value={recommended_plan.risk_flexibility}
        />
      </div>
    </div>
  );
};

/* ---------- Reusable Components ---------- */

const Metric = ({ label, value, highlight }) => (
  <div>
    <p className="text-neutral-400 text-xs">{label}</p>
    <p className={`font-medium ${highlight ? "text-green-400" : "text-white"}`}>
      {value}
    </p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-neutral-800 p-5 rounded-xl border border-neutral-700">
    <h4 className="text-white font-medium mb-4">{title}</h4>
    {children}
  </div>
);

const Indicator = ({ label, value }) => (
  <div className="mb-5">
    <p className="text-neutral-300 text-sm mb-2">{label}</p>
    <div className="w-full bg-neutral-700 h-3 rounded-full overflow-hidden">
      <div
        className="bg-[#c5a059] h-3 transition-all duration-1000"
        style={{ width: `${value}%` }}
      />
    </div>
    <p className="text-xs text-neutral-400 mt-1">{value} / 100</p>
  </div>
);