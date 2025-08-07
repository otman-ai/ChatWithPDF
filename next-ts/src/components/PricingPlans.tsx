"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { stripePromise } from "@/lib/stripe-client";
import { useUser } from "@/app/contexts/UserContext";
import LoadingAnim from "@/components/LoadingAnim";
import { COLORS } from "@/constants";

const PricingPlans = () => {
  const { user, usage } = useUser();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup");
    }
  }, [status, router]);

  if (status === "loading") return <LoadingAnim />;

  const handleSubscribe = async (priceId: string, planName: string) => {
    setSelectedPlan(planName);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          userId: user?.id,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (stripe) await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setSelectedPlan(null);
    }
  };

  const plans = [
    {
      name: "Free",
      price: 0,
      description: "Perfect for getting started",
      features: [
        "1 PDF document",
        "20 messages per month",
        "Basic AI chat",
        "Community support",
      ],
      buttonText: "Current Plan",
      current: usage?.plan === "FREE",
      disabled: true,
    },
    {
      name: "Starter",
      price: 10,
      priceId: "price_1RgPSWA6n49uMd1tnwoWS4AJ",
      description: "For starters",
      features: [
        "Max of 10 PDF documents",
        "100 messages",
        "Advanced AI features",
        "Priority support",
        "Export conversations",
        "Document history",
      ],
      buttonText:
        usage?.plan === "STARTE"
          ? "Current Plan"
          : "Upgrade to Starter",
      current: usage?.plan === "STARTE",
      popular: true,
      disabled: usage?.plan !== "FREE" && usage?.plan !== "PREMIUM",
    },
    {
      name: "Premium",
      price: 29,
      priceId: "price_1RgPT8A6n49uMd1tAfOGHR7W",
      description: "For power users and professionals",
      features: [
        "Unlimited PDF documents",
        "Unlimited messages",
        "Advanced AI features",
        "Priority support",
        "Export conversations",
        "Document history",
      ],
      buttonText:
        usage?.plan === "PREMIUM"
          ? "Current Plan"
          : "Upgrade to Premium",
      current: usage?.plan === "PREMIUM",
      disabled: usage?.plan !== "FREE" && usage?.plan !== "STARTE",
    },
  ];

  return (
    <div className={`min-h-screen ${COLORS.surface}`}>

            <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-16">

        <h1 className={`text-4xl font-bold mb-4 text-blue-600`}>
          Choose Your Plan
        </h1>
        <p className={`text-xl max-w-2xl mx-auto ${COLORS.textSecondary}`}>
          Start free and upgrade when you need more power. Cancel anytime.
        </p>
      </div>

 

      <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-8 transition-all duration-300 shadow-lg border hover:shadow-xl ${
              plan.current ? "ring-2 ring-blue-600" : "border-slate-700"
            } ${COLORS.primary}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
                Most Popular
              </span>
            )}

            <h3 className={`text-2xl font-bold mb-2 ${COLORS.text}`}>
              {plan.name}
            </h3>
            <p className={`mb-4 ${COLORS.textSecondary}`}>
              {plan.description}
            </p>

            <div className="flex items-end mb-6">
              <span className={`text-5xl font-bold ${COLORS.text}`}>
                ${plan.price}
              </span>
              <span className={`ml-1 ${COLORS.textSecondary}`}>
                /month
              </span>
            </div>

            <ul className="mb-8 space-y-3">
              {plan.features.map((text) => (
                <li 
                  key={text} 
                  className={`flex items-center space-x-3 ${COLORS.textSecondary}`}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={plan.disabled || plan.current || selectedPlan === plan.name}
              onClick={() => handleSubscribe(plan.priceId!, plan.name)}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed ${
                plan.current 
                  ? "bg-gray-300 text-slate-600 cursor-not-allowed" 
                  : plan.popular 
                    ? "bg-blue-600 hover:bg-blue-500 text-white border-2 border-blue-600" 
                    : "bg-slate-700 hover:bg-slate-600 text-white border-2 border-slate-700"
              } ${
                plan.disabled && !plan.current ? "opacity-60" : ""
              }`}
            >
              {plan.current 
                ? "Current Plan" 
                : selectedPlan === plan.name 
                  ? "Processing..." 
                  : plan.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default PricingPlans;