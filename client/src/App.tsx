import type { FormEvent } from "react";
import LoginPage from "./components/auth/LoginPage";

function App() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return <LoginPage onSubmit={handleSubmit} />;
}

export default App;