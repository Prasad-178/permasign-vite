import { backendURL } from "../types/types";

export const getStatisticsClient = async () => {
  const response = await fetch(`${backendURL}/api/statistics`);
  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }
  return await response.json();
};