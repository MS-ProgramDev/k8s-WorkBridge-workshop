# WorkBridge – Minikube Runbook (Windows, simple)

This guide brings up **Postgres + Backend + Frontend + Ingress** locally on Minikube.
It matches our current repo state (two Ingresses: **/api** with regex+rewrite, and **/** for static web).  
No nip.io. We use `minikube tunnel` + a `hosts` entry.

> TL;DR: build local images → load them into Minikube → apply YAMLs in order → enable ingress → run tunnel → add hosts → test.

---

## 0) Prereqs
- Docker Desktop **running**
- Minikube + `kubectl`
- Windows CMD or PowerShell

---

## 1) Start Minikube
```cmd
minikube start --driver=docker --cpus=2 --memory=4096
kubectl config use-context minikube
kubectl get storageclass
```
If there is **no default** StorageClass:
```cmd
minikube addons enable storage
```

---

## 2) Build local images and load them into the cluster (no DOCKER_HOST changes)

### Backend
```cmd
docker build -t workbridge-backend:local .
minikube image load workbridge-backend:local
```

### Frontend
```cmd
cd frontend
docker build -t workbridge-frontend:local .
minikube image load workbridge-frontend:local
cd ..
```

---

## 3) Deploy DB (Postgres inside the cluster)
```cmd
kubectl apply -f k8s/namespace-00.yaml
kubectl apply -f k8s/db-secret-01.yaml
kubectl apply -f k8s/db-service-02.yaml
kubectl apply -f k8s/db-statefulset-03.yaml
kubectl -n workbridge get pods,svc,pvc
```
Expected: `postgres-0` is **Running**, PVC is **Bound**, service `postgres:5432` exists.

---

## 4) Deploy Backend and run DB migration
```cmd
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

kubectl apply -f k8s/db-migration-job.yaml
kubectl -n workbridge logs job/db-migration
```

Quick checks:
```cmd
kubectl -n workbridge get deploy,pod,svc
kubectl -n workbridge get endpoints backend
kubectl -n workbridge logs deploy/backend --tail=50
```

---

## 5) Deploy Frontend
```cmd
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl -n workbridge get deploy,pod,svc
kubectl -n workbridge get endpoints frontend
```

---

## 6) Ingress + tunnel + hosts

Enable ingress and apply our two Ingress resources:
```cmd
minikube addons enable ingress
kubectl apply -f k8s/ingress-api.yaml
kubectl apply -f k8s/ingress-web.yaml
kubectl -n workbridge get ingress
```

Open a new **Administrator** CMD window and keep it open:
```cmd
minikube tunnel
```

Edit hosts (in Notepad as Administrator):  
`C:\Windows\System32\drivers\etc\hosts`  
Add:
```
127.0.0.1   workbridge.local
```
Then:
```cmd
ipconfig /flushdns
```

---

## 7) End-to-end smoke tests
```cmd
# Backend health via Ingress
curl -H "Host: workbridge.local" http://127.0.0.1/api/healthz
curl -H "Host: workbridge.local" http://127.0.0.1/api/readyz

# Frontend root
curl -H "Host: workbridge.local" http://127.0.0.1/ -I

# Optional: verify a real static file referenced by index.html (replace <hash>):
# curl -H "Host: workbridge.local" http://127.0.0.1/static/js/main.<hash>.js -I
```

Open the browser:  
`http://workbridge.local/`

Use DevTools → Network to see `/api/...` calls and static files served (`/static/...`).

---

## 8) Common issues

- **ImagePullBackOff**  
  Forgot to load images into Minikube:
  ```cmd
  minikube image load workbridge-backend:local
  minikube image load workbridge-frontend:local
  kubectl -n workbridge rollout restart deploy/backend
  kubectl -n workbridge rollout restart deploy/frontend
  ```

- **Service has no Endpoints**  
  Labels mismatch. Ensure:
  - Deployment pod template has `labels: app: <name>`
  - Service `spec.selector.app` matches exactly.

- **White page / 404 for static**  
  We split Ingresses:
  - `ingress-api.yaml` → **regex+rewrite only for** `/api`
  - `ingress-web.yaml` → `/` (no rewrite)

- **CORS blocked in browser**  
  Update backend `ALLOWED_ORIGINS`:
  ```cmd
  kubectl -n workbridge set env deploy/backend ALLOWED_ORIGINS=http://workbridge.local,http://localhost:3000
  kubectl -n workbridge rollout restart deploy/backend
  ```

---

## 9) Teardown / clean
```cmd
# (optional) delete all our resources
kubectl delete -f k8s/ingress-web.yaml  2>NUL
kubectl delete -f k8s/ingress-api.yaml  2>NUL
kubectl delete -f k8s/frontend-service.yaml 2>NUL
kubectl delete -f k8s/frontend-deployment.yaml 2>NUL
kubectl delete -f k8s/db-migration-job.yaml 2>NUL
kubectl delete -f k8s/backend-service.yaml 2>NUL
kubectl delete -f k8s/backend-deployment.yaml 2>NUL
kubectl delete -f k8s/db-statefulset-03.yaml 2>NUL
kubectl delete -f k8s/db-service-02.yaml 2>NUL
kubectl delete -f k8s/db-secret-01.yaml 2>NUL
kubectl delete -f k8s/namespace-00.yaml 2>NUL
```

---

## Appendix: Expected file names (k8s/)
- `namespace-00.yaml`
- `db-secret-01.yaml`
- `db-service-02.yaml`
- `db-statefulset-03.yaml`
- `backend-deployment.yaml`
- `backend-service.yaml`
- `db-migration-job.yaml`
- `frontend-deployment.yaml`
- `frontend-service.yaml`
- `ingress-api.yaml`
- `ingress-web.yaml`

> NOTE: Keep **image names** in the YAML matching the local tags you build and load:
> - `workbridge-backend:local`
> - `workbridge-frontend:local`
