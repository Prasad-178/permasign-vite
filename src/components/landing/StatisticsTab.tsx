import { useEffect, useState } from "react";
import { getStatisticsClient } from "../../services/statisticsClient";
import { AnimateOnScroll } from "../ui/animate-on-scroll";

interface IStatistics {
  totalRooms: number;
  totalUsers: number;
  totalDocuments: number;
  totalSignatures: number;
}

// In-memory cache for statistics (per SPA session)
let cachedStatistics: IStatistics | null = null;
let cachedStatisticsPromise: Promise<IStatistics> | null = null;

const statisticsConfig = [
  {
    key: "totalSignatures" as keyof IStatistics,
    image: "./signatures.png",
    title: "Digital Signatures",
    description: "Completed"
  },
  {
    key: "totalRooms" as keyof IStatistics,
    image: "./rooms.png",
    title: "Company Spaces",
    description: "Created"
  },
  {
    key: "totalDocuments" as keyof IStatistics,
    image: "./documents.png",
    title: "Documents",
    description: "Uploaded"
  },
  {
    key: "totalUsers" as keyof IStatistics,
    image: "./users.png",
    title: "Users",
    description: "Registered"
  }
];

export const StatisticsTab = () => {
  const [stats, setStats] = useState<IStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // Serve from cache if available
      if (cachedStatistics) {
        setStats(cachedStatistics);
        setLoading(false);
        return;
      }

      // If a request is already in flight, await it
      if (cachedStatisticsPromise) {
        try {
          const data = await cachedStatisticsPromise;
          setStats(data);
        } catch (error) {
          console.error("Error fetching statistics:", error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Otherwise, start a new request and cache the promise
      cachedStatisticsPromise = (async () => {
        const res = await getStatisticsClient();
        if (res && res.success && res.data) {
          cachedStatistics = res.data as IStatistics;
          return cachedStatistics;
        }
        throw new Error("Failed to load statistics");
      })();

      try {
        const data = await cachedStatisticsPromise;
        setStats(data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
        // Clear the promise after resolution; retain the cached data
        cachedStatisticsPromise = null;
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <section className="w-full py-20 md:py-28 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Platform in Numbers
            </h2>
            <p className="text-muted-foreground md:text-xl/relaxed">
              Real metrics from our growing community of professionals
            </p>
          </div>
        </AnimateOnScroll>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading statistics...</span>
            </div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {statisticsConfig.map((config, _) => (
              <AnimateOnScroll 
                key={config.key}
                className="group"
              >
                <div className="relative overflow-hidden rounded-3xl bg-background/60 backdrop-blur-sm border border-border/50 p-8 text-center hover:bg-background/80 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Image container */}
                  <div className="relative mb-6 mx-auto">
                    <img 
                      src={config.image} 
                      alt={config.title}
                      className="w-50 h-50 object-contain filter group-hover:scale-110 transition-transform duration-300 mx-auto"
                    />
                  </div>
                  
                  {/* Statistics */}
                  <div className="relative space-y-3">
                    <div className="text-4xl lg:text-5xl font-bold text-primary group-hover:text-primary/90 transition-colors duration-300">
                      {formatNumber(stats[config.key])}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {config.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Decorative element */}
                  <div className="absolute -top-1 -right-1 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load statistics at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};