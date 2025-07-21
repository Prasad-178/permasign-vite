import { useEffect, useState } from "react";
import { getStatisticsClient } from "../../services/statisticsClient";

interface IStatistics {
  totalRooms: number;
  totalUsers: number;
  totalDocuments: number;
  totalSignatures: number;
}

export const StatisticsTab = () => {
  const [stats, setStats] = useState<IStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getStatisticsClient();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto py-12">
      <h2 className="text-3xl font-bold text-center mb-8">PermaSign Statistics</h2>
      {loading ? (
        <p className="text-center">Loading statistics...</p>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-2xl font-semibold">{stats.totalRooms}</h3>
            <p className="text-gray-500">Total Rooms</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-2xl font-semibold">{stats.totalUsers}</h3>
            <p className="text-gray-500">Total Users</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-2xl font-semibold">{stats.totalDocuments}</h3>
            <p className="text-gray-500">Total Documents</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h3 className="text-2xl font-semibold">{stats.totalSignatures}</h3>
            <p className="text-gray-500">Total Signatures</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-red-500">Failed to load statistics.</p>
      )}
    </div>
  );
};