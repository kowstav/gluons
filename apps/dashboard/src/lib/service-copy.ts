import type { ComponentId } from '@gluons/runtime/client';

// Customer language describes the work, rather than Gluons' implementation or delivery model.
export const serviceCopy: Record<ComponentId, { name: string; description: string }> = {
  'phone-agent': {
    name: 'Customer calls',
    description: 'Capture what a caller needs and prepare an order or reply for your review.',
  },
  'order-taker': {
    name: 'Order handling',
    description: 'Prepare orders using your menu or product catalog and prices.',
  },
  'stock-monitor': {
    name: 'Stock alerts',
    description: 'Flag low stock so you can decide what needs attention.',
  },
  ledger: {
    name: 'Expense records',
    description: 'Prepare expense entries from the amounts and notes you provide.',
  },
  'customer-service': {
    name: 'Customer replies',
    description: 'Draft answers using your business hours and information.',
  },
  'daily-report': {
    name: 'Daily summary',
    description: 'Bring together stock alerts and everyday updates for your review.',
  },
};

export const businessTypeCopy: Record<string, { name: string; description: string }> = {
  'food-vendor': {
    name: 'Food & drink',
    description: 'Help with menu orders, ingredients and customer questions.',
  },
  'retail-shop': {
    name: 'Retail',
    description: 'Help with product orders, shelf stock and customer questions.',
  },
};
