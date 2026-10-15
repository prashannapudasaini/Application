export const getDeliveryInfo = () => {
  const now = new Date();
  const currentHour = now.getHours();
  // Cutoff is 7:00 PM (19:00)
  const isAfterCutoff = currentHour >= 19;
  
  const deliveryDate = new Date(now);
  deliveryDate.setDate(now.getDate() + (isAfterCutoff ? 2 : 1));
  
  // Format: "YYYY-MM-DD"
  const estimatedDeliveryDateStr = deliveryDate.toISOString().split('T')[0];
  
  const formattedDate = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return {
    displayText: isAfterCutoff 
      ? `Estimated Delivery: ${formattedDate} Morning` 
      : "Estimated Delivery: Tomorrow Morning",
    estimated_delivery_date: estimatedDeliveryDateStr,
    delivery_time: "7:00 AM - 10:00 AM"
  };
};
