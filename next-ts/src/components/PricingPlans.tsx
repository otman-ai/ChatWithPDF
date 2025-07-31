"use client"
import { useState, useEffect } from 'react';
import { stripePromise } from '@/lib/stripe-client';
import {
  UsageStats
} from "@/types/usage";
import {
  PricingPlansProps
} from "@/types/pricing";




const PricingPlans: React.FC<PricingPlansProps> = ({ userId }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setUsageLoading(false);
    }
  };
  if (usageLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="animate-pulse bg-gray-200 h-8 w-64 mx-auto mb-4 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-96 mx-auto rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-96 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }
  const handleSubscribe = async (priceId: string, planName: string) => {
    setLoading(planName);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: 0,
      description: 'Perfect for getting started',
      features: [
        { text: '1 PDF document', icon: '📄' },
        { text: '20 messages per month', icon: '💬' },
        { text: 'Basic AI chat', icon: '🤖' },
        { text: 'Community support', icon: '👥' }
      ],
      limitations: [
        'Limited to 1 PDF file at a time',
        'Monthly message cap of 20',
        'Basic features only'
      ],
      buttonText: 'Current Plan',
      current: usage?.plan !== "STARTE" && usage?.plan !== "PREMIUM"  ,
      
      disabled: true,
    },
    {
      name: 'Starter',
      price: 10,
      priceId: 'price_1RgPSWA6n49uMd1tnwoWS4AJ',
      description: 'For starter',
      features: [
        { text: 'Max of 10 PDF documents', icon: '📚' },
        { text: '100 messages', icon: '💬' },
        { text: 'Advanced AI features', icon: '🚀' },
        { text: 'Priority support', icon: '⚡' },
        { text: 'Export conversations', icon: '📤' },
        { text: 'Document history', icon: '📋' }
      ],
      benefits: [
        'Upload and manage multiple PDFs simultaneously',
        'No limits on AI conversations',
        // 'Access to latest AI models',
        '24/7 priority support'
      ],
      buttonText: usage?.plan !== "FREE" && usage?.plan !== "PREMIUM" ? 'Current Plan' : 'Upgrade to Starter',
      current: usage?.plan !== "FREE" && usage?.plan !== "PREMIUM" ,
      popular: true,
      disabled: usage?.plan !== "FREE" && usage?.plan !== "PREMIUM" ,
    },
    {
      name: 'Premium',
      price: 29,
      priceId: 'price_1RgPT8A6n49uMd1tAfOGHR7W', // Replace with your actual Stripe price ID
      description: 'For power users and professionals',
      features: [
        { text: 'Unlimited PDF documents', icon: '📚' },
        { text: 'Unlimited messages', icon: '💬' },
        { text: 'Advanced AI features', icon: '🚀' },
        { text: 'Priority support', icon: '⚡' },
        { text: 'Export conversations', icon: '📤' },
        { text: 'Document history', icon: '📋' }
      ],
      benefits: [
        'Upload and manage multiple PDFs simultaneously',
        'No limits on AI conversations',
        // 'Access to latest AI models',
        '24/7 priority support'
      ],
      buttonText: usage?.plan !== "FREE" && usage?.plan !== "STARTE"? 'Current Plan'  : 'Upgrade to Premium',
      current: usage?.isPremium,
      popular: false,
      disabled: usage?.plan !== "FREE" && usage?.plan !== "STARTE" ,
    },
  ];



  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start free and upgrade when you need more power. All plans include our core AI chat features.
        </p>
      </div>

      {/* Current Usage Stats */}
      {usage && !usageLoading && (
        <div className="mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Current Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Documents Usage */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">PDF Documents</span>
                <span className="text-sm font-bold text-gray-900">
                  {usage.documents.current}
                  {usage.documents.max === -1 ? ' / ∞' : ` / ${usage.documents.max}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usage.documents.canUpload ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: usage.documents.max === -1 
                      ? '100%' 
                      : `${Math.min((usage.documents.current / usage.documents.max) * 100, 100)}%` 
                  }}
                />
              </div>
              {!usage.documents.canUpload && (
                <p className="text-xs text-red-600 mt-1">Limit reached</p>
              )}
            </div>

            {/* Messages Usage */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Messages This Month</span>
                <span className="text-sm font-bold text-gray-900">
                  {usage.messages.current}
                  {usage.messages.max === -1 ? ' / ∞' : ` / ${usage.messages.max}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usage.messages.canSend ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: usage.messages.max === -1 
                      ? '100%' 
                      : `${Math.min((usage.messages.current / usage.messages.max) * 100, 100)}%` 
                  }}
                />
              </div>
              {!usage.messages.canSend && (
                <p className="text-xs text-red-600 mt-1">Monthly limit reached</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-8 transition-all duration-300 hover:shadow-xl bg-white shadow-lg border border-gray-200 hover:border-blue-300'
             ${plan.current ? 'ring-2 ring-green-500' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {plan.current && (
              <div className="absolute -top-4 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className={`text-2xl font-bold mb-2 text-gray-900`}>
                {plan.name}
              </h3>
              <p className={`mb-4 text-gray-600`}>
                {plan.description}
              </p>
              <div className="flex items-baseline justify-center">
                <span className={`text-5xl font-bold text-gray-900`}>
                  ${plan.price}
                </span>
                <span className={`ml-1 text-gray-600`}>
                  /month
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className={`font-semibold text-gray-900`}>
                Features included:
              </h4>
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <span className="mr-3 text-lg">{feature.icon}</span>
                    <span className={'text-gray-700'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {plan.limitations && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Limitations:</h5>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation, limitIndex) => (
                      <li key={limitIndex} className="text-xs text-gray-500 flex items-center">
                        <span className="mr-2">•</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.benefits && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-600  mb-2">Benefits:</h5>
                  <ul className="space-y-1">
                    {plan.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="text-xs text-gray-500 flex items-center">
                        <span className="mr-2">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => plan.priceId && handleSubscribe(plan.priceId, plan.name.toLowerCase())}
              disabled={plan.disabled || loading === plan.name.toLowerCase()}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-300 ${
                plan.popular
                  ? 'bg-white text-blue-600 hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500'
              } disabled:cursor-not-allowed`}
            >
              {loading === plan.name.toLowerCase() ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                  Loading...
                </div>
              ) : (
                plan.buttonText
              )}
            </button>

            {!plan.popular && !plan.current && plan.name === 'Free' && (
              <p className="text-center text-xs text-gray-500 mt-3">
                You're currently on the free plan
              </p>
            )}
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 bg-gray-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              What happens when I reach my limits?
            </h3>
            <p className="text-gray-600 text-sm">
              On the free plan, you'll need to wait for your monthly message reset or upgrade to Premium. 
              For documents, you can replace your existing PDF with a new one.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Can I cancel anytime?
            </h3>
            <p className="text-gray-600 text-sm">
              Yes! You can cancel your Premium subscription at any time. 
              You'll keep Premium features until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              What file types are supported?
            </h3>
            <p className="text-gray-600 text-sm">
              Currently, we support PDF files up to 10MB in size. 
              More file types coming soon!
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Is my data secure?
            </h3>
            <p className="text-gray-600 text-sm">
              Absolutely. All your documents and conversations are encrypted 
              and stored securely. We never share your data with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;