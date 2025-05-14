import axios, { AxiosError } from "axios";
import { GenreType } from "@/types/response.types";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Player-related API calls
export const createPlayer = async (playerName: string) => {
  try {
    const response = await axios.post(`${API_URL}/players/create`, {
      player_name: playerName,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getPlayer = async (username: string) => {
  try {
    const response = await axios.get(`${API_URL}/players/${username}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// @souze-san
// ! get genres
export const getGenres = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/genres`);
    return data.genres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    handleApiError(error);
  }
};

// Room-related API calls
export const createRoom = async (playerName: string, topic: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/create-room/${playerName}?topic=${encodeURIComponent(topic)}`
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createCustomRoom = async (playerName: string, topic: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/create-custom-room/${playerName}?topic=${encodeURIComponent(topic)}`
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const joinRoom = async (roomKey: string, playerName: string) => {
  try {
    const response = await axios.post(`${API_URL}/join-room/${roomKey}`, {
      player_name: playerName,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const submitArgument = async (roomKey: string, playerName: string, argument: string) => {
  try {
    const response = await axios.post(`${API_URL}/submit-argument/${roomKey}/${playerName}`, {
      argument,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getRoomStatus = async (roomKey: string) => {
  try {
    const response = await axios.get(`${API_URL}/room-status/${roomKey}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const abortDebate = async (roomKey: string, playerName: string) => {
  try {
    const response = await axios.post(`${API_URL}/abort-debate/${roomKey}/${playerName}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getDebateTopic = async (genre: GenreType) => {
  try {
    const { data } = await axios.get(`${API_URL}/topics/${genre}`);
    return data;
  } catch (error) {
    handleApiError(error);
  }
};

// Error handling helper
const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      detail?: string | { error?: string; valid_genres?: string[] };
    }>;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const detail = axiosError.response.data;

      // Handle structured error responses
      if (typeof detail === "object" && detail !== null) {
        if ("detail" in detail) {
          if (typeof detail.detail === "string") {
            throw { message: detail.detail, status };
          } else if (
            typeof detail.detail === "object" &&
            detail.detail !== null &&
            "error" in detail.detail
          ) {
            throw {
              message: detail.detail.error,
              validGenres: detail.detail.valid_genres,
              status,
            };
          }
        }
      }

      // Generic error with status
      throw { message: "Server error", status };
    }
  }

  // Fallback for non-axios errors
  throw { message: "Network error, please try again", status: 500 };
};
