package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"sportshop/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Store struct {
	mu         sync.RWMutex
	dataDir    string
	users      map[string]*models.User
	products   map[string]*models.Product
	categories map[string]*models.Category
	orders     map[string]*models.Order
	orderItems map[string][]*models.OrderItem // keyed by orderID
	cartItems  map[string][]*models.CartItem  // keyed by userID
}

func NewStore(dataDir string) (*Store, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("create data dir: %w", err)
	}
	s := &Store{
		dataDir:    dataDir,
		users:      make(map[string]*models.User),
		products:   make(map[string]*models.Product),
		categories: make(map[string]*models.Category),
		orders:     make(map[string]*models.Order),
		orderItems: make(map[string][]*models.OrderItem),
		cartItems:  make(map[string][]*models.CartItem),
	}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

// ─── Persistence ────────────────────────────────────────────────────────────

func (s *Store) load() error {
	type dbFile struct {
		Users      []*models.User      `json:"users"`
		Products   []*models.Product   `json:"products"`
		Categories []*models.Category  `json:"categories"`
		Orders     []*models.Order     `json:"orders"`
		OrderItems []*models.OrderItem `json:"order_items"`
		CartItems  []*models.CartItem  `json:"cart_items"`
	}
	path := filepath.Join(s.dataDir, "db.json")
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("read db: %w", err)
	}
	var db dbFile
	if err := json.Unmarshal(data, &db); err != nil {
		return fmt.Errorf("unmarshal db: %w", err)
	}
	for _, u := range db.Users {
		s.users[u.ID] = u
	}
	for _, p := range db.Products {
		s.products[p.ID] = p
	}
	for _, c := range db.Categories {
		s.categories[c.ID] = c
	}
	for _, o := range db.Orders {
		s.orders[o.ID] = o
	}
	for _, oi := range db.OrderItems {
		s.orderItems[oi.OrderID] = append(s.orderItems[oi.OrderID], oi)
	}
	for _, ci := range db.CartItems {
		s.cartItems[ci.UserID] = append(s.cartItems[ci.UserID], ci)
	}
	return nil
}

func (s *Store) save() error {
	type dbFile struct {
		Users      []*models.User      `json:"users"`
		Products   []*models.Product   `json:"products"`
		Categories []*models.Category  `json:"categories"`
		Orders     []*models.Order     `json:"orders"`
		OrderItems []*models.OrderItem `json:"order_items"`
		CartItems  []*models.CartItem  `json:"cart_items"`
	}
	db := dbFile{}
	for _, u := range s.users {
		db.Users = append(db.Users, u)
	}
	for _, p := range s.products {
		db.Products = append(db.Products, p)
	}
	for _, c := range s.categories {
		db.Categories = append(db.Categories, c)
	}
	for _, o := range s.orders {
		db.Orders = append(db.Orders, o)
	}
	for _, items := range s.orderItems {
		db.OrderItems = append(db.OrderItems, items...)
	}
	for _, items := range s.cartItems {
		db.CartItems = append(db.CartItems, items...)
	}
	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal db: %w", err)
	}
	path := filepath.Join(s.dataDir, "db.json")
	return os.WriteFile(path, data, 0644)
}

// ─── Users ───────────────────────────────────────────────────────────────────

func (s *Store) CreateUser(req models.RegisterRequest, role string) (*models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, u := range s.users {
		if u.Email == req.Email {
			return nil, fmt.Errorf("email already in use")
		}
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	u := &models.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
		Phone:        req.Phone,
		Role:         role,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	s.users[u.ID] = u
	return u, s.save()
}

func (s *Store) GetUserByEmail(email string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (s *Store) GetUserByID(id string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.users[id]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (s *Store) UpdateUser(id string, req models.UpdateProfileRequest) (*models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	u, ok := s.users[id]
	if !ok {
		return nil, fmt.Errorf("user not found")
	}
	u.Name = req.Name
	u.Phone = req.Phone
	u.UpdatedAt = time.Now()
	return u, s.save()
}

func (s *Store) ListUsers() []*models.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*models.User, 0, len(s.users))
	for _, u := range s.users {
		out = append(out, u)
	}
	return out
}

func (s *Store) DeleteUser(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.users[id]; !ok {
		return fmt.Errorf("user not found")
	}
	delete(s.users, id)
	return s.save()
}

// ─── Categories ───────────────────────────────────────────────────────────────

func (s *Store) CreateCategory(req models.CreateCategoryRequest) (*models.Category, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c := &models.Category{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Slug:      req.Slug,
		ParentID:  req.ParentID,
		CreatedAt: time.Now(),
	}
	s.categories[c.ID] = c
	return c, s.save()
}

func (s *Store) ListCategories() []*models.Category {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*models.Category, 0, len(s.categories))
	for _, c := range s.categories {
		out = append(out, c)
	}
	return out
}

func (s *Store) GetCategory(id string) (*models.Category, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.categories[id]
	if !ok {
		return nil, fmt.Errorf("category not found")
	}
	return c, nil
}

func (s *Store) UpdateCategory(id string, req models.CreateCategoryRequest) (*models.Category, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.categories[id]
	if !ok {
		return nil, fmt.Errorf("category not found")
	}
	c.Name = req.Name
	c.Slug = req.Slug
	c.ParentID = req.ParentID
	return c, s.save()
}

func (s *Store) DeleteCategory(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.categories[id]; !ok {
		return fmt.Errorf("category not found")
	}
	delete(s.categories, id)
	return s.save()
}

// ─── Products ─────────────────────────────────────────────────────────────────

func (s *Store) CreateProduct(req models.CreateProductRequest) (*models.Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	p := &models.Product{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
		CategoryID:  req.CategoryID,
		ImageURL:    req.ImageURL,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.products[p.ID] = p
	return p, s.save()
}

func (s *Store) ListProducts(categoryID, search string, page, limit int) ([]models.ProductWithCategory, int) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var filtered []models.ProductWithCategory
	for _, p := range s.products {
		if categoryID != "" && p.CategoryID != categoryID {
			continue
		}
		if search != "" {
			// simple substring search
			if !containsCI(p.Name, search) && !containsCI(p.Description, search) {
				continue
			}
		}
		catName := ""
		if c, ok := s.categories[p.CategoryID]; ok {
			catName = c.Name
		}
		filtered = append(filtered, models.ProductWithCategory{
			Product:      *p,
			CategoryName: catName,
		})
	}
	total := len(filtered)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 12
	}
	start := (page - 1) * limit
	end := start + limit
	if start > len(filtered) {
		return nil, total
	}
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[start:end], total
}

func (s *Store) GetProduct(id string) (*models.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	p, ok := s.products[id]
	if !ok {
		return nil, fmt.Errorf("product not found")
	}
	return p, nil
}

func (s *Store) UpdateProduct(id string, req models.UpdateProductRequest) (*models.Product, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.products[id]
	if !ok {
		return nil, fmt.Errorf("product not found")
	}
	p.Name = req.Name
	p.Description = req.Description
	p.Price = req.Price
	p.Stock = req.Stock
	p.CategoryID = req.CategoryID
	p.ImageURL = req.ImageURL
	p.UpdatedAt = time.Now()
	return p, s.save()
}

func (s *Store) DeleteProduct(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.products[id]; !ok {
		return fmt.Errorf("product not found")
	}
	delete(s.products, id)
	return s.save()
}

// ─── Cart ────────────────────────────────────────────────────────────────────

func (s *Store) GetCart(userID string) []models.CartItemWithProduct {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := s.cartItems[userID]
	out := make([]models.CartItemWithProduct, 0, len(items))
	for _, ci := range items {
		if p, ok := s.products[ci.ProductID]; ok {
			out = append(out, models.CartItemWithProduct{CartItem: *ci, Product: *p})
		}
	}
	return out
}

func (s *Store) AddToCart(userID string, req models.AddToCartRequest) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.products[req.ProductID]; !ok {
		return fmt.Errorf("product not found")
	}
	items := s.cartItems[userID]
	for _, ci := range items {
		if ci.ProductID == req.ProductID {
			ci.Quantity += req.Quantity
			if ci.Quantity <= 0 {
				s.removeCartItem(userID, ci.ID)
			}
			return s.save()
		}
	}
	ci := &models.CartItem{
		ID:        uuid.New().String(),
		UserID:    userID,
		ProductID: req.ProductID,
		Quantity:  req.Quantity,
		CreatedAt: time.Now(),
	}
	s.cartItems[userID] = append(s.cartItems[userID], ci)
	return s.save()
}

func (s *Store) UpdateCartItem(userID, itemID string, quantity int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	items := s.cartItems[userID]
	for _, ci := range items {
		if ci.ID == itemID {
			if quantity <= 0 {
				s.removeCartItem(userID, itemID)
			} else {
				ci.Quantity = quantity
			}
			return s.save()
		}
	}
	return fmt.Errorf("cart item not found")
}

func (s *Store) RemoveFromCart(userID, itemID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.removeCartItem(userID, itemID)
	return s.save()
}

func (s *Store) removeCartItem(userID, itemID string) {
	items := s.cartItems[userID]
	out := items[:0]
	for _, ci := range items {
		if ci.ID != itemID {
			out = append(out, ci)
		}
	}
	s.cartItems[userID] = out
}

func (s *Store) ClearCart(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.cartItems, userID)
	return s.save()
}

// ─── Orders ───────────────────────────────────────────────────────────────────

func (s *Store) CreateOrder(userID string, req models.CreateOrderRequest) (*models.Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cartItems := s.cartItems[userID]
	if len(cartItems) == 0 {
		return nil, fmt.Errorf("cart is empty")
	}

	var total float64
	var items []*models.OrderItem
	for _, ci := range cartItems {
		p, ok := s.products[ci.ProductID]
		if !ok {
			continue
		}
		oi := &models.OrderItem{
			ID:        uuid.New().String(),
			ProductID: ci.ProductID,
			Quantity:  ci.Quantity,
			Price:     p.Price,
			Product:   *p,
		}
		total += p.Price * float64(ci.Quantity)
		items = append(items, oi)
	}

	now := time.Now()
	o := &models.Order{
		ID:           uuid.New().String(),
		UserID:       userID,
		Status:       models.StatusNew,
		TotalPrice:   total,
		Address:      req.Address,
		ContactPhone: req.ContactPhone,
		Comment:      req.Comment,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	for _, oi := range items {
		oi.OrderID = o.ID
	}
	s.orders[o.ID] = o
	s.orderItems[o.ID] = items
	delete(s.cartItems, userID)
	return o, s.save()
}

func (s *Store) GetOrder(id string) (*models.Order, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	o, ok := s.orders[id]
	if !ok {
		return nil, fmt.Errorf("order not found")
	}
	o.Items = s.resolveItems(id)
	return o, nil
}

func (s *Store) ListOrdersByUser(userID string) []*models.Order {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []*models.Order
	for _, o := range s.orders {
		if o.UserID == userID {
			cp := *o
			cp.Items = s.resolveItems(o.ID)
			out = append(out, &cp)
		}
	}
	return out
}

func (s *Store) ListAllOrders() []models.OrderWithUser {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]models.OrderWithUser, 0, len(s.orders))
	for _, o := range s.orders {
		cp := *o
		cp.Items = s.resolveItems(o.ID)
		ow := models.OrderWithUser{Order: cp}
		if u, ok := s.users[o.UserID]; ok {
			ow.UserName = u.Name
			ow.UserEmail = u.Email
		}
		out = append(out, ow)
	}
	return out
}

func (s *Store) UpdateOrderStatus(id, status string) (*models.Order, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	o, ok := s.orders[id]
	if !ok {
		return nil, fmt.Errorf("order not found")
	}
	o.Status = status
	o.UpdatedAt = time.Now()
	return o, s.save()
}

func (s *Store) resolveItems(orderID string) []models.OrderItem {
	raw := s.orderItems[orderID]
	out := make([]models.OrderItem, 0, len(raw))
	for _, oi := range raw {
		item := *oi
		if p, ok := s.products[oi.ProductID]; ok {
			item.Product = *p
		}
		out = append(out, item)
	}
	return out
}

// ─── Stats ────────────────────────────────────────────────────────────────────

func (s *Store) GetAdminStats() models.AdminStats {
	s.mu.RLock()
	defer s.mu.RUnlock()
	today := time.Now().Truncate(24 * time.Hour)
	var stats models.AdminStats
	stats.TotalProducts = len(s.products)
	stats.TotalUsers = len(s.users)
	for _, o := range s.orders {
		stats.TotalOrders++
		stats.TotalRevenue += o.TotalPrice
		if !o.CreatedAt.Before(today) {
			stats.TodayOrders++
			stats.TodayRevenue += o.TotalPrice
		}
	}
	return stats
}

// ─── Seed ────────────────────────────────────────────────────────────────────

func (s *Store) SeedIfEmpty(adminEmail, adminPassword string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.users) > 0 {
		return nil
	}
	// Create admin
	hash, _ := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	now := time.Now()
	admin := &models.User{
		ID:           uuid.New().String(),
		Email:        adminEmail,
		PasswordHash: string(hash),
		Name:         "Администратор",
		Role:         models.RoleAdmin,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	s.users[admin.ID] = admin

	// Create categories
	cats := []models.Category{
		{ID: uuid.New().String(), Name: "Бег", Slug: "running", CreatedAt: now},
		{ID: uuid.New().String(), Name: "Фитнес", Slug: "fitness", CreatedAt: now},
		{ID: uuid.New().String(), Name: "Велоспорт", Slug: "cycling", CreatedAt: now},
		{ID: uuid.New().String(), Name: "Плавание", Slug: "swimming", CreatedAt: now},
	}
	for i := range cats {
		s.categories[cats[i].ID] = &cats[i]
	}

	// Create sample products
	prods := []models.Product{
		{ID: uuid.New().String(), Name: "Кроссовки Adidas Ultraboost", Description: "Профессиональные кроссовки для бега с технологией Boost", Price: 12990, Stock: 25, CategoryID: cats[0].ID, ImageURL: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", CreatedAt: now, UpdatedAt: now},
		{ID: uuid.New().String(), Name: "Nike Air Zoom Pegasus", Description: "Легкие беговые кроссовки для ежедневных тренировок", Price: 9490, Stock: 18, CategoryID: cats[0].ID, ImageURL: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", CreatedAt: now, UpdatedAt: now},
		{ID: uuid.New().String(), Name: "Гантели разборные 20 кг", Description: "Хромированные гантели с резиновым покрытием, комплект 2 шт.", Price: 4990, Stock: 10, CategoryID: cats[1].ID, ImageURL: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400", CreatedAt: now, UpdatedAt: now},
		{ID: uuid.New().String(), Name: "Коврик для йоги", Description: "Нескользящий коврик из NBR, толщина 10 мм", Price: 1490, Stock: 40, CategoryID: cats[1].ID, ImageURL: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400", CreatedAt: now, UpdatedAt: now},
		{ID: uuid.New().String(), Name: "Велошлем Specialized Align II", Description: "Легкий шлем для городского и горного велоспорта", Price: 5990, Stock: 12, CategoryID: cats[2].ID, ImageURL: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", CreatedAt: now, UpdatedAt: now},
		{ID: uuid.New().String(), Name: "Велоперчатки", Description: "Защитные перчатки с гелевыми вставками", Price: 1290, Stock: 30, CategoryID: cats[2].ID, ImageURL: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", CreatedAt: now, UpdatedAt: now},
		{ID: uuid.New().String(), Name: "Очки для плавания TYR", Description: "Профессиональные очки с антибликовым покрытием", Price: 2490, Stock: 20, CategoryID: cats[3].ID, ImageURL: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400", CreatedAt: now, UpdatedAt: now},
		{ID: uuid.New().String(), Name: "Купальник Arena", Description: "Соревновательный купальник из полиэстера", Price: 3290, Stock: 15, CategoryID: cats[3].ID, ImageURL: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400", CreatedAt: now, UpdatedAt: now},
	}
	for i := range prods {
		s.products[prods[i].ID] = &prods[i]
	}

	return s.save()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func containsCI(s, sub string) bool {
	if len(sub) == 0 {
		return true
	}
	ls, lsub := []rune(s), []rune(sub)
	for i := 0; i <= len(ls)-len(lsub); i++ {
		match := true
		for j := range lsub {
			if toLower(ls[i+j]) != toLower(lsub[j]) {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func toLower(r rune) rune {
	if r >= 'A' && r <= 'Z' {
		return r + 32
	}
	if r >= 'А' && r <= 'Я' {
		return r + 32
	}
	return r
}
