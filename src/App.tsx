import { useEffect, useState } from "react";
import { Auth } from "aws-amplify";

function App() {
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then((user: { username: string }) => setUser(user))
      .catch(() => setUser(null));
  }, []);

  return (
    <main>
      <h1>Welcome to My App</h1>
      {user ? (
        <p>Hello, {user.username}!</p>
      ) : (
        <p>Please log in to see your content.</p>
      )}
    </main>
  );
}

export default App;