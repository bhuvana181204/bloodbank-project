import { useEffect, useState } from "react";
import API from "../../services/api";
import bloodprediction from "../../assets/bloodprediction.png";

export default function BloodPrediction() {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get("/prediction/blood-demand")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="card p-4">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <img
          src={bloodprediction}
          className="w-6 h-6 object-contain"
          alt="prediction"
        />
        Blood Demand Prediction
      </h3>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Blood Group</th>
            <th>Predicted Units</th>
            <th>Risk Level</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.bloodGroup}</td>
              <td>{item.predictedDemand}</td>
              <td>
                <span
                  className={
                    item.riskLevel === "HIGH"
                      ? "text-red-600 font-bold"
                      : item.riskLevel === "MEDIUM"
                        ? "text-yellow-600 font-semibold"
                        : "text-green-600"
                  }
                >
                  {item.riskLevel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
