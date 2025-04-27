const { supabase } = require('../supabaseClient');

// Create a new product
exports.createProduct = async (req, res) => {
  const { name, price, description, imageUrl } = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([
      { name, price, description, imageUrl },
    ])
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(201).json(data);
};

// Get all products
exports.getAllProducts = async (req, res) => {
  const { data, error } = await supabase.from('products').select('*');

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data);
};

// Update product details
exports.updateProduct = async (req, res) => {
  const { id, name, price, description, imageUrl } = req.body;
  const { data, error } = await supabase
    .from('products')
    .update({ name, price, description, imageUrl })
    .match({ id });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json(data);
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('products').delete().match({ id });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json(data);
};
