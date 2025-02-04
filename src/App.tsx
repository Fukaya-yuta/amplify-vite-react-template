import { Amplify } from "aws-amplify";
import outputs from "amplify_outputs.json";

Amplify.configure(outputs);

const apiEndpoint = outputs.custom.apiGatewayInvokeURL;
console.log("API Endpoint:", apiEndpoint);

const App = () => {
  return (
    <div>
      <h1>Hello, World!</h1>
    </div>
  );
};

export default App;