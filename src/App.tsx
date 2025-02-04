import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const App = () => {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState("");

  useEffect(() => {
    const endpoint = outputs.custom.apiGatewayInvokeURL;
    setApiEndpoint(endpoint);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('https://chm0clxf5l.execute-api.ap-northeast-1.amazonaws.com/prod/data?client_id=client_0001&data_name=TEMPERATURE&period=24hours', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = await response.json();
      setData(JSON.stringify(result));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setData(null);

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
};

export default App;