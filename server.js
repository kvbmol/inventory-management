const express = require('express')
const fs = require('fs');
const path = require('path'); 
const app = express()
const port = 3000

const productsFile = path.join(__dirname, 'products.json');
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  
app.use(express.static('.'));  // For ALL files in this folder via HTTP" 

// GET /getProducts 
app.get('/getProducts', (req, res) => {
  try {
    if (!fs.existsSync(productsFile)) {
      return res.json([]);  
    }
    const data = fs.readFileSync(productsFile, 'utf8');  
    res.json(JSON.parse(data));  
  } catch (error) {
    console.error('Error reading products:', error);  
    res.json([]);
  }
});

// POST /addProduct
app.post('/addProduct', (req, res) => {
  const newProduct = req.body;  
  
  if (!newProduct.productId || !newProduct.productName || newProduct.description === undefined || newProduct.Stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields: productId, productName, description, Stock' });
  }
  
  try {
    let products = [];
    if (fs.existsSync(productsFile)) {
      const data = fs.readFileSync(productsFile, 'utf8');
      products = JSON.parse(data);
    }
    
    const exists = products.find(p => p.productId === newProduct.productId);
    if (exists) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }
    
    products.push(newProduct);  
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');  
    console.log('Products updated successfully');
    res.status(201).json({ message: 'Product added', product: newProduct });  
  } catch (error) {
    console.error('Error writing products:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /deleteProduct/:id 
app.delete('/deleteProduct/:id', (req, res) => {
  const id = parseInt(req.params.id);  
  
  try {
    let products = [];
    if (fs.existsSync(productsFile)) {
      const data = fs.readFileSync(productsFile, 'utf8');
      products = JSON.parse(data);
    }
    
    const index = products.findIndex(p => p.productId === id);  
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(index, 1);  
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');  
    console.log('Products updated successfully');
    res.json({ message: 'Product deleted', deletedId: id });  
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /updateProduct/:id 
app.put('/updateProduct/:id', (req, res) => {
  const id = parseInt(req.params.id);  
  const { description } = req.body;  
  
  if (!description) {
    return res.status(400).json({ error: 'Description required in body' });
  }
  
  try {
    let products = [];
    if (fs.existsSync(productsFile)) {
      const data = fs.readFileSync(productsFile, 'utf8');
      products = JSON.parse(data);
    }
    
    const product = products.find(p => p.productId === id);  
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    product.description = description;  
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');  
    console.log('Products updated successfully');
    res.json({ message: 'Product description updated', product });  
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
  console.log(`UI: http://localhost:${port}/index.html`);
});
