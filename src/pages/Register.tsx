import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FacebookHeader from "@/components/FacebookHeader";
import FacebookFooter from "@/components/FacebookFooter";
import { useAuth } from "@/context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes(".edu")) {
      setError("You must use a valid .edu email address.");
      return;
    }
    if (register(name, email, password, school)) {
      navigate("/");
    } else {
      setError("An account with this email already exists.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FacebookHeader isLoggedIn={false} />
      <div className="max-w-[400px] mx-auto mt-8 px-2">
        <div className="bg-card border border-border p-4">
          <h2 className="text-[16px] font-bold text-primary mb-3 border-b border-border pb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Register for [ thefacebook ]
          </h2>
          <p className="text-[11px] text-muted-foreground mb-3">
            Thefacebook is a social directory for college students. You must have a valid .edu email to register.
          </p>
          {error && <p className="text-destructive text-[11px] mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
            <div>
              <label className="block font-bold mb-1">Full Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border p-1 text-[11px] bg-card"
                required
              />
            </div>
            <div>
              <label className="block font-bold mb-1">College Email (.edu):</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border p-1 text-[11px] bg-card"
                required
                placeholder="your.name@college.edu"
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
                minLength={6}
              />
            </div>
            <div>
              <label className="block font-bold mb-1">School:</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full border border-border p-1 text-[11px] bg-card"
                required
                placeholder="Harvard University"
              />
            </div>
            <button type="submit" className="bg-primary text-primary-foreground border-none px-4 py-1 text-[11px] cursor-pointer hover:opacity-90">
              Register
            </button>
          </form>
          <p className="mt-3 text-[11px]">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
      <FacebookFooter />
    </div>
  );
};

export default Register;
