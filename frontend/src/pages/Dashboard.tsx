import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createRoom, createCustomRoom, joinRoom, getGenres, getDebateTopic } from "../services/api";
import { useToast } from "../components/Toast";
import PageTransition from "../components/PageTransition";
import Header from "../components/Header";
import { GenreType } from "@/types/response.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SingleSkeleton from "@/components/SingleSkeleton";

// const GENRES = ["sports", "cinema", "philosophy", "music", "geopolitics", "brainrot"];

const Dashboard: React.FC = () => {
  const { username, playerData, refreshPlayerData } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"join" | "create" | "custom">("join");
  const [GENRES, setGenres] = useState<string[]>([]);
  const [roomKey, setRoomKey] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<GenreType | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [topics, setTopics] = useState<string[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    if (!username) {
      console.log("No username found, redirecting to landing page");
      navigate("/");
    } else {
      refreshPlayerData();
    }
  }, [username, navigate, refreshPlayerData]);

  const fetchGenres = useCallback(async () => {
    try {
      const data = await getGenres();
      setGenres(data);
    } catch (err) {
      console.error("Error in DashBoard:", err);
    }
  }, []); // Dependencies can be added if needed

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]); // Dependency on the memoized function

  // Join Room Handler
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomKey.trim()) {
      showToast("Please enter a room key", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await joinRoom(roomKey, username!);
      showToast("Joined room successfully!", "success");
      navigate(`/room/${roomKey}`);
    } catch (error) {
      console.error("Error joining room:", error);
      showToast(error.message || "Failed to join room", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Create Room Handler

  // This function is used to create Topics on Selected Genre
  const handleTopicGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGenre) {
      showToast("Please select a genre", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { topics } = await getDebateTopic(selectedGenre);
      console.log("Generated Topic:", topics);
      setTopics(topics);
    } catch (error) {
      console.error("Error creating room:", error);
      showToast(error.message || "Failed to create room", "error");
    } finally {
      setIsLoading(false);
    }
  };

  //
  const onTopicSectionChange = (value: string) => {
    setSelectedTopic(value);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) {
      showToast("Please select a genre", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await createRoom(username!, selectedTopic);
      showToast("Room created successfully!", "success");
      navigate(`/room/${response.room_key}`);
    } catch (error) {
      console.error("Error creating room:", error);
      showToast(error.message || "Failed to create room", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customTopic.trim().length < 10) {
      showToast("Topic must be at least 10 characters long", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await createCustomRoom(username!, customTopic);
      showToast("Custom room created successfully!", "success");
      navigate(`/room/${response.room_key}`);
    } catch (error) {
      console.error("Error creating custom room:", error);
      showToast(error.message || "Failed to create custom room", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <Header />
      <div className="min-h-screen pt-20 p-4">
        <div className="container mx-auto">
          {playerData && (
            <div className="glass-panel p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/50 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Score</p>
                  <p className="text-2xl font-bold text-primary">{playerData.total_score || 0}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Wins</p>
                  <p className="text-2xl font-bold text-green-500">{playerData.wins || 0}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Losses</p>
                  <p className="text-2xl font-bold text-destructive">{playerData.losses || 0}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Debates</p>
                  <p className="text-2xl font-bold">
                    {(playerData.wins || 0) + (playerData.losses || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel p-6">
            {/* Tab Navigation Button */}
            <div className="flex border-b border-border mb-6">
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "join"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("join")}
              >
                Join Room
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "create"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("create")}
              >
                Create Room
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "custom"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("custom")}
              >
                Custom Topic
              </button>
            </div>

            <div className="transition-all duration-300">
              {activeTab === "join" && (
                <form onSubmit={handleJoinRoom} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="roomKey" className="block text-sm font-medium">
                      Room Key
                    </label>
                    <input
                      id="roomKey"
                      type="text"
                      value={roomKey}
                      onChange={(e) => setRoomKey(e.target.value.toUpperCase())}
                      placeholder="Enter room key (e.g. A12BCD)"
                      className="input-field"
                      disabled={isLoading}
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={isLoading}>
                    {isLoading ? "Joining..." : "Join Room"}
                  </button>
                </form>
              )}

              {activeTab === "create" && (
                <form className="space-y-6" onSubmit={handleTopicGeneration}>
                  <div className="space-y-2">
                    <label htmlFor="genre" className="block text-sm font-medium">
                      Select Genre
                    </label>
                    <select
                      id="genre"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value as GenreType)}
                      className="input-field"
                      disabled={isLoading}
                    >
                      <option value="">Select a genre</option>
                      {GENRES.length === 0 ? (
                        <option value={null}>No genres available. Please try again later.</option>
                      ) : (
                        GENRES.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        // onClick={handleTopicGeneration}
                        type="submit"
                        className="btn-primary w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating..." : "Create Room"}
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="md:max-w-[600px] sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold">Debate Topic</DialogTitle>
                        <DialogDescription>
                          Choose a Debate Topic from the selected genre.
                        </DialogDescription>
                      </DialogHeader>
                      <RadioGroup defaultValue="comfortable" onValueChange={onTopicSectionChange}>
                        {topics === null ? (
                          <>
                            <SingleSkeleton />
                            <SingleSkeleton />
                            <SingleSkeleton />
                          </>
                        ) : (
                          topics.map((topic) => (
                            <div key={topic} className="flex items-center space-x-2 gap-2">
                              <RadioGroupItem value={topic} id={topic} />
                              <Label htmlFor={topic} className="text-xl">
                                {topic}
                              </Label>
                            </div>
                          ))
                        )}
                      </RadioGroup>
                      <DialogFooter>
                        <Button type="button" onClick={handleCreateRoom}>
                          Submit
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </form>
              )}

              {activeTab === "custom" && (
                <form onSubmit={handleCreateCustomRoom} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="customTopic" className="block text-sm font-medium">
                      Custom Topic
                    </label>
                    <textarea
                      id="customTopic"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Enter a custom debate topic (min. 10 characters)"
                      className="input-field min-h-[100px]"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      {customTopic.length}/10 characters minimum
                    </p>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Custom Room"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </PageTransition>
  );
};

export default Dashboard;
