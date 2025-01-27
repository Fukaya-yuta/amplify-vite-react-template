import { useState } from 'react';

function App() {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('https://YOUR_API_GATEWAY_ID.execute-api.ap-northeast-1.amazonaws.com/dev/data', {
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
      <p>Please log in to see your content.</p>
      <button onClick={fetchData}>Fetch Data</button>
      {data && <pre>{data}</pre>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}

export default App;