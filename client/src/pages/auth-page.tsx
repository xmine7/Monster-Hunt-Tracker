import { useState } from "react";
import { useLocation } from "wouter";
import { Trophy, Swords, Shield, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("login");

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginHunterId, setLoginHunterId] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [newlyAssignedId, setNewlyAssignedId] = useState<{ username: string; hunterId: string } | null>(null);

  // Register state
  const [regUsername, setRegUsername] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState<{ username: string; hunterId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, hunterId: loginHunterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }
      // First-time login for old account — show them their new Hunter ID
      if (data.isNewHunterId) {
        setNewlyAssignedId({ username: data.username, hunterId: data.hunterId });
        queryClient.setQueryData(["/api/me"], data);
        return;
      }
      queryClient.setQueryData(["/api/me"], data);
      setLocation("/");
    } catch {
      setLoginError("Something went wrong. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: regUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Registration failed");
        return;
      }
      setRegSuccess({ username: data.username, hunterId: data.hunterId });
    } catch {
      setRegError("Something went wrong. Try again.");
    } finally {
      setRegLoading(false);
    }
  };

  const handleCopyId = () => {
    if (!regSuccess) return;
    navigator.clipboard.writeText(regSuccess.hunterId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToLogin = () => {
    if (!regSuccess) return;
    setLoginUsername(regSuccess.username);
    setLoginHunterId(regSuccess.hunterId);
    setRegSuccess(null);
    setRegUsername("");
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Swords className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold text-white tracking-wide uppercase">
            Hunter's <span className="text-primary">Log</span>
          </h1>
          <Swords className="w-8 h-8 text-primary scale-x-[-1]" />
        </div>
        <p className="text-muted-foreground flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4" />
          MHW Solo Speedrun Tracker
        </p>
      </div>

      {newlyAssignedId && (
        <Card className="w-full max-w-md bg-card/60 border-white/10 backdrop-blur-md mb-4">
          <CardContent className="pt-6 text-center space-y-5">
            <p className="text-sm text-muted-foreground">Welcome back, <span className="text-white font-bold">{newlyAssignedId.username}</span>! A Hunter ID has been assigned to your account:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-mono font-bold text-primary tracking-widest">{newlyAssignedId.hunterId}</span>
              <button onClick={handleCopyId} className="text-muted-foreground hover:text-white transition-colors" title="Copy ID">
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded px-3 py-2">
              ⚠️ Save this — you'll need it along with your username to login from now on!
            </p>
            <Button onClick={() => setLocation("/")} className="w-full bg-primary text-background font-display font-bold tracking-wider">
              Enter the Hunt
            </Button>
          </CardContent>
        </Card>
      )}

      {!newlyAssignedId && <Card className="w-full max-w-md bg-card/60 border-white/10 backdrop-blur-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-display text-xl text-white flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Hunter's Guild
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your hunts are saved privately to your account
          </CardDescription>
          <p className="text-center text-xs text-muted-foreground pt-1">
            🚧 This project is still in development — expect updates!
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background/50 border border-white/10 mb-6">
              <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-background font-bold">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-background font-bold">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Username</Label>
                  <Input
                    data-testid="input-login-username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Your hunter name"
                    className="bg-background/50 border-white/10 text-white placeholder:text-muted-foreground"
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Hunter ID</Label>
                  <Input
                    data-testid="input-login-hunter-id"
                    value={loginHunterId}
                    onChange={(e) => setLoginHunterId(e.target.value)}
                    placeholder="Your 4-digit ID (e.g. 4821)"
                    className="bg-background/50 border-white/10 text-white placeholder:text-muted-foreground font-mono"
                    required
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
                {loginError && (
                  <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                    {loginError}
                  </p>
                )}
                <Button
                  data-testid="button-login"
                  type="submit"
                  className="w-full bg-primary text-background hover:bg-primary/90 font-display font-bold tracking-wider"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Logging in..." : "Enter the Hunt"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              {regSuccess ? (
                <div className="text-center space-y-5 py-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Account created! Your Hunter ID is:</p>
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <span className="text-5xl font-mono font-bold text-primary tracking-widest">{regSuccess.hunterId}</span>
                      <button
                        onClick={handleCopyId}
                        className="text-muted-foreground hover:text-white transition-colors"
                        title="Copy ID"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded px-3 py-2">
                    ⚠️ Save this ID — you'll need it along with your username to login!
                  </p>
                  <Button
                    data-testid="button-proceed-to-login"
                    onClick={handleProceedToLogin}
                    className="w-full bg-primary text-background hover:bg-primary/90 font-display font-bold tracking-wider"
                  >
                    Proceed to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Choose a Username</Label>
                    <Input
                      data-testid="input-register-username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Pick a unique hunter name"
                      className="bg-background/50 border-white/10 text-white placeholder:text-muted-foreground"
                      required
                      autoComplete="username"
                    />
                    <p className="text-xs text-muted-foreground">
                      A unique 4-digit Hunter ID will be assigned to your account — you'll need both to login.
                    </p>
                  </div>
                  {regError && (
                    <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                      {regError}
                    </p>
                  )}
                  <Button
                    data-testid="button-register"
                    type="submit"
                    className="w-full bg-primary text-background hover:bg-primary/90 font-display font-bold tracking-wider"
                    disabled={regLoading}
                  >
                    {regLoading ? "Creating account..." : "Register Hunter"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>}

      <p className="text-xs text-muted-foreground/50 mt-6 text-center">
        Made with <a href="https://replit.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Replit AI</a>
      </p>
    </div>
  );
}
