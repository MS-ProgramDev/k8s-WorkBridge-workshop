# WorkBridge - Setup Instructions 🛠️

This guide explains how to set up the WorkBridge project on your local machine for development.

---

## ✅ Prerequisites

Make sure you have the following installed:

- **Python 3.11 (64-bit)** – Required version.
- **PostgreSQL** – Make sure it is running and accessible.
- **Git** – To clone and manage the repository.
- **PyCharm** or any IDE of your choice (recommended).

---

## 📁 Project Structure Overview

```
FastAPIProject/
├── routers/
├── models/
├── schemas/
├── db/
├── utils/
├── tests/
├── main.py
├── create_db_table.py
├── requirements.txt
└── .venv/ (virtual environment)
```

---

## 🚀 Setup Steps

### 1. Clone the repository
```bash
git clone https://github.com/MS-ProgramDev/k8s-WorkBridge-workshop.git
cd k8s-WorkBridge-workshop
```

### 2. Create virtual environment (Python 3.11)
```bash
python -m venv .venv
```

### 3. Activate the virtual environment

- **Windows (PowerShell):**
```bash
.\.venv\Scripts\Activate.ps1
```

- **Linux/macOS:**
```bash
source .venv/bin/activate
```

### 4. Install project dependencies
```bash
pip install -r requirements.txt
```

---

## 🧠 Database Setup

### 1. Start your PostgreSQL server

Ensure your PostgreSQL is running and configured with:

- **Database:** `workbridge`
- **User:** `postgres`
- **Password:** `postgres`
- **Port:** `5432`

### 2. Create the database (if not exists)

You can use pgAdmin or a terminal client to create the `workbridge` database.

### 3. Create tables
```bash
python create_db_table.py
```

---

## 🖥️ Running the Project

```bash
uvicorn main:app --reload
```

Visit [http://localhost:8000/docs](http://localhost:8000/docs) to explore the API.

---

## 🪵 Logs

All logs are written to:

```
logs/workbridge.log
```

Make sure the `/logs` directory exists or is created automatically.

---

## ❗ Troubleshooting

- Ensure `.venv` uses Python 3.11, not older or newer versions.
- If you're stuck on port 8000, check for zombie processes using:
```bash
netstat -aon | findstr :8000
```
and kill the process with:
```bash
taskkill /PID <pid> /F
```

---

## 📩 Need Help?

Open an issue or ping in the project group.

Happy coding! 💻