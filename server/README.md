# 📘 Expense Tracker API Documentation

A Node.js + Express + MongoDB backend for a personal expense tracking app.

---

## 🌐 Base URL

```
http://localhost:5000/api
```

---

## 🔐 Authentication

All endpoints (except login/register) require a **JWT token** in the headers:

```
Authorization: Bearer <token>
```

---

## 🧑‍💼 User Auth

### 🔸 Register

`POST /auth/register`

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**

```json
{
  "token": "JWT_TOKEN"
}
```

---

### 🔸 Login

`POST /auth/login`

**Body:**

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**

```json
{
  "token": "JWT_TOKEN"
}
```

---

## 📁 Categories

### 🔸 Create Category

`POST /categories`

**Headers:**
`Authorization: Bearer <token>`

**Body:**

```json
{
  "name": "Food",
  "type": "expense",  // or "income"
  "icon": "🍔"
}
```

**Response:**

```json
{
  "_id": "...",
  "name": "Food",
  "type": "expense",
  "icon": "🍔",
  "userId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 🔸 Get All Categories

`GET /categories`

**Headers:**
`Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "...",
    "name": "Food",
    "type": "expense",
    "icon": "🍔",
    "userId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## 📦 Items

### 🔸 Create Item

`POST /items`

**Headers:**
`Authorization: Bearer <token>`

**Body:**

```json
{
  "name": "Chicken",
  "categoryId": "<CATEGORY_ID>"
}
```

**Response:**

```json
{
  "_id": "...",
  "name": "Chicken",
  "categoryId": "...",
  "userId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 🔸 Get All Items

`GET /items`

**Headers:**
`Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "...",
    "name": "Chicken",
    "categoryId": "...",
    "userId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## 💸 Transactions

### 🔸 Create Transaction

`POST /transactions`

**Headers:**
`Authorization: Bearer <token>`

**Body:**

```json
{
  "title": "Bought Chicken",
  "amount": 15.75,
  "type": "expense", // or "income"
  "date": "2025-08-04T00:00:00.000Z",
  "notes": "Sunday market",
  "categoryId": "<CATEGORY_ID>",
  "itemId": "<ITEM_ID>"
}
```

**Response:**

```json
{
  "_id": "...",
  "title": "Bought Chicken",
  "amount": 15.75,
  "type": "expense",
  "date": "2025-08-04T00:00:00.000Z",
  "notes": "Sunday market",
  "categoryId": "...",
  "itemId": "...",
  "userId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 🔸 Get All Transactions

`GET /transactions`

**Headers:**
`Authorization: Bearer <token>`

**Response:**

```json
[
  {
    "_id": "...",
    "title": "Bought Chicken",
    "amount": 15.75,
    "type": "expense",
    "date": "2025-08-04T00:00:00.000Z",
    "notes": "Sunday market",
    "categoryId": {
      "_id": "...",
      "name": "Food"
    },
    "itemId": {
      "_id": "...",
      "name": "Chicken"
    },
    "userId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

## 📊 Dashboard Logic (Frontend)

You can use the data from `/transactions` to calculate:

* Total amount per category for the current month
* Total amount per item
* Group by `type`, `category`, `item`, or `date`
* Chart using [`Chart.js`](https://www.chartjs.org/) or [`Recharts`](https://recharts.org/)

---

## 📁 Export (Feature to add later)

**Example Endpoint (Future):**

```
GET /transactions/export?month=08&year=2025&type=expense
```

Returns a CSV or JSON file for reporting.

---

## ✅ Status Codes

* `200 OK` – Success
* `201 Created` – Successful creation
* `400 Bad Request` – Invalid inputs
* `401 Unauthorized` – Missing or invalid token
* `404 Not Found` – Resource not found
* `500 Server Error` – Internal error

---

## 🛡 Security

* Passwords are hashed with **bcrypt**
* Authentication is handled using **JWT**
* All user-specific data is **scoped by user ID**

---

## 🤖 MCP Server Integration

DevinBook includes a built-in **Model Context Protocol (MCP)** server that allows AI assistants (like Claude) to directly interact with your expense data.

### Connection Details
* **Server URL:** `http://localhost:5000/api/mcp` (or your production URL `https://.../api/mcp`)
* **Authentication:** The MCP server requires a Bearer token. You must use your account's `apiKey` as the token.

### How to Connect in Claude Desktop
1. Open Claude Desktop settings.
2. Go to the **Developer** section and click **Edit config**.
3. Add the following to your `mcp.json` file, replacing `<YOUR_API_KEY>` with your actual DevinBook API key (found in your account settings or database):

```json
{
  "mcpServers": {
    "devinbook": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/proxy", "http://localhost:5000/api/mcp"],
      "env": {
        "AUTHORIZATION": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```
*(Note: Since the server uses a standard HTTP endpoint, you might need an HTTP-to-stdio proxy or configure it according to Claude's latest remote server documentation).*

### Available AI Tools
* `list_categories`: View your income/expense categories.
* `list_transactions`: Query transactions with flexible filters (dates, amounts, keywords).
* `get_expense_totals`: Get aggregated totals for specific time periods.
* `get_account_summary`: View an overall snapshot of your finances.
* `add_transaction`: Log a new expense or income.
* `create_category`: Add a new category.