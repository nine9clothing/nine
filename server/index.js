// // server/index.js
// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import axios from 'axios';
// import { supabase } from './supabaseClient.js';
// import productRoutes from './routes/productRoutes.js';
// import orderRoutes from './routes/orderRoutes.js';
// import sgMail from '@sendgrid/mail'; // Add SendGrid import

// dotenv.config();

// const app = express();
// app.use(cors({
//   origin: 'http://localhost:5173', // Allow your frontend origin
//   methods: ['GET', 'POST'],       // Allow necessary methods
//   allowedHeaders: ['Content-Type'], // Allow necessary headers
// }));
// app.use(express.json());

// // Set SendGrid API key
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// // Use the product and order routes
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);

// // Shiprocket Authentication
// async function getShiprocketToken() {
//   try {
//     console.log('Attempting Shiprocket login...');
//     const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
//       email: process.env.SHIPROCKET_EMAIL,
//       password: process.env.SHIPROCKET_PASSWORD,
//     });
//     console.log('Shiprocket login successful');
//     return response.data.token;
//   } catch (error) {
//     console.error('Shiprocket login error:', {
//       message: error.message,
//       response: error.response?.data,
//       status: error.response?.status,
//     });
//     throw new Error('Failed to authenticate with Shiprocket');
//   }
// }

// // Create Shiprocket Order
// app.post('/api/shiprocket/order', async (req, res) => {
//   try {
//     console.log('Received POST request:', JSON.stringify(req.body, null, 2));
//     const { order_id, order_date, pickup_location, billing, shipping, items, sub_total, dimensions, user_id } = req.body;

//     if (!user_id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(user_id)) {
//       console.error('User ID validation failed:', user_id);
//       throw new Error('Invalid or missing user_id');
//     }

//     const token = await getShiprocketToken();

//     console.log('Sending order to Shiprocket API with order_id:', order_id);
//     const shiprocketResponse = await axios.post(
//       'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
//       {
//         order_id,
//         order_date,
//         pickup_location,
//         billing_customer_name: billing.customer_name || 'Unknown',
//         billing_last_name: billing.last_name || '',
//         billing_address: billing.address || '',
//         billing_city: billing.city || '',
//         billing_pincode: billing.pincode || '',
//         billing_state: billing.state || 'Maharashtra',
//         billing_country: billing.country || 'India',
//         billing_email: billing.email || 'no-email@example.com',
//         billing_phone: billing.phone || '',
//         shipping_is_billing: shipping.is_billing,
//         order_items: items || [],
//         payment_method: 'Prepaid',
//         sub_total: sub_total || 0,
//         length: dimensions.length || 10,
//         breadth: dimensions.breadth || 15,
//         height: dimensions.height || 10,
//         weight: dimensions.weight || 0.5,
//       },
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     );
//     console.log('Shiprocket API response:', JSON.stringify(shiprocketResponse.data, null, 2));

//     const { data: existingOrder, error: checkError } = await supabase
//       .from('orders')
//       .select('order_id')
//       .eq('order_id', order_id)
//       .single();

//     if (checkError && checkError.code !== 'PGRST116') {
//       throw checkError;
//     }
//     if (existingOrder) {
//       console.warn('Order with order_id already exists:', order_id);
//       return res.status(400).json({ error: 'Order already processed', order_id });
//     }

//     console.log('Attempting Supabase insertion with user_id:', user_id);
//     const { data, error } = await supabase
//       .from('orders')
//       .insert([
//         {
//           user_id,
//           order_id,
//           total: sub_total || 0,
//           items: items || [],
//           status: 'placed',
//           shipping_name: `${billing.customer_name || 'Unknown'} ${billing.last_name || ''}`.trim(),
//           shipping_phone: billing.phone || '',
//           shipping_address: billing.address || '',
//           shipping_city: billing.city || '',
//           shipping_pincode: billing.pincode || '',
//           shipping_details: shiprocketResponse.data || {},
//           shipping_status: 'pending',
//           display_order_id: order_id,
//         },
//       ])
//       .select()
//       .single();

//     if (error) {
//       console.error('Supabase insertion error:', {
//         message: error.message,
//         code: error.code,
//         details: error.details,
//         hint: error.hint,
//         context: error.context,
//       });
//       throw error;
//     }

//     console.log('Supabase insertion successful:', JSON.stringify(data, null, 2));
//     res.json({ shiprocket_response: shiprocketResponse.data, supabase_order: data });
//   } catch (error) {
//     console.error('Order processing error:', {
//       message: error.message,
//       response: error.response?.data,
//       stack: error.stack,
//       supabase_error: error.code,
//       details: error.details,
//     });
//     if (error.message === 'Failed to authenticate with Shiprocket') {
//       res.status(401).json({ error: 'Authentication failed with Shiprocket' });
//     } else if (error.code === '23502' || error.code === '23503' || error.code === '23505') {
//       res.status(400).json({ error: 'Invalid data or duplicate order', details: error.message });
//     } else {
//       res.status(500).json({ error: 'Failed to process order', details: error.message });
//     }
//   }
// });

// // New endpoint for sending availability email
// app.post('/api/send-availability-email', async (req, res) => {
//   try {
//     const { userId, email, productId, productName, size, notificationId } = req.body;

//     // Validate required fields
//     if (!email || !productName || !size) {
//       return res.status(400).json({ error: 'Missing required fields: email, productName, or size' });
//     }

//     // Email configuration
//     const msg = {
//       to: email,
//       from: process.env.SENDER_EMAIL || 'your-verified-email@example.com', // Add to .env
//       subject: `Size ${size} Available for ${productName}`,
//       text: `Hello! The size ${size} for ${productName} is now available. Check it out!`,
//       html: `<p>Hello!</p><p>The size <strong>${size}</strong> for <strong>${productName}</strong> is now available. Check it out!</p>`,
//     };

//     // Send email
//     await sgMail.send(msg);
//     console.log('Email sent to:', email);

//     res.status(200).json({ message: 'Email sent successfully' });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ error: 'Failed to send email', details: error.message });
//   }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { supabase } from './supabaseClient.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const cors = require('cors');
app.use(cors({
  origin: 'https://nine9.co.in/',
  credentials: true
}));

// Add a root route handler
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Nine9 Backend API' });
});

// Use the product and order routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Shiprocket Authentication
async function getShiprocketToken() {
  try {
    console.log('Attempting Shiprocket login...');
    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });
    console.log('Shiprocket login successful');
    return response.data.token;
  } catch (error) {
    console.error('Shiprocket login error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

// Get Shipping Charges from Shiprocket based on pincode
app.post('/api/shiprocket/check-serviceability', async (req, res) => {
  try {
    const { pickup_postcode, delivery_postcode, weight, cod } = req.body;
    
    if (!pickup_postcode || !delivery_postcode || !weight) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const token = await getShiprocketToken();
    
    console.log('Checking serviceability with Shiprocket for delivery to pincode:', delivery_postcode);
    
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
    
    console.log('Shiprocket serviceability response received');
    
    // Get available courier services with rates
    if (response.data && response.data.data && response.data.data.available_courier_companies) {
      // Find the cheapest courier option
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
    console.error('Shiprocket serviceability error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return res.status(500).json({
      status: 'error',
      error: 'Failed to check serviceability',
      details: error.message
    });
  }
});

// Create Shiprocket Order
app.post('/api/shiprocket/order', async (req, res) => {
  try {
    console.log('Received POST request:', JSON.stringify(req.body, null, 2));
    const { order_id, order_date, pickup_location, billing, shipping, items, sub_total, dimensions, user_id, shipping_charges, courier_id } = req.body;

    if (!user_id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(user_id)) {
      console.error('User ID validation failed:', user_id);
      throw new Error('Invalid or missing user_id');
    }

    const token = await getShiprocketToken();

    // Make Shiprocket API call
    console.log('Sending order to Shiprocket API with order_id:', order_id);
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
        payment_method: 'Prepaid',
        sub_total: sub_total || 0,
        length: dimensions.length || 10,
        breadth: dimensions.breadth || 15,
        height: dimensions.height || 10,
        weight: dimensions.weight || 0.5,
        courier_id: courier_id || '', // Include the selected courier_id if provided
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('Shiprocket API response:', JSON.stringify(shiprocketResponse.data, null, 2));

    // Check if order_id already exists (optional, relies on unique constraint)
    const { data: existingOrder, error: checkError } = await supabase
      .from('orders')
      .select('order_id')
      .eq('order_id', order_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw checkError;
    }
    if (existingOrder) {
      console.warn('Order with order_id already exists:', order_id);
      return res.status(400).json({ error: 'Order already processed', order_id });
    }

    // Save order to Supabase
    console.log('Attempting Supabase insertion with user_id:', user_id);
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id,
          order_id,
          total: (sub_total || 0) + (shipping_charges || 0), // Include shipping charges in total
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
          shipping_charges: shipping_charges || 0, // Add shipping charges field
          courier_id: courier_id || null, // Add courier_id field
          courier_name: shiprocketResponse.data?.courier_name || null, // Add courier name if available
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insertion error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        context: error.context,
      });
      throw error;
    }

    console.log('Supabase insertion successful:', JSON.stringify(data, null, 2));
    res.json({ shiprocket_response: shiprocketResponse.data, supabase_order: data });
  } catch (error) {
    console.error('Order processing error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
      supabase_error: error.code,
      details: error.details,
    });
    if (error.message === 'Failed to authenticate with Shiprocket') {
      res.status(401).json({ error: 'Authentication failed with Shiprocket' });
    } else if (error.code === '23502' || error.code === '23503' || error.code === '23505') {
      res.status(400).json({ error: 'Invalid data or duplicate order', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to process order', details: error.message });
    }
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});