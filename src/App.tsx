import { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string | null>(null);

  useEffect(() => {
    // amplify_outputs.jsonファイルを動的に読み込む
    import('../amplify_outputs.json')
      .then((config) => {
        setApiUrl(config.ApiGatewayInvokeURL);
      })
      .catch((err) => {
        setError(`Failed to load API URL: ${err.message}`);
      });
  }, []);

  const fetchData = async () => {
    if (!apiUrl) {
      setError('API URL is not set');
      return;
    }

    try {
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
      <p>Please log in to see your content.</p>
      <button onClick={fetchData}>Fetch Data</button>
      {data && <pre>{data}</pre>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </main>
  );
}

export default App;