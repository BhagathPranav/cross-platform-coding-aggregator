FROM alpine:latest

# Install dependencies for downloading and running PocketBase
RUN apk add --no-cache unzip ca-certificates curl

# Download PocketBase Linux AMD64 (the standard cloud environment architecture)
ADD https://github.com/pocketbase/pocketbase/releases/download/v0.24.4/pocketbase_0.24.4_linux_amd64.zip /tmp/pb.zip

# Extract binary and set executable permission
RUN unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

# Expose port 8080 for Render / Fly.io routing
EXPOSE 8080

# Start PocketBase, binding to all interfaces on port 8080 with persistent data directory
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
