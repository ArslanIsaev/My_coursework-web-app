FROM golang:1.22-alpine AS builder
WORKDIR /app
# Install git so go mod can fetch from VCS
RUN apk add --no-cache git ca-certificates
COPY go.mod ./
# Let Go resolve and download everything; go.sum is generated automatically
RUN go mod tidy
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o sportshop ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates wget
WORKDIR /app
COPY --from=builder /app/sportshop .
EXPOSE 8080
CMD ["./sportshop"]
