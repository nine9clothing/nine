import React, { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

const ConfirmingOrder = () => {
  const { clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [message, setMessage] = useState('Confirming your order... Please wait.');
  const [isError, setIsError] = useState(false);
  const hasProcessedOrder = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const processOrder = async () => {
      if (hasProcessedOrder.current || !isMounted) return;
      hasProcessedOrder.current = true;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !user) {
        console.error('User session missing during confirmation:', sessionError?.message);
        setMessage('Error: User session issue. Please log in and try again. Redirecting...');
        setIsError(true);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      const pendingOrderDataString = sessionStorage.getItem('pendingOrderData');
      if (!pendingOrderDataString) {
        console.error('No pending order data found.');
        const { data: existingOrder, error: fetchError } = await supabase
          .from('orders')
          .select('order_id, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingOrder && existingOrder.status === 'placed') {
          setMessage('Order already processed! Redirecting to success page...');
          clearCart();
          sessionStorage.removeItem('pendingOrderData');
          setTimeout(() => navigate('/success'), 3000);
          return;
        }

        setMessage('Error: Order data is missing. Redirecting to cart...');
        setIsError(true);
        setTimeout(() => navigate('/cart'), 3000);
        return;
      }

      let orderData;
      try {
        orderData = JSON.parse(pendingOrderDataString);
      } catch (e) {
        console.error('Failed to parse order data:', e);
        setMessage('Error: Invalid order data. Redirecting to cart...');
        setIsError(true);
        setTimeout(() => navigate('/cart'), 3000);
        return;
      }

      if (user.id !== orderData.user_id) {
        console.error('User session mismatch during confirmation.');
        setMessage('Error: User session issue. Please log in and try again. Redirecting...');
        setIsError(true);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      const {
        user_id,
        order_id,
        total,
        total_amount,
        discount,
        shipping_charges,
        cod_fee,
        items: orderItems,
        status,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_pincode,
        shipping_details,
        shipping_status,
        display_order_id,
        courier_id,
        courier_name,
        estimated_delivery,
        payment_method,
        payment_id,
        promoDetails,
      } = orderData;

      try {
        const dbOrderPayload = {
          user_id,
          order_id,
          display_order_id,
          total,
          total_amount,
          discount,
          shipping_charges,
          cod_fee,
          items: orderItems,
          status,
          shipping_status,
          payment_method,
          payment_id,
          shipping_name,
          shipping_phone,
          shipping_address,
          shipping_city,
          shipping_pincode,
          shipping_details,
          courier_id,
          courier_name,
          estimated_delivery,
        };

        const { data: insertedOrder, error: orderInsertError } = await supabase
          .from('orders')
          .insert([dbOrderPayload])
          .select();

        if (orderInsertError) {
          if (orderInsertError.code === '23505') {
            console.warn(`Order ${order_id} already exists in database.`);
            const { data: existingOrder, error: fetchError } = await supabase
              .from('orders')
              .select('id')
              .eq('order_id', order_id)
              .single();

            if (fetchError || !existingOrder) {
              console.error('Duplicate order detected but not found in database:', fetchError);
              setMessage('Error: Duplicate order detected but not found. Contact support.');
              setIsError(true);
              setTimeout(() => navigate('/checkout'), 3000);
              return;
            }

            setMessage('Order already processed! Redirecting to success page...');
            clearCart();
            sessionStorage.removeItem('pendingOrderData');
            setTimeout(() => navigate('/success'), 3000);
            return;
          }
          console.error('Supabase order insert error:', orderInsertError);
          sessionStorage.setItem(
            'orderConfirmationError',
            `Critical: Order placed with shipper but failed to save locally. Ref ${order_id}. Contact support. Error: ${orderInsertError.message}`
          );
          setMessage('Error: Failed to save order. Contact support. Redirecting...');
          setIsError(true);
          setTimeout(() => navigate('/checkout'), 3000);
          return;
        }
        console.log('Order inserted into Supabase:', insertedOrder);

        // Update stock
        for (const item of orderItems) {
          const { sku, selectedSize, units } = item;
          if (!selectedSize) {
            console.warn(`No size selected for item SKU ${sku}, skipping stock update.`);
            continue;
          }
          try {
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('size, name')
              .eq('id', sku)
              .single();

            if (productError) throw productError;
            if (!productData) {
              console.warn(`Product SKU ${sku} not found for stock update.`);
              continue;
            }

            let currentSizes;
            try {
              currentSizes = typeof productData.size === 'string' ? JSON.parse(productData.size) : (productData.size || {});
            } catch (parseError) {
              console.error(`Error parsing size data for SKU ${sku}:`, parseError.message);
              continue;
            }

            const currentStock = parseInt(currentSizes[selectedSize] || 0, 10);

            if (currentStock < units) {
              throw new Error(
                `Insufficient stock for ${productData.name} (SKU ${sku}, Size ${selectedSize}). Ordered: ${units}, Available: ${currentStock}.`
              );
            }

            const newStock = currentStock - units;
            const updatedSizes = { ...currentSizes, [selectedSize]: newStock };

            const { error: updateError } = await supabase
              .from('products')
              .update({ size: updatedSizes })
              .eq('id', sku);

            if (updateError) throw updateError;
            console.log(`Stock updated for ${productData.name} (SKU ${sku}, Size ${selectedSize}): ${currentStock} -> ${newStock}`);

            // Update promo code usage
        if (promoDetails) {
          try {
            const promoId = promoDetails.id;
            const userId = user.id;

            const { data: promoData, error: promoDetailsError } = await supabase
              .from('promocodes')
              .select('used, limit, max_uses_per_user')
              .eq('id', promoId)
              .single();

            if (promoDetailsError) {
              console.error('Error fetching promo details:', {
                message: promoDetailsError.message,
                code: promoDetailsError.code,
                details: promoDetailsError.details
              });
            } else if (!promoData) {
              console.error('No promo details found for promo ID:', promoId);
            } else {
              const usedCount = promoData.used || 0;
              const limitCount = promoData.limit;
              const maxUsesPerUser = promoData.max_uses_per_user;

              if (limitCount && usedCount >= limitCount) {
                console.warn(`Promo code ${promoId} has reached its total usage limit.`);
                setMessage('Error: Promo code has reached its usage limit. Redirecting to cart...');
                setIsError(true);
                setTimeout(() => navigate('/cart'), 3000);
                return;
              }

              // Update overall promo usage
              const { error: overallUpdateError } = await supabase
                .from('promocodes')
                .update({ used: usedCount + 1 })
                .eq('id', promoId);

              if (overallUpdateError) {
                console.error('Error updating promo used count:', {
                  message: overallUpdateError.message,
                  code: overallUpdateError.code,
                  details: overallUpdateError.details
                });
              }

              // Update user-specific promo usage
              const { data: userUsageData, error: userUsageFetchError } = await supabase
                .from('promo_usage')
                .select('usage_count')
                .eq('user_id', userId)
                .eq('promo_code_id', promoId)
                .maybeSingle();

              if (userUsageFetchError) {
                console.error('Error fetching user promo usage:', {
                  message: userUsageFetchError.message,
                  code: userUsageFetchError.code,
                  details: userUsageFetchError.details
                });
              }

              if (userUsageData) {
                if (maxUsesPerUser && userUsageData.usage_count >= maxUsesPerUser) {
                  console.warn(`User ${userId} has reached max uses for promo ${promoId}.`);
                  setMessage('Error: You have reached the usage limit for this promo code. Redirecting to cart...');
                  setIsError(true);
                  setTimeout(() => navigate('/cart'), 3000);
                  return;
                }

                const { error: userUpdateError } = await supabase
                  .from('promo_usage')
                  .update({ usage_count: userUsageData.usage_count + 1 })
                  .eq('user_id', userId)
                  .eq('promo_code_id', promoId);

                if (userUpdateError) {
                  console.error('Error updating user promo usage:', {
                    message: userUpdateError.message,
                    code: userUpdateError.code,
                    details: userUpdateError.details
                  });
                }
              } else {
                const { error: userInsertError } = await supabase
                  .from('promo_usage')
                  .insert({ user_id: userId, promo_code_id: promoId, usage_count: 1 });

                if (userInsertError) {
                  console.error('Error inserting user promo usage:', {
                    message: userInsertError.message,
                    code: userInsertError.code,
                    details: userInsertError.details
                  });
                }
              }
            }
          } catch (promoError) {
            console.error('Error processing promo code:', {
              message: promoError.message,
              stack: promoError.stack
            });
          }
        }
          } catch (stockUpdateError) {
            console.error(`Error updating stock for SKU ${sku}:`, stockUpdateError.message);
            setMessage(`Error updating stock for item ${sku}. Contact support. Redirecting...`);
            setIsError(true);
            sessionStorage.setItem(
              'orderConfirmationError',
              `Error updating stock for SKU ${sku}: ${stockUpdateError.message}. Contact support.`
            );
            setTimeout(() => navigate('/checkout'), 3000);
            return;
          }
        }

        // Clear session and cart
        sessionStorage.removeItem('pendingOrderData');
        clearCart();
        setTimeout(() => navigate('/success'), 3000);
      } catch (error) {
        console.error('Order processing failed:', error);
        setMessage(`Order processing error: ${error.message}. Redirecting...`);
        setIsError(true);
        sessionStorage.setItem(
          'orderConfirmationError',
          `Order processing error for ${order_id}: ${error.message}. Please contact support if payment was deducted.`
        );
        setTimeout(() => navigate('/checkout'), 3000);
      }
    };

    processOrder();

    return () => {
      isMounted = false;
    };
  }, [clearCart, user, navigate]);

  const styles = {
    page: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'black',
      color: 'white',
      fontFamily: "'Louvette Semi Bold', sans-serif",
      padding: '20px',
      textAlign: 'center',
    },
    message: { fontSize: '1.5rem', marginBottom: '20px', color: isError ? 'red' : 'white' },
    spinner: { fontSize: '2rem', animation: 'spin 1s linear infinite' },
  };

  return (
    <div style={styles.page}>
      <style>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
      <p style={styles.message}>{message}</p>
      {!isError && message.includes('Confirming') && <div style={styles.spinner}>⏳</div>}
    </div>
  );
};

export default ConfirmingOrder;