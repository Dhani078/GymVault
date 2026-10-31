# GymVault Docker Container Deployment & Hardening Guide

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Container Architecture & Security Standards

GymVault provides an enterprise-hardened, multi-stage Docker container specification designed for self-hosted environments, private cloud instances, and on-premise strength facility servers.

Security Standards Applied:
- Multi-Stage Isolated Build: Development tools, compilers, and node_modules development dependencies are discarded in Stage 1. Only compiled web distribution assets reach the final runtime.
- Non-Root Unprivileged Execution: Runs strictly as unprivileged user UID 101 on an Alpine Linux base (nginxinc/nginx-unprivileged:alpine-slim).
- Unprivileged Port: Binds to TCP port 8080 instead of standard privileged port 80, eliminating Linux root capability requirements.
- Automated Healthcheck: Probes HTTP service availability every 30 seconds with a 5-second timeout and 3-strike failure threshold.
- Strict Build Boundary (.dockerignore): Blocks secrets, environment files, git repositories, and audit logs from leaking into image layers.

---

## 2. Building the Production Image

To build the hardened container image:

```bash
docker build -t gymvault:2.5.0 .
```

Verify that the image builds without root escalation warnings and confirms unprivileged user 101.

---

## 3. Running the Container

### Standard Standalone Run
```bash
docker run -d \
  --name gymvault-app \
  --restart unless-stopped \
  -p 8080:8080 \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/run \
  --security-opt no-new-privileges:true \
  gymvault:2.5.0
```

Flags Explanation:
- -p 8080:8080: Maps host port 8080 to unprivileged container port 8080.
- --read-only: Enforces a read-only root filesystem, neutralizing persistence and container modification exploits.
- --tmpfs: Mounts writable scratch memory for temporary Nginx process IDs and cache without touching the root filesystem.
- --security-opt no-new-privileges:true: Blocks setuid and privilege escalation binaries inside the container.

---

## 4. Healthcheck & Inspection

Check health status of the running container:

```bash
docker inspect --format='{{json .State.Health}}' gymvault-app
```

Expected Output Status: "healthy"

---

## 5. Reverse Proxy Configuration (Nginx Host)

When deploying behind a reverse proxy (e.g. Cloudflare, Traefik, or host Nginx), forward traffic to port 8080:

```nginx
server {
    listen 443 ssl http2;
    server_name gym.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
