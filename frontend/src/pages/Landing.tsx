import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPlayer, getPlayer } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import PageTransition from "../components/PageTransition";

const Landing: React.FC = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();
  const { showToast, ToastContainer } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      showToast("Please enter a username", "error");
      return;
    }

    setIsLoading(true);

    try {
      // First check if the player already exists
      try {
        await getPlayer(username);
        // Player exists, just log in
        auth.setUsername(username);
        navigate("/dashboard");
        return;
      } catch (error) {
        // Player doesn't exist, we'll create a new one
        if (error.status === 404) {
          await createPlayer(username);
          auth.setUsername(username);
          showToast("Account created successfully!", "success");
          navigate("/dashboard");
        } else {
          throw error; // Rethrow other errors
        }
      }
    } catch (error) {
      console.error("Error:", error);
      showToast(error.message || "An error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-primary">Debate.io</h1>
          <p className="text-muted-foreground mb-8">Join intellectual debates on various topics</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground text-left"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a unique username"
                className="input-field"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? "Checking..." : "Enter Game"}
            </button>
          </form>
        </div>

        <div className="mt-8 glass-panel p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">How to Play</h2>
          <ol className="text-left space-y-2 list-decimal list-inside">
            <li>Enter a unique username to join</li>
            <li>Create a debate room or join an existing one</li>
            <li>Choose a topic or genre to debate</li>
            <li>Take turns presenting your arguments</li>
            <li>The most compelling debater wins!</li>
          </ol>
        </div>
      </div>
      <ToastContainer />
    </PageTransition>
  );
};

export default Landing;
