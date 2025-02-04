import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const App = () => {
  const [apiEndpoint, setApiEndpoint] = useState("");

  useEffect(() => {
    const endpoint = outputs.custom.apiGatewayInvokeURL;
    setApiEndpoint(endpoint);
  }, []);

  return (
    <div>
      <p>API Endpoint: {apiEndpoint}</p>
    </div>
  );
};

export default App;