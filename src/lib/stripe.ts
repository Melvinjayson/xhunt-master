import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-05-27.dahlia',
});

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_PRICE_ID ?? '',
};
