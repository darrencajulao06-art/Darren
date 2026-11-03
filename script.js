const DEMO_ACCOUNTS = {
  customer: { email: "user@example.com", password: "user123", name: "Darren Cajulao", role: "customer" },
  seller: { email: "seller@example.com", password: "seller123", name: "AgriShop Seller", role: "seller" }
};

const defaultProducts = [
  {id:1,name:"Rice Seeds",category:"Seeds",price:250,stock:45,emoji:"🌾",description:"Quality seeds for a healthy rice harvest."},
  {id:2,name:"Organic Fertilizer",category:"Fertilizers",price:350,stock:30,emoji:"🪴",description:"Nourish your soil with organic nutrients."},
  {id:3,name:"Tomato Seeds",category:"Seeds",price:95,stock:60,emoji:"🍅",description:"Easy-to-grow seeds for home gardens."},
  {id:4,name:"Watering Can",category:"Tools & Equipment",price:220,stock:18,emoji:"🚿",description:"A handy tool for daily watering."},
  {id:5,name:"Garden Gloves",category:"Garden Supplies",price:95,stock:40,emoji:"🧤",description:"Comfortable protection for gardening."},
  {id:6,name:"Hand Trowel",category:"Tools & Equipment",price:160,stock:22,emoji:"🛠️",description:"A durable tool for planting and digging."},
  {id:7,name:"Seedling Tray",category:"Garden Supplies",price:130,stock:25,emoji:"🌱",description:"Start your seedlings in organized rows."},
  {id:8,name:"Garden Soil Mix",category:"Fertilizers",price:180,stock:35,emoji:"🟫",description:"A ready-to-use mix for potted plants."}
];
const defaultWishlist = [1,5,4];
const sampleOrders = [
  {id:"ORD-1001",items:"Rice Seeds, Garden Gloves",status:"Delivered",total:345,date:"Oct 12, 2026"},
  {id:"ORD-1002",items:"Organic Fertilizer",status:"Processing",total:350,date:"Oct 19, 2026"},
  {id:"ORD-1003",items:"Plant Pot and Watering Can",status:"Shipped",total:400,date:"Oct 23, 2026"}
];
let products = readStorage("agrishop-products", defaultProducts);
let cart = readStorage("agrishop-cart", []);
let wishlist = readStorage("agrishop-wishlist", defaultWishlist);
let orders = readStorage("agrishop-orders", []);
let currentRole = "customer";
let currentUser = DEMO_ACCOUNTS.customer;
let toastTimer;
const $ = id => document.getElementById(id);
const peso = n => "₱" + Number(n || 0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
function readStorage(key, fallback) {
  try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : JSON.parse(JSON.stringify(fallback)); }
  catch { return JSON.parse(JSON.stringify(fallback)); }
}
function saveStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) { console.warn("Local storage unavailable", e); } }

$("toggle-password").addEventListener("click", () => {
  const input = $("login-password"); const show = input.type === "password";
  input.type = show ? "text" : "password"; $("toggle-password").textContent = show ? "Hide" : "Show";
});
$("fill-demo").addEventListener("click", () => {
  const role = document.querySelector('input[name="role"]:checked').value;
  $("login-email").value = DEMO_ACCOUNTS[role].email; $("login-password").value = DEMO_ACCOUNTS[role].password; $("login-error").textContent = "";
});
$("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const role = document.querySelector('input[name="role"]:checked').value;
  const email = $("login-email").value.trim().toLowerCase();
  const password = $("login-password").value;
  const account = DEMO_ACCOUNTS[role];
  if (!email || !password) { $("login-error").textContent = "Please enter your email and password."; return; }
  if (email !== account.email || password !== account.password) {
    $("login-error").textContent = "Invalid credentials for the selected account type. Check the demo account details."; return;
  }
  $("login-error").textContent = "";
  login(account);
});
function login(account) {
  currentUser = account; currentRole = account.role;
  $("login-screen").classList.add("hidden"); $("app").classList.remove("hidden");
  $("sidebar-name").textContent = account.name; $("topbar-user").textContent = account.name;
  const initials = account.role === "seller" ? "AS" : "DC";
  $("sidebar-avatar").textContent = initials; $("topbar-avatar").textContent = initials;
  $("customer-nav").classList.toggle("hidden", currentRole !== "customer");
  $("seller-nav").classList.toggle("hidden", currentRole !== "seller");
  if(currentRole === "customer") {
    $("profile-name").textContent = account.name; $("profile-full-name").textContent = account.name;
    $("profile-email").textContent = account.email; $("profile-email-detail").textContent = account.email;
    $("profile-avatar").textContent = initials; showSection("home");
  } else { showSection("seller-dashboard"); renderSeller(); }
  renderAll();
}
function showSection(sectionName) {
  if (sectionName.startsWith("seller-") || sectionName === "manage-products") {
    if (currentRole !== "seller") { showToast("Please sign in with the seller demo account."); return; }
  } else if (["home","products","categories","cart","orders","wishlist","profile","settings"].includes(sectionName) && currentRole !== "customer") {
    showToast("This page is available to customer accounts."); return;
  }
  document.querySelectorAll(".content-section").forEach(s => s.classList.remove("active-section"));
  const section = $(sectionName); if (section) section.classList.add("active-section");
  document.querySelectorAll(".menu-link").forEach(link => link.classList.toggle("active", link.dataset.section === sectionName));
  const activeLink = document.querySelector('.menu-link[data-section="' + sectionName + '"]');
  $("page-heading").textContent = activeLink ? activeLink.textContent.trim().replace(/\d+$/,"").trim() : sectionName;
  $("sidebar").classList.remove("open"); $("sidebar-backdrop").classList.remove("show");
  if(sectionName === "cart") renderCart();
  if(sectionName === "orders") renderOrders();
  if(sectionName === "wishlist") renderWishlist();
  if(sectionName === "manage-products") renderInventory();
  if(sectionName === "seller-dashboard") renderSeller();
  if(sectionName === "seller-orders") renderSellerOrders();
  if(sectionName === "products") renderProducts();
}
document.querySelectorAll(".menu-link").forEach(link => link.addEventListener("click", e => { e.preventDefault(); const target = link.dataset.section; if(target === "logout") showSection("logout"); else showSection(target); }));
$("menu-toggle").addEventListener("click", () => { $("sidebar").classList.add("open"); $("sidebar-backdrop").classList.add("show"); });
$("close-sidebar").addEventListener("click", closeSidebar);
$("sidebar-backdrop").addEventListener("click", closeSidebar);
function closeSidebar(){ $("sidebar").classList.remove("open"); $("sidebar-backdrop").classList.remove("show"); }
$("confirm-logout").addEventListener("click", () => {
  $("app").classList.add("hidden"); $("login-screen").classList.remove("hidden");
  $("login-form").reset(); $("login-password").type="password"; $("toggle-password").textContent="Show";
  document.querySelector('input[name="role"][value="customer"]').checked = true;
  $("login-email").value=""; $("login-password").value=""; $("login-error").textContent="";
  currentRole="customer"; currentUser=DEMO_ACCOUNTS.customer; closeSidebar();
});
$("product-search").addEventListener("input", renderProducts);
$("category-filter").addEventListener("change", renderProducts);
$("seller-search").addEventListener("input", renderInventory);
$("checkout-btn").addEventListener("click", checkout);
$("seller-product-form").addEventListener("submit", saveProduct);
$("cancel-edit").addEventListener("click", resetProductForm);

function productCard(p) {
  const saved = wishlist.includes(p.id);
  return `<article class="product-card">
    <div class="product-visual"><span class="product-emoji">${p.emoji || "🌱"}</span><button class="heart-btn ${saved?"saved":""}" onclick="toggleWishlist(${p.id})" aria-label="${saved?"Remove from wishlist":"Add to wishlist"}">${saved?"♥":"♡"}</button></div>
    <p class="product-category">${escapeHtml(p.category)}</p><h3>${escapeHtml(p.name)}</h3><p class="product-description">${escapeHtml(p.description || "Useful agricultural supplies for your farm and garden.")}</p>
    <div class="product-card-bottom"><strong class="product-price">${peso(p.price)}</strong><button class="add-btn" onclick="addToCart(${p.id})">＋ Add</button></div></article>`;
}
function renderProducts() {
  const query = ($("product-search")?.value || "").trim().toLowerCase();
  const category = $("category-filter")?.value || "all";
  const filtered = products.filter(p => (p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)) && (category === "all" || p.category === category));
  $("products-grid").innerHTML = filtered.length ? filtered.map(productCard).join("") : `<div class="empty-state">🔎<strong>No products found</strong>Try another search or category.</div>`;
  $("product-result-count").textContent = `${filtered.length} product${filtered.length===1?"":"s"}`;
}
function renderFeatured() { $("featured-grid").innerHTML = products.slice(0,4).map(productCard).join(""); }
function renderCategories() {
  const cats = [
    {name:"Seeds",emoji:"🌾",color:"#edf5e5",desc:"Start your next crop with quality rice, vegetable, and garden seeds."},
    {name:"Fertilizers",emoji:"🪴",color:"#fff0e1",desc:"Support healthy soil and strong plant growth."},
    {name:"Tools & Equipment",emoji:"🛠️",color:"#eaf0ff",desc:"Practical tools for planting, watering, and everyday farm work."},
    {name:"Garden Supplies",emoji:"🧤",color:"#f2eaff",desc:"Useful accessories to make gardening easier and more comfortable."}
  ];
  $("category-grid").innerHTML = cats.map(c => `<article class="category-card" onclick="filterCategory('${c.name}')"><div class="category-art" style="background:${c.color}">${c.emoji}</div><h3>${c.name}</h3><p>${c.desc}</p><span>${products.filter(p=>p.category===c.name).length} products →</span></article>`).join("");
}
function filterCategory(category) { $("category-filter").value=category; $("product-search").value=""; showSection("products"); renderProducts(); }
function addToCart(id) {
  const p = products.find(x => x.id === id); if(!p) return;
  const existing = cart.find(x => x.id === id);
  if(existing) existing.quantity++; else cart.push({id:p.id,name:p.name,price:Number(p.price),emoji:p.emoji,quantity:1});
  saveStorage("agrishop-cart",cart); renderCart(); renderCounts(); showToast(p.name + " added to cart.");
}
function changeQuantity(id, delta) {
  const item = cart.find(x=>x.id===id); if(!item) return;
  item.quantity += delta; if(item.quantity <= 0) cart=cart.filter(x=>x.id!==id);
  saveStorage("agrishop-cart",cart); renderCart(); renderCounts();
}
function removeFromCart(id) { cart=cart.filter(x=>x.id!==id); saveStorage("agrishop-cart",cart); renderCart(); renderCounts(); showToast("Item removed from your cart."); }
function renderCart() {
  const host=$("cart-items");
  if(!cart.length){host.innerHTML='<div class="empty-state">🧺<strong>Your cart is empty</strong>Browse the products page and add something you need.<br><button class="btn btn-primary" style="margin-top:14px" onclick=&quot;showSection(&quot;products&quot;)&quot;>Browse products</button></div>'; $("cart-subtotal").textContent=peso(0); $("cart-total").textContent=peso(0); return;}
  host.innerHTML=cart.map(i=>`<div class="cart-row"><div class="cart-product"><div class="mini-product">${i.emoji||"🌱"}</div><div><strong>${escapeHtml(i.name)}</strong><small>${peso(i.price)} each</small></div></div><div class="qty-control"><button onclick="changeQuantity(${i.id},-1)" aria-label="Decrease quantity">−</button><span>${i.quantity}</span><button onclick="changeQuantity(${i.id},1)" aria-label="Increase quantity">+</button></div><div class="cart-price">${peso(i.price*i.quantity)}<button class="remove-link" onclick="removeFromCart(${i.id})">Remove</button></div></div>`).join("");
  const total=cart.reduce((s,i)=>s+i.price*i.quantity,0); $("cart-subtotal").textContent=peso(total); $("cart-total").textContent=peso(total);
}
function checkout() {
  if(!cart.length){showToast("Your cart is empty. Add products first.");return;}
  const total=cart.reduce((s,i)=>s+i.price*i.quantity,0);
  const order={id:"ORD-"+Date.now().toString().slice(-6),items:cart.map(i=>`${i.name} × ${i.quantity}`).join(", "),status:"Processing",total,date:new Date().toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"})};
  orders.unshift(order); saveStorage("agrishop-orders",orders); cart=[]; saveStorage("agrishop-cart",cart); renderCart(); renderCounts(); renderOrders(); showToast("Sample order placed successfully!"); showSection("orders");
}
function toggleWishlist(id) {
  if(wishlist.includes(id)) { wishlist=wishlist.filter(x=>x!==id); showToast("Removed from wishlist."); }
  else { wishlist.push(id); showToast("Added to wishlist."); }
  saveStorage("agrishop-wishlist",wishlist); renderProducts(); renderFeatured(); renderWishlist(); renderCounts();
}
function renderWishlist() {
  const saved=products.filter(p=>wishlist.includes(p.id));
  $("wishlist-grid").innerHTML=saved.length?saved.map(p=>`<article class="product-card"><div class="product-visual"><span class="product-emoji">${p.emoji||"🌱"}</span></div><p class="product-category">${escapeHtml(p.category)}</p><h3>${escapeHtml(p.name)}</h3><p class="product-description">${escapeHtml(p.description||"Farm and garden essential.")}</p><div class="product-card-bottom"><strong class="product-price">${peso(p.price)}</strong><button class="add-btn" onclick="addToCart(${p.id})">Move to Cart</button></div><button class="remove-link" onclick="toggleWishlist(${p.id})">Remove from wishlist</button></article>`).join(""):`<div class="empty-state">♡<strong>Your wishlist is empty</strong>Tap the heart on a product to save it here.</div>`;
}
function renderOrders() {
  const list=[...orders,...sampleOrders];
  $("customer-orders").innerHTML=list.length?list.map(o=>`<article class="order-card"><div><div class="order-id">${escapeHtml(o.date||"Sample order")}</div><h3>${escapeHtml(o.id)}</h3><p>Order number</p></div><div class="order-product"><p>${escapeHtml(o.items)}</p><span class="status-pill ${String(o.status).toLowerCase()}">${escapeHtml(o.status)}</span></div><div class="order-total">${peso(o.total)}</div></article>`).join(""):`<div class="empty-state">📦<strong>No orders yet</strong>Your sample orders will appear here after checkout.</div>`;
}
function renderCounts() {
  const qty=cart.reduce((s,i)=>s+i.quantity,0);
  $("cart-count").textContent=qty; $("home-cart-count").textContent=qty; $("home-wishlist-count").textContent=wishlist.length; $("home-product-count").textContent=products.length;
}
function renderAll(){renderProducts();renderFeatured();renderCategories();renderCart();renderWishlist();renderOrders();renderCounts();renderSeller();}
function renderSeller() {
  if(!$("dashboard-product-table")) return;
  $("seller-total-products").textContent=products.length;
  $("seller-total-orders").textContent=12+orders.length;
  const sales=8450+orders.reduce((s,o)=>s+Number(o.total||0),0);
  $("seller-total-sales").textContent=peso(sales);
  $("dashboard-product-table").innerHTML=products.slice(0,5).map(p=>`<tr><td><div class="table-product"><span class="table-emoji">${p.emoji||"🌱"}</span>${escapeHtml(p.name)}</div></td><td>${escapeHtml(p.category)}</td><td class="table-price">${peso(p.price)}</td><td>${p.stock}</td></tr>`).join("");
}
function renderInventory() {
  const query=($("seller-search")?.value||"").trim().toLowerCase();
  const list=products.filter(p=>p.name.toLowerCase().includes(query)||p.category.toLowerCase().includes(query));
  $("inventory-count").textContent=products.length;
  $("inventory-table").innerHTML=list.length?list.map(p=>`<tr><td><div class="table-product"><span class="table-emoji">${p.emoji||"🌱"}</span>${escapeHtml(p.name)}</div></td><td>${escapeHtml(p.category)}</td><td class="table-price">${peso(p.price)}</td><td>${p.stock}</td><td><span class="stock-pill ${p.stock<10?"low":""}">${p.stock<10?"Low stock":"In stock"}</span></td><td><div class="action-buttons"><button class="action-btn edit" onclick="editProduct(${p.id})">Edit</button><button class="action-btn delete" onclick="deleteProduct(${p.id})">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="6">No matching products found.</td></tr>`;
  renderSeller();
}
function saveProduct(e) {
  e.preventDefault();
  const id=Number($("edit-product-id").value);
  const name=$("seller-product-name").value.trim(), category=$("seller-product-category").value;
  const price=Number($("seller-product-price").value), stock=Number($("seller-product-stock").value);
  if(!name||!category||!Number.isFinite(price)||price<=0||!Number.isInteger(stock)||stock<0){showToast("Please enter valid product details.");return;}
  if(id) {
    const old=products.find(p=>p.id===id);
    if(old) Object.assign(old,{name,category,price,stock});
    showToast("Product updated successfully.");
  } else {
    const emojiMap={"Seeds":"🌾","Fertilizers":"🪴","Tools & Equipment":"🛠️","Garden Supplies":"🧤"};
    products.push({id:Date.now(),name,category,price,stock,emoji:emojiMap[category]||"🌱",description:"Quality agricultural supply for your farm and garden."});
    showToast("Product added successfully.");
  }
  saveStorage("agrishop-products",products); resetProductForm(); renderAll(); renderInventory();
}
function editProduct(id) {
  const p=products.find(x=>x.id===id);if(!p)return;
  $("edit-product-id").value=p.id;$("seller-product-name").value=p.name;$("seller-product-category").value=p.category;$("seller-product-price").value=p.price;$("seller-product-stock").value=p.stock;
  $("product-form-title").textContent="Edit product";$("save-product-btn").textContent="Save Changes";$("cancel-edit").classList.remove("hidden");
  $("seller-product-form").scrollIntoView({behavior:"smooth",block:"center"});
}
function resetProductForm() {
  $("seller-product-form").reset();$("edit-product-id").value="";$("product-form-title").textContent="Add a product";$("save-product-btn").textContent="＋ Save Product";$("cancel-edit").classList.add("hidden");
}
function deleteProduct(id) {
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!confirm(`Delete "${p.name}" from the sample catalog?`))return;
  products=products.filter(x=>x.id!==id);wishlist=wishlist.filter(x=>x!==id);cart=cart.filter(x=>x.id!==id);
  saveStorage("agrishop-products",products);saveStorage("agrishop-wishlist",wishlist);saveStorage("agrishop-cart",cart);
  renderAll();renderInventory();showToast("Product deleted.");
}
function renderSellerOrders() {
  const list=[...orders,...sampleOrders];
  $("seller-orders-list").innerHTML=list.map(o=>`<article class="order-card"><div><div class="order-id">${escapeHtml(o.date||"Sample order")}</div><h3>${escapeHtml(o.id)}</h3><p>Customer: Demo Customer</p></div><div class="order-product"><p>${escapeHtml(o.items)}</p><span class="status-pill ${String(o.status).toLowerCase()}">${escapeHtml(o.status)}</span></div><div class="order-total">${peso(o.total)}</div></article>`).join("");
}
function escapeHtml(value) { return String(value??"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function showToast(message) {
  $("toast").textContent=message;$("toast").classList.add("show");clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2600);
}
// Render the public landing login first. Data is loaded from localStorage if available.
renderAll();
