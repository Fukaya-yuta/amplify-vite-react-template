import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';
import outputs from '@/amplify_outputs.json';

Amplify.configure(outputs);

interface ResponseData {
  time: Date;
  value: number;
  clientId: string;
}

const now = new Date();
const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

function App() {
  const { signOut } = useAuthenticator();
  const [chartData1, setChartData1] = useState<ResponseData[]>([]);
  const [chartData2, setChartData2] = useState<ResponseData[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function invokeLambda() {
    async function fetchLambda(clientId: string) {
      const apiUrl = `https://0c1s69z3nj.execute-api.ap-northeast-1.amazonaws.com/dev/data`;

      const queryParams = new URLSearchParams({
        client_id: clientId,
        data_name: "TEMPERATURE",
        period: "24hours"
      });

      const response = await fetch(`${apiUrl}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.map((item: any) => ({
        time: new Date(item.time),
        value: item.value,
        clientId: clientId
      }));
    }

    try {
      const [dataClient1, dataClient2] = await Promise.all([
        fetchLambda('client_0001'),
        fetchLambda('client_0002')
      ]);

      setChartData1(dataClient1);
      setChartData2(dataClient2.filter((d: ResponseData) => d.time >= twentyFourHoursAgo));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    invokeLambda();
  }, []);

  const formatXAxis = (tickItem: Date) => {
    const date = new Date(tickItem);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const combinedChartData = [...chartData1, ...chartData2];

  return (
    <main>
      <h1>Temperature Data</h1>
      <button onClick={invokeLambda}>Fetch Data</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ width: '50%', margin: '0 auto' }}>
        <ResponsiveContainer width={600} height={400}>
          <LineChart data={chartData1}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <RechartsLine type="monotone" dataKey="value" name="Client 0001" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ width: '50%', margin: '0 auto' }}>
        <ResponsiveContainer width={600} height={400}>
          <LineChart data={combinedChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={formatXAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <RechartsLine type="monotone" dataKey="value" name="Client 0001" stroke="#8884d8" />
            <RechartsLine type="monotone" dataKey="value" name="Client 0002" stroke="#82ca9d"
              dot={false}
              isAnimationActive={false}
              connectNulls={true}
              hide={!chartData2.length}
              data={chartData2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}

export default App;