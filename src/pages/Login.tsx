import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div className="min-h-screen bg-card">
      {/* Top header bar */}
      <div className="bg-primary">
        <div className="max-w-[760px] mx-auto px-2 py-3 text-center">
          <h1
            className="text-[28px] font-bold text-primary-foreground tracking-[-1px]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            [ thefacebook ]
          </h1>
          <div className="flex justify-center gap-4 text-[11px] mt-1">
            <Link to="/login" className="text-primary-foreground">login</Link>
            <Link to="/register" className="text-primary-foreground">register</Link>
            <a href="#" className="text-primary-foreground">about</a>
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-2 py-3 flex gap-0">
        {/* Left: login form */}
        <div className="w-[140px] shrink-0 border border-border bg-accent p-2 text-[11px]">
          <form onSubmit={handleSubmit} className="space-y-1">
            <div>
              <label className="block font-bold">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border p-[2px] text-[11px] bg-card"
                required
              />
            </div>
            <div>
              <label className="block font-bold">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border p-[2px] text-[11px] bg-card"
                required
              />
            </div>
            {error && <p className="text-destructive text-[10px]">{error}</p>}
            <div className="flex gap-1 pt-1">
              <button type="button" onClick={() => navigate("/register")} className="bg-muted border border-border px-2 py-[2px] text-[11px] cursor-pointer">
                register
              </button>
              <button type="submit" className="bg-muted border border-border px-2 py-[2px] text-[11px] cursor-pointer">
                login
              </button>
            </div>
          </form>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Demo:<br />mark@harvard.edu<br />facebook2004
          </p>
        </div>

        {/* Right: welcome content */}
        <div className="flex-1 border border-border border-l-0 bg-card p-4">
          <div className="border-b border-border pb-1 mb-3">
            <p className="text-[11px] text-primary font-bold">Welcome to Thefacebook!</p>
          </div>

          <h2
            className="text-[18px] font-bold text-foreground mb-3 text-center"
            style={{ fontFamily: "Georgia, serif" }}
          >
            [ Welcome to Thefacebook ]
          </h2>

          <div className="text-[11px] text-foreground space-y-3 max-w-[480px] mx-auto">
            <p>
              Thefacebook is an online directory that connects people through social networks at colleges.
            </p>
            <p>
              We have opened up Thefacebook for popular consumption at <b>Harvard University</b>.
            </p>
            <div>
              <p className="mb-1">You can use Thefacebook to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Search for people at your school</li>
                <li>Find out who are in your classes</li>
                <li>Look up your friends' friends</li>
                <li>See a visualization of your social network</li>
              </ul>
            </div>
            <p>
              To get started, click below to register. If you have already registered, you can log in.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Link to="/register">
                <button className="bg-muted border border-border px-4 py-1 text-[11px] cursor-pointer font-bold">
                  Register
                </button>
              </Link>
              <button
                onClick={() => document.querySelector<HTMLInputElement>('input[type="email"]')?.focus()}
                className="bg-muted border border-border px-4 py-1 text-[11px] cursor-pointer font-bold"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      <FacebookFooter />
    </div>
  );
};

export default Login;
