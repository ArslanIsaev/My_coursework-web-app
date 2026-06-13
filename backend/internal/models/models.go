package models

import "time"

// User roles
const (
	RoleCustomer = "customer"
	RoleAdmin    = "admin"
)

// Order statuses
const (
	StatusNew        = "new"
	StatusProcessing = "processing"
	StatusShipped    = "shipped"
	StatusDelivered  = "delivered"
	StatusCancelled  = "cancelled"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Category struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	ParentID  string    `json:"parent_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Stock       int       `json:"stock"`
	CategoryID  string    `json:"category_id"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProductWithCategory struct {
	Product
	CategoryName string `json:"category_name"`
}

type CartItem struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	ProductID string    `json:"product_id"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
}

type CartItemWithProduct struct {
	CartItem
	Product Product `json:"product"`
}

type Order struct {
	ID           string      `json:"id"`
	UserID       string      `json:"user_id"`
	Status       string      `json:"status"`
	TotalPrice   float64     `json:"total_price"`
	Address      string      `json:"address"`
	ContactPhone string      `json:"contact_phone"`
	Comment      string      `json:"comment"`
	Items        []OrderItem `json:"items,omitempty"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

type OrderWithUser struct {
	Order
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

type OrderItem struct {
	ID        string  `json:"id"`
	OrderID   string  `json:"order_id"`
	ProductID string  `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	Product   Product `json:"product,omitempty"`
}

// Request/Response types

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateProductRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
	CategoryID  string  `json:"category_id"`
	ImageURL    string  `json:"image_url"`
}

type UpdateProductRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
	CategoryID  string  `json:"category_id"`
	ImageURL    string  `json:"image_url"`
}

type CreateCategoryRequest struct {
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	ParentID string `json:"parent_id"`
}

type AddToCartRequest struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type CreateOrderRequest struct {
	Address      string `json:"address"`
	ContactPhone string `json:"contact_phone"`
	Comment      string `json:"comment"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status"`
}

type UpdateProfileRequest struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type AdminStats struct {
	TotalOrders    int     `json:"total_orders"`
	TodayOrders    int     `json:"today_orders"`
	TotalRevenue   float64 `json:"total_revenue"`
	TodayRevenue   float64 `json:"today_revenue"`
	TotalProducts  int     `json:"total_products"`
	TotalUsers     int     `json:"total_users"`
}

type ProductListResponse struct {
	Products []ProductWithCategory `json:"products"`
	Total    int                   `json:"total"`
	Page     int                   `json:"page"`
	Limit    int                   `json:"limit"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type MessageResponse struct {
	Message string `json:"message"`
}
