import { useState } from 'react';
import outputs from './amplify_outputs.json';

function App() {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // API GatewayのURLをamplify_outputs.jsonから動的に取得
      const apiUrl = `${outputs.custom.apiGatewayInvokeURL}data?client_id=client_0001&data_name=TEMPERATURE&period=24hours`;
      
      const response = await fetch(apiUrl, {
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
      {/* API Gateway URLを表示 */}
      <p>API Gateway URL: {outputs.custom.apiGatewayInvokeURL}</p>
      <button onClick={fetchData}>Fetch Data</button>
      {data && <pre>{data}</pre>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}

export default App;
