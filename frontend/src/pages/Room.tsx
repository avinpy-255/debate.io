import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoomStatus, submitArgument, abortDebate } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import PageTransition from "../components/PageTransition";
import Header from "../components/Header";

interface RoomData {
  room_key: string;
  topic: string;
  player1_name: string;
  player2_name: string | null;
  status: "waiting" | "in_progress" | "completed" | "aborted";
  current_turn?: string;
  arguments: Record<string, string[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
}

const Room: React.FC = () => {
  const { roomKey } = useParams<{ roomKey: string }>();
  const { username } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [debateMessages, setDebateMessages] = useState<
    {
      player: string;
      argument: string;
    }[]
  >([]);
  const [argument, setArgument] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }
  }, [navigate, username]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchRoomStatus = async () => {
      try {
        const { room, all_arguments } = await getRoomStatus(roomKey);
        setRoomData(room);
        setDebateMessages(all_arguments);
        // console.log("Room data:", data);
        // If the room is completed or aborted, stop polling
        if (room.status === "completed" || room.status === "aborted") {
          setIsPolling(false);
        }
      } catch (error) {
        console.error("Error fetching room status:", error);
        showToast("Failed to fetch room data", "error");
        setIsPolling(false);
      }
    };
    if (!roomKey) {
      showToast("Invalid room key", "error");
      navigate("/dashboard");
      return;
    }
    // Set up polling
    if (isPolling) {
      intervalId = setInterval(fetchRoomStatus, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [roomKey, isPolling, showToast, navigate]);

  // useEffect(() => {
  //   if (messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [roomData?.arguments]);

  const handleSubmitArgument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!argument.trim()) {
      showToast("Please enter your argument", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitArgument(roomKey!, username!, argument);
      setArgument("");

      if (response.status === "completed") {
        showToast("Debate completed!", "success");
      }
    } catch (error) {
      console.error("Error submitting argument:", error);
      showToast(error.message || "Failed to submit argument", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbortDebate = async () => {
    if (!confirm("Are you sure you want to abort this debate? You will receive a penalty.")) {
      return;
    }

    try {
      await abortDebate(roomKey!, username!);
      showToast("Debate aborted", "info");
    } catch (error) {
      console.error("Error aborting debate:", error);
      showToast(error.message || "Failed to abort debate", "error");
    }
  };

  const handleShareRoom = () => {
    navigator.clipboard.writeText(roomKey!);
    showToast("Room key copied to clipboard!", "success");
  };

  const isMyTurn = roomData?.current_turn === username;
  const iAmPlayer1 = roomData?.player1_name === username;
  const iAmPlayer2 = roomData?.player2_name === username;
  const opponent = iAmPlayer1 ? roomData?.player2_name : roomData?.player1_name;

  if (!roomData) {
    return (
      <PageTransition>
        <Header />
        <h1>Wait Here , vagna mattt</h1>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Header />
      <div className="min-h-screen pt-20 p-4">
        <div className="container mx-auto">
          {username ? (
            <div className="space-y-6">
              <div className="glass-panel p-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold line-clamp-1">{roomData.topic}</h1>
                  <div className="flex space-x-2">
                    <button onClick={handleShareRoom} className="btn-secondary py-2 px-3 text-sm">
                      Share Room: {roomKey}
                    </button>
                    {roomData.status === "in_progress" && (
                      <button
                        onClick={handleAbortDebate}
                        className="btn-secondary bg-destructive/10 hover:bg-destructive/20 text-destructive py-2 px-3 text-sm"
                      >
                        Abort Debate
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Status: </span>
                    <span
                      className={`font-medium ${
                        roomData.status === "waiting"
                          ? "text-yellow-500"
                          : roomData.status === "in_progress"
                          ? "text-green-500"
                          : roomData.status === "completed"
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {roomData.status.charAt(0).toUpperCase() + roomData.status.slice(1)}
                    </span>
                  </div>

                  {roomData.status === "in_progress" && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current Turn: </span>
                      <span className="font-medium">
                        {roomData.current_turn === username
                          ? "Your Turn"
                          : `${roomData.current_turn}'s Turn`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 glass-panel p-6">
                  <h2 className="text-xl font-semibold mb-4">Debate</h2>

                  {roomData.status === "waiting" && !roomData.player2_name ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground mb-4">
                        Waiting for an opponent to join...
                      </p>
                      <div className=" animate-pulse bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="debate-messages h-[400px] overflow-y-auto mb-4 p-2">
                        {debateMessages.length > 0 &&
                          debateMessages.map(({ player, argument }, index) => (
                            <div
                              key={index.toString()}
                              className={`debate-message ${
                                username === player
                                  ? "debate-message-player1"
                                  : "debate-message-player2"
                              }`}
                            >
                              <p className="text-xs text-muted-foreground mb-1">
                                {player === username ? "You" : player}
                              </p>
                              <p>{argument}</p>
                            </div>
                          ))}

                        <div ref={messagesEndRef} />
                      </div>

                      {roomData.status === "in_progress" && (
                        <form onSubmit={handleSubmitArgument}>
                          <div className="mb-4">
                            <input
                              type="text"
                              value={argument}
                              onChange={(e) => setArgument(e.target.value)}
                              placeholder={
                                isMyTurn
                                  ? "Enter your argument..."
                                  : "Waiting for opponent to respond..."
                              }
                              className="input-field min-h-[120px]"
                              disabled={!isMyTurn || isSubmitting}
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="btn-primary"
                              disabled={!isMyTurn || isSubmitting}
                            >
                              {isSubmitting ? "Submitting..." : "Submit Argument"}
                            </button>
                          </div>
                        </form>
                      )}

                      {roomData.status === "completed" && roomData.result && (
                        <div className="mt-6 p-4 bg-white/50 rounded-lg">
                          <h3 className="text-lg font-semibold mb-2">Debate Results</h3>
                          <p className="mb-4">
                            Winner:{" "}
                            <span className="font-bold text-primary">{roomData.result.winner}</span>
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">{roomData.player1_name}</h4>
                              <p className="text-sm">
                                Rounds won: {roomData.result.players.player1.rounds_won}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">{roomData.player2_name}</h4>
                              <p className="text-sm">
                                Rounds won: {roomData.result.players.player2.rounds_won}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <button onClick={() => navigate("/dashboard")} className="btn-primary">
                              Back to Dashboard
                            </button>
                          </div>
                        </div>
                      )}

                      {roomData.status === "aborted" && (
                        <div className="mt-6 p-4 bg-destructive/10 rounded-lg">
                          <h3 className="text-lg font-semibold text-destructive mb-2">
                            Debate Aborted
                          </h3>
                          <p className="mb-4">This debate was aborted before completion.</p>
                          <button onClick={() => navigate("/dashboard")} className="btn-primary">
                            Back to Dashboard
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="glass-panel p-6">
                  <h2 className="text-lg font-semibold mb-4">Participants</h2>

                  <div className="space-y-4">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <p className="font-medium">{roomData.player1_name}</p>
                      <p className="text-xs text-muted-foreground">{iAmPlayer1 ? "(You)" : ""}</p>
                      <div className="mt-2">
                        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: roomData.arguments[roomData.player1_name]
                                ? `${(roomData.arguments[roomData.player1_name].length / 5) * 100}%`
                                : "0%",
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-right mt-1">
                          {roomData.arguments[roomData.player1_name]?.length || 0}/5 arguments
                        </p>
                      </div>
                    </div>

                    {roomData.player2_name ? (
                      <div className="p-3 bg-white/50 rounded-lg">
                        <p className="font-medium">{roomData.player2_name}</p>
                        <p className="text-xs text-muted-foreground">{iAmPlayer2 ? "(You)" : ""}</p>
                        <div className="mt-2">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: roomData.arguments[roomData.player2_name]
                                  ? `${
                                      (roomData.arguments[roomData.player2_name].length / 5) * 100
                                    }%`
                                  : "0%",
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-right mt-1">
                            {roomData.arguments[roomData.player2_name]?.length || 0}/5 arguments
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/50 rounded-lg border border-dashed border-muted">
                        <p className="text-muted-foreground">Waiting for opponent...</p>
                      </div>
                    )}
                  </div>

                  {roomData.status === "in_progress" && (
                    <div className="mt-6">
                      <h3 className="text-md font-medium mb-2">Debate Progress</h3>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${
                              (((roomData.arguments[roomData.player1_name]?.length || 0) +
                                (roomData.arguments[roomData.player2_name]?.length || 0)) /
                                10) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-right mt-1">
                        {(roomData.arguments[roomData.player1_name]?.length || 0) +
                          (roomData.arguments[roomData.player2_name]?.length || 0)}
                        /10 total arguments
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[60vh]">
              <div className="text-center">
                <div className="inline-block animate-spin w-10 h-10 border-4 border-primary border-r-transparent rounded-full mb-4"></div>
                <p>Loading room data...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </PageTransition>
  );
};

export default Room;
