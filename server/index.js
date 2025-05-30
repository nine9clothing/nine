import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { supabase } from './supabaseClient.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import crypto from 'crypto';
dotenv.config();

import Razorpay from 'razorpay';
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Nine9 Backend API' });
});

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

async function getShiprocketToken() {
  try {
    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });
    return response.data.token;
  } catch (error) {
    // console.error('Shiprocket login error:', {
    //   message: error.message,
    //   response: error.response?.data,
    //   status: error.response?.status,
    // });
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

app.post('/api/shiprocket/check-serviceability', async (req, res) => {
  try {
    const { pickup_postcode, delivery_postcode, weight, cod } = req.body;
    
    if (!pickup_postcode || !delivery_postcode || !weight) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const token = await getShiprocketToken();
        
    const response = await axios.get(
      'https://apiv2.shiprocket.in/v1/external/courier/serviceability', {
        params: {
          pickup_postcode: pickup_postcode,
          delivery_postcode: delivery_postcode,
          weight: weight,
          cod: cod === true ? 1 : 0
        },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    
    if (response.data && response.data.data && response.data.data.available_courier_companies) {
      const availableCouriers = response.data.data.available_courier_companies;
      let cheapestCourier = null;
      let lowestRate = Infinity;
      
      for (const courier of availableCouriers) {
        if (courier.rate < lowestRate) {
          lowestRate = courier.rate;
          cheapestCourier = courier;
        }
      }
      
      return res.json({
        status: 'success',
        data: {
          serviceability: true,
          pickup_postcode: pickup_postcode,
          delivery_postcode: delivery_postcode,
          available_couriers: availableCouriers,
          cheapest_courier: cheapestCourier
        }
      });
    } else {
      return res.json({
        status: 'error',
        data: {
          serviceability: false,
          message: 'No courier services available for this pincode'
        }
      });
    }
  } catch (error) {
    // console.error('Shiprocket serviceability error:', {
    //   message: error.message,
    //   response: error.response?.data,
    //   status: error.response?.status
    // });
    
    return res.status(500).json({
      status: 'error',
      error: 'Failed to check serviceability',
      details: error.message
    });
  }
});

app.post('/api/shiprocket/order', async (req, res) => {
  try {
    const { order_id, order_date, pickup_location, billing, shipping, items, sub_total, dimensions, user_id, shipping_charges, courier_id, payment_method} = req.body;

    if (!user_id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(user_id)) {
      // console.error('User ID validation failed:', user_id);
      throw new Error('Invalid or missing user_id');
    }
    if (!payment_method || !['Prepaid', 'COD'].includes(payment_method)) {
      // console.error('Invalid payment method:', payment_method);
      throw new Error('Invalid or missing payment_method. Must be "Prepaid" or "COD".');
    }
    const token = await getShiprocketToken();

    const shiprocketResponse = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      {
        order_id,
        order_date,
        pickup_location,
        billing_customer_name: billing.customer_name || 'Unknown',
        billing_last_name: billing.last_name || '',
        billing_address: billing.address || '',
        billing_city: billing.city || '',
        billing_pincode: billing.pincode || '',
        billing_state: billing.state || 'Maharashtra',
        billing_country: billing.country || 'India',
        billing_email: billing.email || 'no-email@example.com',
        billing_phone: billing.phone || '',
        shipping_is_billing: shipping.is_billing,
        order_items: items || [],
        payment_method: payment_method,
        sub_total: sub_total || 0,
        length: dimensions.length || 10,
        breadth: dimensions.breadth || 15,
        height: dimensions.height || 10,
        weight: dimensions.weight || 0.5,
        courier_id: courier_id || '', 
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('order_id')
      .eq('order_id', order_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { 
      throw checkError;
    }
    if (existingOrder) {
      // console.warn('Order with order_id already exists:', order_id);
      return res.status(400).json({ error: 'Order already processed', order_id });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          order_id,
          total: (sub_total || 0) + (shipping_charges || 0), 
          items: items || [],
          status: 'placed',
          shipping_name: `${billing.customer_name || 'Unknown'} ${billing.last_name || ''}`.trim(),
          shipping_phone: billing.phone || '',
          shipping_address: billing.address || '',
          shipping_city: billing.city || '',
          shipping_pincode: billing.pincode || '',
          shipping_details: shiprocketResponse.data || {},
          shipping_status: 'pending',
          display_order_id: order_id,
          shipping_charges: shipping_charges || 0, 
          courier_id: courier_id || null, 
          courier_name: shiprocketResponse.data?.courier_name || null, 
          payment_method: payment_method,
        },
      ])
      .select()
      .single();

    if (error) {
      // console.error('Supabase insertion error:', {
      //   message: error.message,
      //   code: error.code,
      //   details: error.details,
      //   hint: error.hint,
      //   context: error.context,
      // });
      throw error;
    }

    res.json({ shiprocket_response: shiprocketResponse.data, supabase_order: data });
  } catch (error) {
    // console.error('Order processing error:', {
    //   message: error.message,
    //   response: error.response?.data,
    //   stack: error.stack,
    //   supabase_error: error.code,
    //   details: error.details,
    // });
    if (error.message === 'Failed to authenticate with Shiprocket') {
      res.status(401).json({ error: 'Authentication failed with Shiprocket' });
    } else if (error.message.includes('payment_method')) {
      res.status(400).json({ error: error.message });
    } else if (error.code === '23502' || error.code === '23503' || error.code === '23505') {
      res.status(400).json({ error: 'Invalid data or duplicate order', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to process order', details: error.message });
    }
  }
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/api/razorpay/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    // console.error('Invalid amount received:', amount);
    return res.status(400).json({ error: 'Invalid or missing amount' });
  }
  const options = {
    amount: Math.round(amount * 100),
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    // console.error('Razorpay order creation error:', {
    //   message: error.message,
    //   status: error.statusCode,
    //   details: error.error,
    // });
    res.status(error.statusCode || 500).json({
      error: 'Failed to create order',
      details: error.error?.description || error.message,
    });
  }
});
app.post('/api/razorpay/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    res.json({ status: 'success' });
  } else {
    res.status(400).json({ status: 'failure', message: 'Invalid signature' });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});