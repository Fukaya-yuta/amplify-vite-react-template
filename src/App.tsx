import React, { useState, useEffect } from 'react';
import amplifyOutputs from './amplify_outputs.json';

function App() {
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // amplify_outputs.json から API Gateway の URL を取得
    if (amplifyOutputs.custom && amplifyOutputs.custom.apiGatewayInvokeURL) {
      setApiUrl(amplifyOutputs.custom.apiGatewayInvokeURL);
    }
  }, []);

  return (
    <div>
      <h1>Hello World App</h1>
      <p>API Gateway URL: {apiUrl || '読み込み中...'}</p>
    </div>
  );
}

export default App;
