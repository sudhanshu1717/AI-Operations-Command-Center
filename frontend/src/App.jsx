import { useState, useEffect } from "react";
import axios from "axios";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [optimization, setOptimization] = useState("");
  const [report, setReport] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [warehouseFile, setWarehouseFile] = useState(null);
  const [inventoryFile, setInventoryFile] = useState(null);
  const chartData = metrics?.warehouses || [];
  const inventoryData = metrics?.inventory || [];

useEffect(() => {
  fetchMetrics();
}, []);

const fetchMetrics = async () => {
  const res = await axios.get(
    "https://ai-operations-command-center.onrender.com/metrics"
  );

  setMetrics(res.data);
  setAlerts(res.data.alerts || []);
};

const askAI = async () => {
  try {
    console.log("Question:", question);

    const res = await axios.post(
      "https://ai-operations-command-center.onrender.com/ask",
      {
        question: question,
      }
    );

    console.log(res.data);

    setAnswer(res.data.answer);
     console.log("Answer set successfully");

  } catch (error) {
    console.error("ASK ERROR:", error);

    if (error.response) {
      console.log("Backend Response:", error.response.data);
    }
  }
};
  const runOptimization = async () => {
    const res = await axios.post("https://ai-operations-command-center.onrender.com/optimize");

    setOptimization(res.data.recommendation);
  };
  
  const uploadWarehouse = async () => {

     const formData = new FormData();

     formData.append("file", warehouseFile);

     await axios.post(
       "https://ai-operations-command-center.onrender.com/upload-warehouse",
        formData
        );

  alert("Warehouse CSV Uploaded");

  fetchMetrics();
};


const uploadInventory = async () => {

  const formData = new FormData();

  formData.append("file", inventoryFile);

  await axios.post(
    "https://ai-operations-command-center.onrender.com/upload-inventory",
    formData
  );

  alert("Inventory CSV Uploaded");
};

  const generateReport = async () => {
    const res = await axios.post("https://ai-operations-command-center.onrender.com/decision");

    setReport(res.data.executive_report);
  };
  const downloadPDF = async () => {

  const response = await axios.post(
    "https://ai-operations-command-center.onrender.com/download-report",
    {},
    {
      responseType: "blob"
    }
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data])
  );

  const link = document.createElement("a");

  link.href = url;

  link.setAttribute(
    "download",
    "Operations_Report.pdf"
  );

  document.body.appendChild(link);

  link.click();

  link.remove();
};
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-8">

        <h1 className="text-5xl font-bold text-center mb-3">
          AI Operations Command Center
        </h1>

        <p className="text-center text-slate-400 mb-10">
          Analytics • Optimization • Generative AI
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">

  <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">
    <h2 className="font-bold mb-4">
      Average Utilization
    </h2>

    <div className="text-4xl font-bold text-green-400">
      {metrics?.average_utilization ?? "--"}%
    </div>
  </div>

  <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">
    <h2 className="font-bold mb-4">
      Highest Utilization
    </h2>

    <div className="text-4xl font-bold text-red-400">
      {metrics?.highest_utilization ?? "--"}%
    </div>
  </div>

  <div className="bg-slate-900 p-6 rounded-2xl shadow-lg">
    <h2 className="font-bold mb-4">
      Total Inventory
    </h2>

    <div className="text-4xl font-bold text-blue-400">
      {metrics?.total_stock ?? "--"}
    </div>
  </div>

</div>

<div className="bg-red-950 border border-red-700 p-6 rounded-2xl mb-8">

  <h2 className="text-2xl font-bold text-red-400 mb-4">
    Risk Alerts
  </h2>

  {alerts.length === 0 ? (
    <p className="text-green-400">
      No operational risks detected.
    </p>
  ) : (
    <ul className="space-y-3">

      {alerts.map((alert, index) => (
        <li
          key={index}
          className="bg-slate-900 p-3 rounded-xl"
        >
          {alert}
        </li>
      ))}

    </ul>
  )}

</div>

<div className="bg-slate-900 p-6 rounded-2xl mb-8">

  <h2 className="text-2xl font-bold mb-4">
    Upload Business Data
  </h2>

  <div className="grid md:grid-cols-2 gap-6">

    <div>
      <p className="mb-2">Warehouse CSV</p>

   <input
  type="file"
  className="cursor-pointer"
  onChange={(e) =>
    setWarehouseFile(e.target.files[0])
  }
/>

      <button
        onClick={uploadWarehouse}
        className="mt-3 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 cursor-pointer hover:scale-105 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      >
        Upload Warehouse
      </button>
    </div>

<div className="bg-slate-900 p-6 rounded-2xl mb-8">

  <h2 className="text-2xl font-bold mb-6">
    Warehouse Utilization Analytics
  </h2>

  <div style={{ width: "100%", height: 300 }}>

    <ResponsiveContainer>

      <BarChart data={chartData}>

        <XAxis dataKey="name" />

        <YAxis />

      <Tooltip
  cursor={{ fill: "transparent" }}
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#ffffff"
  }}
/>

       <Bar
  dataKey="utilization"
  fill="#3B82F6"
  radius={[10, 10, 0, 0]}
/>

      </BarChart>

    </ResponsiveContainer>

  </div>

</div>

<div className="bg-slate-900 p-6 rounded-2xl mb-8">

  <h2 className="text-2xl font-bold mb-6">
    Inventory Days of Supply
  </h2>

  <div style={{ width: "100%", height: 300 }}>

    <ResponsiveContainer>

      <BarChart data={inventoryData}>

        <XAxis dataKey="product" />

        <YAxis />

        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "12px",
            color: "#ffffff"
          }}
        />

        <Bar
          dataKey="days_of_supply"
          fill="#10B981"
          radius={[10, 10, 0, 0]}
        />

      </BarChart>

    </ResponsiveContainer>

  </div>

</div>

    <div>
      <p className="mb-2">Inventory CSV</p>

      <input
  type="file"
  className="cursor-pointer"
  onChange={(e) =>
    setInventoryFile(e.target.files[0])
  }
/>

      <button
        onClick={uploadInventory}
        className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 cursor-pointer hover:scale-105 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
      >
        Upload Inventory
      </button>
    </div>

  </div>

</div>

        <div className="bg-slate-900 p-6 rounded-2xl mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Ask Operations AI
          </h2>
          <div className="flex flex-wrap gap-3 mb-4">

  <button
    onClick={() =>
      setQuestion(
        "Demand will increase by 20% next week. Analyze risks and recommend actions."
      )
    }
    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700"
  >
    📈 Analyze Demand Surge
  </button>

  <button
    onClick={() =>
      setQuestion(
        "Analyze inventory health and identify potential stock risks."
      )
    }
    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700"
  >
    📦 Inventory Health
  </button>

  <button
    onClick={() =>
      setQuestion(
        "Evaluate warehouse capacity utilization and recommend optimization opportunities."
      )
    }
    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700"
  >
    🏭 Capacity Planning
  </button>

  <button
    onClick={() =>
      setQuestion(
        "Generate an executive summary of current operations."
      )
    }
    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700"
  >
    📋 Executive Summary
  </button>

</div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-slate-800 rounded-xl p-4"
            rows={4}
            placeholder="Demand will increase by 20% next week. What should management do?"
          />

          <button
            onClick={askAI}
            className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 cursor-pointer hover:scale-105 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            Analyze
          </button>

          {answer && (
            <div className="mt-6 whitespace-pre-wrap bg-slate-800 p-4 rounded-xl">
              {answer}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              Optimization Engine
            </h2>

            <button
              onClick={runOptimization}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 cursor-pointer hover:scale-105 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Run Optimization
            </button>

            {optimization && (
              <div className="mt-4 bg-slate-800 p-4 rounded-xl">
                {optimization}
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">
              Executive Decision Report
            </h2>

            <button
              onClick={generateReport}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 cursor-pointer hover:scale-105 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              Generate Report
            </button>
            <button
               onClick={downloadPDF}
               className="ml-4 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 cursor-pointer hover:scale-105 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
               >
                 Download PDF
            </button>
            {report && (
              <div className="mt-4 whitespace-pre-wrap bg-slate-800 p-4 rounded-xl max-h-96 overflow-auto">
                {report}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;