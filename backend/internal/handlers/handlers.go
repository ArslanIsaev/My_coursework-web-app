package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"sportshop/internal/middleware"
	"sportshop/internal/models"
	"sportshop/internal/storage"

	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	store     *storage.Store
	jwtSecret string
}

func New(store *storage.Store, jwtSecret string) *Handler {
	return &Handler{store: store, jwtSecret: jwtSecret}
}

func (h *Handler) respond(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

func (h *Handler) err(w http.ResponseWriter, code int, msg string) {
	h.respond(w, code, models.ErrorResponse{Error: msg})
}

func (h *Handler) decode(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}

func userID(r *http.Request) string {
	id, _ := r.Context().Value(middleware.UserIDKey).(string)
	return id
}

// ─── Health ───────────────────────────────────────────────────────────────────

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	h.respond(w, http.StatusOK, map[string]string{"status": "ok"})
}

// ─── Auth ────────────────────────────────────────────────────────────────────

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	if req.Email == "" || req.Password == "" || req.Name == "" {
		h.err(w, http.StatusBadRequest, "email, password and name are required")
		return
	}
	user, err := h.store.CreateUser(req, models.RoleCustomer)
	if err != nil {
		h.err(w, http.StatusConflict, err.Error())
		return
	}
	token, err := middleware.GenerateToken(user.ID, user.Role, h.jwtSecret)
	if err != nil {
		h.err(w, http.StatusInternalServerError, "could not generate token")
		return
	}
	h.respond(w, http.StatusCreated, models.AuthResponse{Token: token, User: *user})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	user, err := h.store.GetUserByEmail(req.Email)
	if err != nil {
		h.err(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		h.err(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	token, err := middleware.GenerateToken(user.ID, user.Role, h.jwtSecret)
	if err != nil {
		h.err(w, http.StatusInternalServerError, "could not generate token")
		return
	}
	h.respond(w, http.StatusOK, models.AuthResponse{Token: token, User: *user})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, err := h.store.GetUserByID(userID(r))
	if err != nil {
		h.err(w, http.StatusNotFound, "user not found")
		return
	}
	h.respond(w, http.StatusOK, user)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateProfileRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	user, err := h.store.UpdateUser(userID(r), req)
	if err != nil {
		h.err(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respond(w, http.StatusOK, user)
}

// ─── Categories ───────────────────────────────────────────────────────────────

func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	h.respond(w, http.StatusOK, h.store.ListCategories())
}

func (h *Handler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCategoryRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	cat, err := h.store.CreateCategory(req)
	if err != nil {
		h.err(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respond(w, http.StatusCreated, cat)
}

func (h *Handler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	var req models.CreateCategoryRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	cat, err := h.store.UpdateCategory(id, req)
	if err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, cat)
}

func (h *Handler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	if err := h.store.DeleteCategory(id); err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, models.MessageResponse{Message: "deleted"})
}

// ─── Products ─────────────────────────────────────────────────────────────────

func (h *Handler) ListProducts(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	categoryID := q.Get("category_id")
	search := q.Get("search")
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit == 0 {
		limit = 12
	}
	products, total := h.store.ListProducts(categoryID, search, page, limit)
	if page < 1 {
		page = 1
	}
	h.respond(w, http.StatusOK, models.ProductListResponse{
		Products: products,
		Total:    total,
		Page:     page,
		Limit:    limit,
	})
}

func (h *Handler) GetProduct(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	p, err := h.store.GetProduct(id)
	if err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, p)
}

func (h *Handler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req models.CreateProductRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	p, err := h.store.CreateProduct(req)
	if err != nil {
		h.err(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respond(w, http.StatusCreated, p)
}

func (h *Handler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	var req models.UpdateProductRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	p, err := h.store.UpdateProduct(id, req)
	if err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, p)
}

func (h *Handler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	if err := h.store.DeleteProduct(id); err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, models.MessageResponse{Message: "deleted"})
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

func (h *Handler) GetCart(w http.ResponseWriter, r *http.Request) {
	h.respond(w, http.StatusOK, h.store.GetCart(userID(r)))
}

func (h *Handler) AddToCart(w http.ResponseWriter, r *http.Request) {
	var req models.AddToCartRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	if req.Quantity <= 0 {
		req.Quantity = 1
	}
	if err := h.store.AddToCart(userID(r), req); err != nil {
		h.err(w, http.StatusBadRequest, err.Error())
		return
	}
	h.respond(w, http.StatusOK, h.store.GetCart(userID(r)))
}

func (h *Handler) UpdateCartItem(w http.ResponseWriter, r *http.Request) {
	itemID := extractLastSegment(r.URL.Path)
	var body struct {
		Quantity int `json:"quantity"`
	}
	if err := h.decode(r, &body); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	if err := h.store.UpdateCartItem(userID(r), itemID, body.Quantity); err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, h.store.GetCart(userID(r)))
}

func (h *Handler) RemoveFromCart(w http.ResponseWriter, r *http.Request) {
	itemID := extractLastSegment(r.URL.Path)
	h.store.RemoveFromCart(userID(r), itemID)
	h.respond(w, http.StatusOK, h.store.GetCart(userID(r)))
}

// ─── Orders ───────────────────────────────────────────────────────────────────

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req models.CreateOrderRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	o, err := h.store.CreateOrder(userID(r), req)
	if err != nil {
		h.err(w, http.StatusBadRequest, err.Error())
		return
	}
	h.respond(w, http.StatusCreated, o)
}

func (h *Handler) ListMyOrders(w http.ResponseWriter, r *http.Request) {
	h.respond(w, http.StatusOK, h.store.ListOrdersByUser(userID(r)))
}

func (h *Handler) GetOrder(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	o, err := h.store.GetOrder(id)
	if err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	// Only owner or admin
	uid := userID(r)
	role, _ := r.Context().Value(middleware.UserRoleKey).(string)
	if o.UserID != uid && role != "admin" {
		h.err(w, http.StatusForbidden, "forbidden")
		return
	}
	h.respond(w, http.StatusOK, o)
}

// ─── Admin ────────────────────────────────────────────────────────────────────

func (h *Handler) AdminStats(w http.ResponseWriter, r *http.Request) {
	h.respond(w, http.StatusOK, h.store.GetAdminStats())
}

func (h *Handler) AdminListOrders(w http.ResponseWriter, r *http.Request) {
	h.respond(w, http.StatusOK, h.store.ListAllOrders())
}

func (h *Handler) AdminUpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	// strip /status suffix if present
	id = strings.TrimSuffix(id, "/status")
	// path: /api/admin/orders/{id}/status
	parts := strings.Split(r.URL.Path, "/")
	for i, p := range parts {
		if p == "orders" && i+1 < len(parts) {
			id = parts[i+1]
			break
		}
	}
	var req models.UpdateOrderStatusRequest
	if err := h.decode(r, &req); err != nil {
		h.err(w, http.StatusBadRequest, "invalid request")
		return
	}
	o, err := h.store.UpdateOrderStatus(id, req.Status)
	if err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, o)
}

func (h *Handler) AdminListUsers(w http.ResponseWriter, r *http.Request) {
	h.respond(w, http.StatusOK, h.store.ListUsers())
}

func (h *Handler) AdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	id := extractLastSegment(r.URL.Path)
	if err := h.store.DeleteUser(id); err != nil {
		h.err(w, http.StatusNotFound, err.Error())
		return
	}
	h.respond(w, http.StatusOK, models.MessageResponse{Message: "deleted"})
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func extractLastSegment(path string) string {
	parts := strings.Split(strings.TrimRight(path, "/"), "/")
	if len(parts) == 0 {
		return ""
	}
	return parts[len(parts)-1]
}
