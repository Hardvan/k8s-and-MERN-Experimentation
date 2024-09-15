# Kubernetes & MERN Experimentation

This guide will walk you through creating a simple MERN stack application using Kubernetes, with local JSON data instead of MongoDB.

## Prerequisites

- Docker installed and configured
- Kubernetes cluster (you can use Minikube/Port Forwarding for local development)
- kubectl command-line tool installed and configured

## Project Structure

```plaintext
mern-k8s-app/
├── backend/
│   ├── data/
│   │   └── items.json
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── k8s/
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   └── frontend-service.yaml
└── .dockerignore
```

## Step 1: Set Up the Backend

1. Create the backend directory and navigate into it:

   ```bash
   mkdir -p mern-k8s-app/backend
   cd mern-k8s-app/backend
   ```

2. Initialize a new Node.js project and install dependencies:

   ```bash
   npm init -y
   npm install express cors
   ```

3. Create a `data` directory and an `items.json` file inside it:

   ```bash
   mkdir data
   echo '[
     {"id": 1, "name": "Item 1"},
     {"id": 2, "name": "Item 2"},
     {"id": 3, "name": "Item 3"}
   ]' > data/items.json
   ```

4. Create `server.js`:

   ```javascript
   const express = require("express");
   const cors = require("cors");
   const fs = require("fs");
   const path = require("path");

   const app = express();
   const PORT = process.env.PORT || 5000;

   // Allow requests from any origin
   app.use(cors({ origin: "*" }));
   app.use(express.json());

   app.get("/api/items", (req, res) => {
     const items = JSON.parse(
       fs.readFileSync(path.join(__dirname, "data", "items.json"), "utf8")
     );
     res.json(items);
   });

   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

5. Create a `Dockerfile` for the backend:

   ```dockerfile
   FROM node:14

   WORKDIR /usr/src/app

   COPY package*.json ./

   RUN npm install

   COPY . .

   EXPOSE 5000

   CMD ["node", "server.js"]
   ```

## Step 2: Set Up the Frontend

1. Create the frontend directory and navigate into it:

   ```bash
   cd ..
   npx create-react-app frontend
   cd frontend
   ```

2. Replace the content of `src/App.js`:

   ```jsx
   import React, { useState, useEffect } from "react";

   function App() {
     const [items, setItems] = useState([]);

     useEffect(() => {
       // Use environment variable or fallback to localhost for local development
       const backendUrl =
         process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

       fetch(`${backendUrl}/api/items`)
         .then((response) => response.json())
         .then((data) => setItems(data))
         .catch((error) => console.error("Error fetching items:", error));
     }, []);

     return (
       <div>
         <h1>Items</h1>
         <ul>
           {items.map((item) => (
             <li key={item.id}>{item.name}</li>
           ))}
         </ul>
       </div>
     );
   }

   export default App;
   ```

3. Create a `Dockerfile` for the frontend:

   ```dockerfile
   FROM node:14

   WORKDIR /usr/src/app

   COPY package*.json ./

   RUN npm install

   COPY . .

   RUN npm run build

   EXPOSE 3000

   CMD ["npx", "serve", "-s", "build"]
   ```

## Step 3: Build and Push Docker Images

1. Build and push the backend image:

   ```bash
   cd ../backend
   docker build -t your-docker-username/mern-backend:v1 .
   docker push your-docker-username/mern-backend:v1
   ```

2. Build and push the frontend image:

   ```bash
   cd ../frontend
   docker build -t your-docker-username/mern-frontend:v1 .
   docker push your-docker-username/mern-frontend:v1
   ```

## Step 4: Create Kubernetes Configurations

1. Create a `k8s` directory in the root of your project:

   ```bash
   cd ..
   mkdir k8s
   cd k8s
   ```

2. Create `backend-deployment.yaml`:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: backend-deployment
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: backend
     template:
       metadata:
         labels:
           app: backend
       spec:
         containers:
           - name: backend
             image: your-docker-username/mern-backend:v1
             ports:
               - containerPort: 5000
   ```

   > Note: Change the image to a new version if you update the backend image.
   > Eg: `your-docker-username/mern-backend:v2`

3. Create `backend-service.yaml`:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: backend-service
   spec:
     selector:
       app: backend
     ports:
       - protocol: TCP
         port: 80
         targetPort: 5000
   ```

4. Create `frontend-deployment.yaml`:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: frontend-deployment
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: frontend
     template:
       metadata:
         labels:
           app: frontend
       spec:
         containers:
           - name: frontend
             image: your-docker-username/mern-frontend:v1
             ports:
               - containerPort: 3000
   ```

   > Note: Change the image to a new version if you update the frontend image.
   > Eg: `your-docker-username/mern-frontend:v3`

5. Create `frontend-service.yaml`:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: frontend-service
   spec:
     type: LoadBalancer
     selector:
       app: frontend
     ports:
       - protocol: TCP
         port: 80
         targetPort: 3000
   ```

## Step 5: Deploy to Kubernetes

1. Apply the Kubernetes configurations:

   ```bash
   kubectl apply -f k8s/
   ```

2. Check the status of your deployments and services:

   ```bash
   kubectl get deployments
   kubectl get services
   kubectl get pods
   ```

## Step 6: Access Your Application

Use Port Forwarding to access the frontend & backend services:

1. For the frontend service:

   In your first terminal:

   ```bash
   kubectl port-forward service/frontend-service 8080:80
   ```

   This forwards your local port 8080 to port 80 of the frontend service.

2. For the backend service:

   Open a new terminal window and run:

   ```bash
   kubectl port-forward service/backend-service 5000:80
   ```

   This forwards your local port 5000 to port 80 of the backend service.

Now, you should have both services running and accessible:

- Frontend: http://localhost:8080
- Backend: http://localhost:5000

## Cleanup

To remove the deployments and services:

```bash
kubectl delete -f .
```

This setup provides a simple MERN stack application using Kubernetes, with local JSON data instead of MongoDB. The backend serves the JSON data, and the frontend displays it.
