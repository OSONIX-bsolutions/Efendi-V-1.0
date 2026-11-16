import { SavedOrder } from '../types.ts';

export function getDeliveryTypeDisplay(deliveryType: SavedOrder['customer']['deliveryType']): {
  emoji: string;
  label: string;
} {
  if (deliveryType === 'delivery') {
    return {
      emoji: '🚚',
      label: 'Бурдарасонӣ / Доставка (Delivery)',
    };
  }
  if (deliveryType === 'pickup') {
    return {
      emoji: '🛍️',
      label: 'Бо худ бурдан / Самовывоз (Takeaway)',
    };
  }
  return {
    emoji: '🍽️',
    label: 'Дар ошхона / В заведении (Dine-in)',
  };
}

export function getPaymentDisplay(paymentMethod: SavedOrder['customer']['paymentMethod']): {
  emoji: string;
  label: string;
} {
  if (paymentMethod === 'cash') {
    return {
      emoji: '💵',
      label: 'Нақд / Наличные (Cash)',
    };
  }
  return {
    emoji: '💳',
    label: 'Корт / Картой (Card)',
  };
}

/**
 * Formats an order receipt using relevant UTF-8 emojis for WhatsApp / Plain Text / Webhook.
 */
export function formatOrderReceiptText(
  order: SavedOrder,
  currency: string,
  itemNotesMap?: Record<string, string>
): string {
  const delivery = getDeliveryTypeDisplay(order.customer.deliveryType);
  const payment = getPaymentDisplay(order.customer.paymentMethod);
  const addressEmoji = order.customer.deliveryType === 'dine_in' ? '🪑' : '📍';
  const addressLabel =
    order.customer.deliveryType === 'dine_in'
      ? 'Миз / Table'
      : 'Суроға / Address';

  const itemsSummary = order.items
    .map((it, idx) => {
      const note = itemNotesMap?.[it.id];
      return `➤ ${idx + 1}. ${it.name} × ${it.quantity} = *${it.subtotal} ${currency}*${
        note ? ` (📝 ${note})` : ''
      }`;
    })
    .join('\n');

  const orderTime = new Date(order.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const channelLine =
    order.channel === 'whatsapp'
      ? '✦ *Канал / Channel:* WhatsApp'
      : order.channel === 'telegram'
      ? '✦ *Канал / Channel:* Telegram'
      : '✦ *Канал / Channel:* Direct In-App';

  return [
    `★ *ФАРМОИШИ НАВ / NEW ORDER: ${order.orderNumber}*`,
    '━━━━━━━━━━━━━━━━━━━━',
    `▸ *Мизоҷ / Name:* ${order.customer.name}`,
    `▸ *Телефон / Phone:* ${order.customer.phone}`,
    `▸ *Навъ / Order type:* ${delivery.label}`,
    `▸ *${addressLabel}:* ${order.customer.addressOrTable}`,
    `▸ *Пардохт / Payment:* ${payment.label}`,
    channelLine,
    ...(order.customer.orderNotes
      ? [`◆ *Эзоҳ / Kitchen Notes:* ${order.customer.orderNotes}`]
      : []),
    '',
    '❖ *ТАОМҲО / ORDER ITEMS:*',
    itemsSummary,
    '━━━━━━━━━━━━━━━━━━━━',
    `✦ *ҲАМАГӢ / TOTAL: ${order.total} ${currency}*`,
    `* *Вақт / Time:* ${orderTime}`,
  ].join('\n');
}

