import { useState, useEffect } from 'react';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { defineBackend } from "@aws-amplify/backend";

Amplify.configure(outputs);

const backend = defineBackend({
  auth, 
  data, 
});

const backendOutputs = backend.getOutputs();
console.log(backendOutputs.custom.apiGatewayInvokeURL);

function App() {
  const [apiEndpoint, setApiEndpoint] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setApiEndpoint(backendOutputs.custom.apiGatewayInvokeURL);
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
    }
  };

  return (
    <main>
      <h1>Welcome to My App</h1>
      <p>API Gateway Invoke URL: {apiEndpoint}</p>
      <button onClick={fetchData}>Fetch Data</button>
      {data && <pre>{data}</pre>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}

export default App;