import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const App = () => {
  const [apiEndpoint, setApiEndpoint] = useState("");

  useEffect(() => {
    const endpoint = outputs.custom.apiGatewayInvokeURL;
    setApiEndpoint(endpoint);
    console.log("API Endpoint:", endpoint);
  }, []);

  return (
    <div>
      <h1>Hello, World!</h1>
      <p>API Endpoint: {apiEndpoint}</p>
    </div>
  );
};

export default App;