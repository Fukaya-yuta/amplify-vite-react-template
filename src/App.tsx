import React, { useState, useEffect } from 'react';
import path from 'path';
import fs from 'fs';

const amplifyOutputPath = path.join(__dirname, '../amplify/backend/amplify-output.json');
let amplifyOutputs = {};

if (fs.existsSync(amplifyOutputPath)) {
    amplifyOutputs = require(amplifyOutputPath);
} else {
    console.error("amplify-output.json が見つかりません");
}

function App() {
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // amplify-output.json から API Gateway の URL を取得
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
