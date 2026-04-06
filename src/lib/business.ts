import { Order, Table } from '../types';

export const canReleaseTable = (tableOrders: Order[]): boolean => {
  if (tableOrders.length === 0) return true;
  return tableOrders.every(order => order.status === 'delivered');
};

export const getTableStatusFlags = (tableOrders: Order[]) => {
  const hasOrders = tableOrders.length > 0;
  const allPaid = hasOrders && tableOrders.every(o => o.status !== 'pending' && o.status !== 'cancelled');
  const hasPending = tableOrders.some(o => o.status === 'pending');
  const allDelivered = hasOrders && tableOrders.every(o => o.status === 'delivered');
  
  return {
    showPaidFlag: allPaid && !hasPending,
    hasPending,
    allDelivered
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
