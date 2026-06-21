import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Trophy, Swords, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed");
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
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error || "Registration failed");
        return;
      }
      queryClient.setQueryData(["/api/me"], data);
      setLocation("/");
    } catch {
      setRegError("Something went wrong. Try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      {/* Header */}
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

      <Card className="w-full max-w-md bg-card/60 border-white/10 backdrop-blur-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-display text-xl text-white flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Hunter's Guild
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your hunts are saved privately to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
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
                  <Label className="text-slate-300">Password</Label>
                  <Input
                    data-testid="input-login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background/50 border-white/10 text-white placeholder:text-muted-foreground"
                    required
                    autoComplete="current-password"
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
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Username</Label>
                  <Input
                    data-testid="input-register-username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose a hunter name"
                    className="bg-background/50 border-white/10 text-white placeholder:text-muted-foreground"
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Password</Label>
                  <Input
                    data-testid="input-register-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="bg-background/50 border-white/10 text-white placeholder:text-muted-foreground"
                    required
                    autoComplete="new-password"
                  />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
