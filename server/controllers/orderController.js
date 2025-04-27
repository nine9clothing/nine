const { supabase } = require('../supabaseClient');

// Create an order
exports.createOrder = async (req, res) => {
  const { userId, products, totalAmount } = req.body;
  const { data, error } = await supabase
    .from('orders')
    .insert([
      { userId, products, totalAmount },
    ])
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
};

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('userId', userId);

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json(data);
};
