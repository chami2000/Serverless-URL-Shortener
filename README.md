
# 🔗 Serverless URL Shortener (Cloudflare Workers)

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=for-the-badge&logo=cloudflare)
![Catppuccin](https://img.shields.io/badge/Theme-Catppuccin_Mocha-pink?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A lightning-fast, serverless URL shortener running on Cloudflare's Edge network. Features a modern, mobile-responsive Admin UI with built-in analytics, protected by secure authentication and Cloudflare Turnstile.

## ✨ Features

- **⚡ Edge Performance:** Redirects happen in milliseconds globally.
- **🎨 Beautiful UI:** Styled with **TailwindCSS** using the **Catppuccin Mocha** dark color palette.
- **📱 Mobile First:** Fully responsive design that works great on phones.
- **🔒 Secure Admin:** Username/Password login protected by **Cloudflare Turnstile (CAPTCHA)**.
- **📊 Analytics:** Track **Total Clicks**, **Top Countries**, and **OS/Device** types.
- **🔎 Search:** Instantly filter through your links.

---

## 🛠️ Prerequisites

1.  A [Cloudflare](https://dash.cloudflare.com/) account.
2.  Node.js and npm installed.
3.  Wrangler CLI (`npm install -g wrangler`).

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### 2. Create KV Namespace
You need a database to store the links. Run this command:

```bash
npx wrangler kv:namespace create URL_DB
```

*Copy the `id` outputted by this command.*

### 3. Configure `wrangler.toml`
Create or edit `wrangler.toml` in the root directory:

```toml
name = "url-shortener"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "LINKS"
id = "YOUR_KV_ID_FROM_STEP_2"
```

### 4. Get Turnstile Keys
1. Go to Cloudflare Dashboard > **Turnstile**.
2. Add your site/domain.
3. Copy the **Site Key** and **Secret Key**.

---

## 🔐 Environment Variables

You need to set specific variables for the login system to work. You can do this via the Cloudflare Dashboard (Workers > Settings > Variables) or via CLI.

| Variable Name | Type | Description |
| :--- | :--- | :--- |
| `ADMIN_USERNAME` | Secret/Text | Your desired login username. |
| `ADMIN_PASSWORD` | Secret/Text | Your desired login password. |
| `TURNSTILE_SITE_KEY` | Text | The **Public** key from Turnstile. |
| `TURNSTILE_SECRET` | Secret | The **Private** key from Turnstile. |

**Method A: Using CLI (Recommended)**
```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put TURNSTILE_SECRET
# For the site key (non-secret):
npx wrangler vars put TURNSTILE_SITE_KEY "0x4AAAA..."
```

**Method B: Cloudflare Dashboard**
Ensure your variables look like this:
![Variables Screenshot](https://i.imgur.com/Placeholder.png) 
*(You can upload the screenshot you showed me earlier here)*

---

## 📦 Deployment

Deploy the worker to the Cloudflare network:

```bash
npx wrangler deploy
```

Your shortener will be live at: `https://url-shortener.your-subdomain.workers.dev`

---

## 📖 Usage

1.  **Access Admin:** Go to `https://your-worker-url.com/admin`.
2.  **Login:** Enter your credentials and solve the Captcha.
3.  **Create Link:**
    *   **Slug:** The short part (e.g., `yt` for YouTube).
    *   **URL:** The destination (e.g., `https://youtube.com`).
4.  **View Stats:** Click the "Stats" button on any link to see a breakdown of clicks by country and OS.

---

## 🧱 Tech Stack

*   **Runtime:** Cloudflare Workers (JavaScript)
*   **Database:** Cloudflare KV
*   **Styling:** TailwindCSS (CDN)
*   **Icons:** FontAwesome
*   **Security:** Cloudflare Turnstile

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
```
