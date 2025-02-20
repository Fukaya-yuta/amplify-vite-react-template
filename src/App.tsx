import { useState, useEffect } from "react";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from "aws-amplify";
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

const App = () => {
    const [apiEndpoint, setApiEndpoint] = useState("");
    const [data, setData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [idToken, setIdToken] = useState<string | null>(null);

    const getCurrentUserAsync = async () => {
        try {
            const result = await fetchAuthSession();
            if (result && result.tokens && result.tokens.idToken) {
                setIdToken(result.tokens.idToken.toString());
            } else {
                console.error("Tokens are undefined");
            }
        } catch (err) {
            console.error("Error fetching auth session:", err);
        }
    };

    useEffect(() => {
        const endpoint = outputs.custom.apiGatewayInvokeURL;
        setApiEndpoint(endpoint);
        getCurrentUserAsync();
    }, []);

    const fetchData = async () => {
        try {
            if (!idToken) {
                throw new Error("アクセストークンが取得できませんでした。");
            }

            const response = await fetch(`${apiEndpoint}data?client_id=client_0001&data_name=TEMPERATURE&period=24hours`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`, // Authorizationヘッダーにアクセストークンを含める
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
        <Authenticator>
            {({ signOut, user }) => (
                <div>
                    <h1>Welcome to My App</h1>
                    <p>API Endpoint: {apiEndpoint}</p>
                    <button onClick={fetchData}>Fetch Data</button>
                    {data && <pre>{data}</pre>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <button onClick={signOut}>Sign Out</button>
                    <p>User: {user?.username}</p>
                </div>
            )}
        </Authenticator>
    );
};

export default App;
