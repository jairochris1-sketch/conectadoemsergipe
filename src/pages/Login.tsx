import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate("/");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={false} />
      <div className="max-w-[400px] mx-auto mt-8 px-2">
        <div className="bg-card border border-border p-4">
          <h2 className="text-[16px] font-bold text-primary mb-3 border-b border-border pb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Login to [ thefacebook ]
          </h2>
          {error && <p className="text-destructive text-[11px] mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
            <div>
              <label className="block font-bold mb-1">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border p-1 text-[11px] bg-card"
                required
                placeholder="your.email@college.edu"
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border p-1 text-[11px] bg-card"
                required
              />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground border-none px-4 py-1 text-[11px] cursor-pointer hover:opacity-90">
              Login
            </button>
          </form>
          <p className="mt-3 text-[11px]">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Demo: mark@harvard.edu / facebook2004
          </p>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Login;
