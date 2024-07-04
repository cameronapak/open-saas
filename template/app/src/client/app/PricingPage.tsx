import { useAuth } from 'wasp/client/auth';
import { stripePayment } from 'wasp/client/operations';
import { PaymentPlanId } from '../../shared/constants';
import { AiFillCheckCircle } from 'react-icons/ai';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { cn } from '../../shared/utils';
import { z } from 'zod';

const bestDealPaymentPlanId: PaymentPlanId = PaymentPlanId.SubscriptionPro;

type PaymentPlan = {
  name: string;
  id: PaymentPlanId;
  mode: 'subscription' | 'payment';
  price: string;
  description: string;
  features: string[];
};

export const paymentPlanArr: PaymentPlan[] = [
  {
    name: 'Hobby',
    id: PaymentPlanId.SubscriptionHobby,
    mode: 'subscription',
    price: '$9.99',
    description: 'All you need to get started',
    features: ['Limited monthly usage', 'Basic support'],
  },
  {
    name: 'Pro',
    id: PaymentPlanId.SubscriptionPro,
    mode: 'subscription',
    price: '$19.99',
    description: 'Our most popular plan',
    features: ['Unlimited monthly usage', 'Priority customer support'],
  },
  {
    name: '10 Credits',
    id: PaymentPlanId.Credits10,
    mode: 'payment',
    price: '$9.99',
    description: 'One-time purchase of 10 credits for your account',
    features: ['Use credits for e.g. OpenAI API calls', 'No expiration date'],
  },
];

const PricingPage = () => {
  const [isStripePaymentLoading, setIsStripePaymentLoading] = useState<boolean | string>(false);

  const { data: user, isLoading: isUserLoading } = useAuth();

  const history = useHistory();

  async function handleBuyNowClick(paymentPlanId: PaymentPlanId) {
    if (!user) {
      history.push('/login');
      return;
    }
    try {
      setIsStripePaymentLoading(paymentPlanId);
      let stripeResults = await stripePayment(paymentPlanId);

      if (stripeResults?.sessionUrl) {
        window.open(stripeResults.sessionUrl, '_self');
      }
    } catch (error: any) {
      console.error(error?.message ?? 'Something went wrong.');
    } finally {
      setIsStripePaymentLoading(false);
    }
  }

  const handleCustomerPortalClick = () => {
    if (!user) {
      history.push('/login');
      return;
    }
    try {
      const schema = z.string().url();
      const customerPortalUrl = schema.parse(import.meta.env.REACT_APP_STRIPE_CUSTOMER_PORTAL);
      window.open(customerPortalUrl, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div id='pricing' className='mx-auto max-w-4xl text-center'>
          <h2 className='mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white'>
            Pick your <span className='text-yellow-500'>pricing</span>
          </h2>
        </div>
        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-white'>
          Stripe subscriptions and secure webhooks are built-in. Just add your Stripe Product IDs! Try it out below with
          test credit card number{' '}
          <span className='px-2 py-1 bg-gray-100 rounded-md text-gray-500'>4242 4242 4242 4242 4242</span>
        </p>
        <div className='isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 lg:gap-x-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3'>
          {paymentPlanArr.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col grow justify-between rounded-3xl ring-gray-900/10 dark:ring-gray-100/10 overflow-hidden p-8 xl:p-10',
                {
                  'ring-2': plan.id === bestDealPaymentPlanId,
                  'ring-1 lg:mt-8': plan.id !== bestDealPaymentPlanId,
                }
              )}
            >
              {plan.id === bestDealPaymentPlanId && (
                <div className='absolute top-0 right-0 -z-10 w-full h-full transform-gpu blur-3xl' aria-hidden='true'>
                  <div
                    className='absolute w-full h-full bg-gradient-to-br from-amber-400 to-purple-300 opacity-30 dark:opacity-50'
                    style={{
                      clipPath: 'circle(670% at 50% 50%)',
                    }}
                  />
                </div>
              )}
              <div className='mb-8'>
                <div className='flex items-center justify-between gap-x-4'>
                  <h3 id={plan.id} className='text-gray-900 text-lg font-semibold leading-8 dark:text-white'>
                    {plan.name}
                  </h3>
                </div>
                <p className='mt-4 text-sm leading-6 text-gray-600 dark:text-white'>{plan.description}</p>
                <p className='mt-6 flex items-baseline gap-x-1 dark:text-white'>
                  <span className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white'>{plan.price}</span>
                  <span className='text-sm font-semibold leading-6 text-gray-600 dark:text-white'>
                    {plan.mode === 'subscription' && '/month'}
                  </span>
                </p>
                <ul role='list' className='mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-white'>
                  {plan.features.map((feature) => (
                    <li key={feature} className='flex gap-x-3'>
                      <AiFillCheckCircle className='h-6 w-5 flex-none text-yellow-500' aria-hidden='true' />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {!!user && !!user.subscriptionStatus ? (
                <button
                  onClick={handleCustomerPortalClick}
                  aria-describedby='manage-subscription'
                  className={cn(
                    'mt-8 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400',
                    {
                      'bg-yellow-500 text-white hover:text-white shadow-sm hover:bg-yellow-400':
                        plan.id === bestDealPaymentPlanId,
                      'text-gray-600 ring-1 ring-inset ring-purple-200 hover:ring-purple-400':
                        plan.id !== bestDealPaymentPlanId,
                    }
                  )}
                >
                  Manage Subscription
                </button>
              ) : (
                <button
                  onClick={() => handleBuyNowClick(plan.id)}
                  aria-describedby={plan.id}
                  className={cn(
                    {
                      'bg-yellow-500 text-white hover:text-white shadow-sm hover:bg-yellow-400':
                        plan.id === bestDealPaymentPlanId,
                      'text-gray-600  ring-1 ring-inset ring-purple-200 hover:ring-purple-400':
                        plan.id !== bestDealPaymentPlanId,
                    },
                    {
                      'opacity-50 cursor-wait cursor-not-allowed': isStripePaymentLoading === plan.id,
                    },
                    'mt-8 block rounded-md py-2 px-3 text-center text-sm dark:text-white font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400'
                  )}
                >
                  {!!user ? 'Buy plan' : 'Log in to buy plan'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
