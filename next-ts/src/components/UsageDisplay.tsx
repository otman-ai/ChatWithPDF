import { useState, useEffect } from "react";
import Link from "next/link";

interface UsageStats {
  plan: "FREE" | "PREMIUM";
  isPremium: boolean;
  documents: {
    current: number;
    max: number;
    canUpload: boolean;
  };
  messages: {
    current: number;
    max: number;
    canSend: boolean;
  };
}

const UsageDisplay = () => {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/usage");
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>;
  }

  if (!usage) {
    return <div>Unable to load usage information</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Usage Overview</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            usage.isPremium
              ? "bg-purple-100 text-purple-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {usage.plan}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>PDF Documents</span>
            <span className="font-medium">
              {usage.documents.current}
              {usage.documents.max === -1
                ? " / ∞"
                : ` / ${usage.documents.max}`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                usage.documents.canUpload ? "bg-green-500" : "bg-red-500"
              }`}
              style={{
                width:
                  usage.documents.max === -1
                    ? "100%"
                    : `${Math.min(
                        (usage.documents.current / usage.documents.max) * 100,
                        100
                      )}%`,
              }}
            ></div>
          </div>
          {!usage.documents.canUpload && (
            <p className="text-red-600 text-sm">
              Document limit reached. Replace existing or upgrade to Premium.
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Messages This Month</span>
            <span className="font-medium">
              {usage.messages.current}
              {usage.messages.max === -1 ? " / ∞" : ` / ${usage.messages.max}`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                usage.messages.canSend ? "bg-green-500" : "bg-red-500"
              }`}
              style={{
                width:
                  usage.messages.max === -1
                    ? "100%"
                    : `${Math.min(
                        (usage.messages.current / usage.messages.max) * 100,
                        100
                      )}%`,
              }}
            ></div>
          </div>
          {!usage.messages.canSend && (
            <p className="text-red-600 text-sm">
              Monthly message limit reached. Upgrade to Premium for unlimited
              messaging.
            </p>
          )}
        </div>
      </div>

      {!usage.isPremium && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Upgrade to Premium</h4>
          <p className="text-blue-700 text-sm mb-3">
            Get unlimited PDF uploads and messages with Premium.
          </p>
          <Link href="/pricing">
            <a className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              Upgrade Now
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default UsageDisplay;
