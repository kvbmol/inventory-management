const express = require('express')
const fs = require('fs');
const path = require('path'); 
const app = express()
const port = 3000

const productsFile = path.join(__dirname, 'products.json');
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  
app.use(express.static('.'));  

const readProducts = () => {
  try {
    if (!fs.existsSync(productsFile)) {
      return [];  
    }
    const data = fs.readFileSync(productsFile, 'utf8');  
    return JSON.parse(data);  
  } catch (error) {
    console.error('Error reading products:', error);  
    return [];  
  }
};

const writeProducts = (products) => {
  try {
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2), 'utf8');  
    console.log('Products updated successfully');  
  } catch (error) {
    console.error('Error writing products:', error);  
  }
};

// ALL YOUR ORIGINAL API ROUTES - UNCOMMENT THESE:
app.get('/getProducts', (req, res) => {
  const products = readProducts();  
  res.json(products);  
});

app.post('/addProduct', (req, res) => {
  const products = readProducts();  
  const newProduct = req.body;  
  
  if (!newProduct.productId || !newProduct.productName || newProduct.description === undefined || newProduct.Stock === undefined) {
    return res.status(400).json({ error: 'Missing required fields: productId, productName, description, Stock' });
  }
  
  const exists = products.find(p => p.productId === newProduct.productId);
  if (exists) {
    return res.status(400).json({ error: 'Product ID already exists' });
  }
  
  products.push(newProduct);  
  writeProducts(products);  
  res.status(201).json({ message: 'Product added', product: newProduct });  
});

app.delete('/deleteProduct/:id', (req, res) => {
  const products = readProducts();  
  const id = parseInt(req.params.id);  
  
  const index = products.findIndex(p => p.productId === id);  
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  products.splice(index, 1);  
  writeProducts(products);  
  res.json({ message: 'Product deleted', deletedId: id });  
});

app.put('/updateProduct/:id', (req, res) => {
  const products = readProducts();  
  const id = parseInt(req.params.id);  
  const { description } = req.body;  
  
  if (!description) {
    return res.status(400).json({ error: 'Description required in body' });
  }
  
  const product = products.find(p => p.productId === id);  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  product.description = description;  
  writeProducts(products);  
  res.json({ message: 'Product updated', product });  
});
function addStock(productId) {
  fetch(`/addStock/${productId}`, { method: 'PUT' })
  .then(res => res.json())
  .then(data => {
    alert('✅ Added 10 stock! Reloading...');
    location.reload();
  })
  .catch(err => alert('❌ Error: ' + err));
}

// NEW: Add stock to existing product
app.put('/addStock/:id', (req, res) => {
  const products = readProducts();
  const id = parseInt(req.params.id);
  
  const product = products.find(p => p.productId === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  product.Stock += 10;  // Add 10 stock
  writeProducts(products);
  res.json({ message: 'Stock added', product });
});

// YOUR NEW INVENTORY TABLE ENDPOINT:
app.get('/inventory', (req, res) => {
  const products = readProducts();
  
  const tableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Inventory Management</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #4CAF50; color: white; font-weight: bold; }
        tr:hover { background: #f1f1f1; }
        .add-btn { background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 14px; margin-right: 5px; }
        .add-btn:hover { background: #1976D2; }
        .delete-btn { background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 14px; }
        .delete-btn:hover { background: #d32f2f; }
        .stock-low { background: #fff3cd; color: #856404; }
        .stock-critical { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📦 Inventory Management System</h1>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product Name</th>
              <th>Description</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(product => `
              <tr>
                <td><strong>${product.productId}</strong></td>
                <td>${product.productName}</td>
                <td>${product.description}</td>
                <td class="${product.Stock < 5 ? 'stock-critical' : product.Stock < 10 ? 'stock-low' : ''}">
                  ${product.Stock}
                </td>
                <td>
                  <button class="add-btn" onclick="addStock(${product.productId})">➕ Add Stock</button>
                  <button class="delete-btn" onclick="deleteProduct(${product.productId})">🗑️ Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <script>
          function addStock(productId) {
            if (confirm('Add 10 more stock for Product ID: ' + productId + '?')) {
              fetch(\`/addStock/\${productId}\`, { 
                method: 'PUT',
                headers: {'Content-Type': 'application/json'}
              })
              .then(res => res.json())
              .then(data => {
                alert('✅ Added 10 stock! Reloading...');
                location.reload();
              })
              .catch(err => alert('❌ Error: ' + err));
            }
          }
          
          function deleteProduct(productId) {
            if (confirm('Delete Product ID: ' + productId + '? This cannot be undone!')) {
              fetch(\`/deleteProduct/\${productId}\`, { 
                method: 'DELETE'
              })
              .then(res => res.json())
              .then(data => {
                alert('✅ Product deleted! Reloading...');
                location.reload();
              })
              .catch(err => alert('❌ Error: ' + err));
            }
          }
        </script>
      </div>
    </body>
    </html>
  `;
  res.send(tableHTML);
});



app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}/inventory`);
});
