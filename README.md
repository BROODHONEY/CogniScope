# CogniScope (v0.1 Beta)

An interactive web app that lets you **see how an AI thinks** — step by step.

Instead of showing only the final answer, this project visualizes the reasoning process using smooth animations and a modern UI.

Built with a production-style architecture and designed to be portfolio-ready.

---

# 🏗️ Tech Stack

## Frontend

* **React + Vite** — fast development
* **Framer Motion** — high-quality animations
* **shadcn/ui** — beautiful, accessible components
* **Axios** — API communication
* **Lucide Icons** — clean iconography

## Backend

* **Node.js**
* **Express.js**
* **Groq SDK** — lightning-fast LLM responses
* **dotenv** — secure environment variables

---

# 📂 Project Structure

```
CogniScope
│
├── backend
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend
    ├── src
    ├── components
    └── package.json
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/BROODHONEY/CogniScope.git
cd CogniScope
```

---

# 🔐 Environment Variables

Create a `.env` file inside the **backend** folder:

```
GROQ_API_KEY=your_api_key_here
```

👉 Get your key from:

[https://console.groq.com/](https://console.groq.com/)

⚠️ Never commit your `.env` file.

---

# ▶️ Running the App Locally

## Start Backend

```bash
cd backend
npm install
node server.js
```

You should see:

```
Server running on port 5000
```

---

## Start Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Visit:

```
http://localhost:5173
```

---

# 🧪 Example Prompts

Try asking:

```
If A > B and B > C, who is the largest?
```

```
Should I learn Python or JavaScript first?
```

```
What is 47 × 83? Explain step-by-step.
```

---

# 🧠 How It Works

### Flow:

```
User Input
   ↓
React Frontend
   ↓
Express Backend
   ↓
Groq LLM
   ↓
Reasoning + Final Answer
   ↓
Animated Visualization
```

The backend structures the prompt to encourage step-based explanations, then parses the response and streams it to the UI for animation.

---

# 🌟 Future Upgrades (High Impact)

## 🔥 Decision Tree Visualization

Use **React Flow** to render reasoning as a graph.

This instantly upgrades the project from “cool demo” → “serious AI tool”.

## 🤖 Visualizing your LLM model

Upload your own LLM model and understand how it reasons your quries.

---

# 👨‍💻 Author

Built by **Roshan** — aspiring AI engineer building real-world intelligent systems.

---

# ⭐ If You Like This Project

Give it a star ⭐
Fork it 🍴
Build something dangerous.
