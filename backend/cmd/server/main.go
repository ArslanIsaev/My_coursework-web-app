package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sportshop/internal/handlers"
	"sportshop/internal/middleware"
	"sportshop/internal/storage"
)

func main() {
	port := getEnv("PORT", "8080")
	dataDir := getEnv("DATA_DIR", "./data")
	jwtSecret := getEnv("JWT_SECRET", "changeme")
	adminEmail := getEnv("ADMIN_EMAIL", "admin@sportshop.ru")
	adminPassword := getEnv("ADMIN_PASSWORD", "Admin123!")

	uploadsDir := filepath.Join(dataDir, "uploads")
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Fatalf("create uploads dir: %v", err)
	}

	store, err := storage.NewStore(dataDir)
	if err != nil {
		log.Fatalf("init store: %v", err)
	}
	if err := store.SeedIfEmpty(adminEmail, adminPassword); err != nil {
		log.Fatalf("seed: %v", err)
	}

	h := handlers.New(store, jwtSecret)
	mux := buildRouter(h, jwtSecret, uploadsDir)

	log.Printf("SportShop backend listening on :%s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func buildRouter(h *handlers.Handler, jwtSecret string, uploadsDir string) http.Handler {
	mux := http.NewServeMux()

	auth := middleware.Auth(jwtSecret)
	adminOnly := middleware.AdminOnly

	// Health
	mux.HandleFunc("/api/health", h.Health)

	// Static uploads — served without auth so <img> tags work
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir))))

	// Upload image (admin only)
	mux.Handle("/api/admin/upload", auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.NotFound(w, r)
			return
		}
		uploadImage(w, r, uploadsDir)
	}))))

	// Auth
	mux.HandleFunc("/api/auth/register", method("POST", h.Register))
	mux.HandleFunc("/api/auth/login", method("POST", h.Login))
	mux.Handle("/api/auth/me", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.Me(w, r)
		case http.MethodPut:
			h.UpdateProfile(w, r)
		default:
			http.NotFound(w, r)
		}
	})))

	// Categories (public read, admin write)
	mux.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.ListCategories(w, r)
			return
		}
		auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodPost {
				h.CreateCategory(w, r)
			} else {
				http.NotFound(w, r)
			}
		}))).ServeHTTP(w, r)
	})
	mux.Handle("/api/categories/", auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			h.UpdateCategory(w, r)
		case http.MethodDelete:
			h.DeleteCategory(w, r)
		default:
			http.NotFound(w, r)
		}
	}))))

	// Products (public read, admin write)
	mux.HandleFunc("/api/products", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.ListProducts(w, r)
			return
		}
		auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodPost {
				h.CreateProduct(w, r)
			} else {
				http.NotFound(w, r)
			}
		}))).ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/products/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.GetProduct(w, r)
			return
		}
		auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch r.Method {
			case http.MethodPut:
				h.UpdateProduct(w, r)
			case http.MethodDelete:
				h.DeleteProduct(w, r)
			default:
				http.NotFound(w, r)
			}
		}))).ServeHTTP(w, r)
	})

	// Cart (auth required)
	mux.Handle("/api/cart", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetCart(w, r)
		case http.MethodPost:
			h.AddToCart(w, r)
		default:
			http.NotFound(w, r)
		}
	})))
	mux.Handle("/api/cart/", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			h.UpdateCartItem(w, r)
		case http.MethodDelete:
			h.RemoveFromCart(w, r)
		default:
			http.NotFound(w, r)
		}
	})))

	// Orders (auth required)
	mux.Handle("/api/orders", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.ListMyOrders(w, r)
		case http.MethodPost:
			h.CreateOrder(w, r)
		default:
			http.NotFound(w, r)
		}
	})))
	mux.Handle("/api/orders/", auth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			h.GetOrder(w, r)
		} else {
			http.NotFound(w, r)
		}
	})))

	// Admin routes
	mux.Handle("/api/admin/stats", auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.AdminStats(w, r)
	}))))
	mux.Handle("/api/admin/orders", auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.AdminListOrders(w, r)
	}))))
	mux.Handle("/api/admin/orders/", auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/status") && r.Method == http.MethodPatch {
			h.AdminUpdateOrderStatus(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))))
	mux.Handle("/api/admin/users", auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.AdminListUsers(w, r)
	}))))
	mux.Handle("/api/admin/users/", auth(adminOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			h.AdminDeleteUser(w, r)
		} else {
			http.NotFound(w, r)
		}
	}))))

	return middleware.JSON(middleware.CORS(mux))
}

// uploadImage handles multipart file upload, saves to uploadsDir, returns JSON with URL.
func uploadImage(w http.ResponseWriter, r *http.Request, uploadsDir string) {
	// 5 MB limit
	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "file too large (max 5 MB)"})
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "field 'image' required"})
		return
	}
	defer file.Close()

	// Allow only images
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
	if !allowed[ext] {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "only jpg/png/webp/gif allowed"})
		return
	}

	// Unique filename: timestamp + original name
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(header.Filename))
	dst, err := os.Create(filepath.Join(uploadsDir, filename))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "could not save file"})
		return
	}
	defer dst.Close()
	if _, err := io.Copy(dst, file); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "could not write file"})
		return
	}

	url := "/uploads/" + filename
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"url": url})
}

func method(m string, fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != m {
			http.Error(w, `{"error":"method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}
		fn(w, r)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
