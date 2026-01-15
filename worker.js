/**
 * CLOUDFLARE WORKER URL SHORTENER
 * Features: Analytics, Mobile UI, Catppuccin Theme, Username/Pass + Turnstile
 */

const HTML_UI = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Link Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <!-- Turnstile API -->
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        cat: {
                            base: '#1e1e2e', mantle: '#181825', surface0: '#313244', surface1: '#45475a',
                            text: '#cdd6f4', subtext: '#a6adc8', blue: '#89b4fa', lavender: '#b4befe',
                            red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af', peach: '#fab387', overlay: '#6c7086'
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body { background-color: #1e1e2e; color: #cdd6f4; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #181825; }
        ::-webkit-scrollbar-thumb { background: #45475a; border-radius: 4px; }
        .modal-open { overflow: hidden; }
    </style>
</head>
<body class="min-h-screen flex flex-col font-sans selection:bg-cat-blue selection:text-cat-base">

    <div id="toast-container" class="fixed top-5 right-5 z-[60] flex flex-col gap-2"></div>

    <!-- Stats Modal -->
    <div id="stats-modal" class="fixed inset-0 z-50 hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300">
        <div class="bg-cat-mantle border border-cat-surface0 w-full max-w-lg rounded-2xl shadow-2xl transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]" id="stats-content">
            <div class="p-4 border-b border-cat-surface0 flex justify-between items-center">
                <h3 class="font-bold text-lg text-cat-lavender"><i class="fa-solid fa-chart-pie mr-2"></i>Analytics</h3>
                <button onclick="closeModal()" class="text-cat-overlay hover:text-cat-red"><i class="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div class="p-6 overflow-y-auto">
                <div class="text-center mb-6">
                    <h2 id="modal-slug" class="text-2xl font-bold text-cat-blue mb-1">/slug</h2>
                    <a id="modal-url" href="#" target="_blank" class="text-xs text-cat-subtext hover:underline truncate block max-w-xs mx-auto">...</a>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-cat-base p-4 rounded-xl text-center border border-cat-surface0">
                        <div class="text-cat-overlay text-xs uppercase font-bold">Total Clicks</div>
                        <div id="modal-clicks" class="text-3xl font-bold text-cat-green mt-1">0</div>
                    </div>
                    <div class="bg-cat-base p-4 rounded-xl text-center border border-cat-surface0">
                        <div class="text-cat-overlay text-xs uppercase font-bold">Top Country</div>
                        <div id="modal-top-country" class="text-xl font-bold text-cat-peach mt-2 truncate">-</div>
                    </div>
                </div>
                <div id="country-list" class="space-y-3 mb-6"></div>
                <div id="os-list" class="space-y-3"></div>
            </div>
        </div>
    </div>

    <!-- LOGIN VIEW -->
    <div id="login-view" class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-cat-mantle p-8 rounded-2xl shadow-2xl border border-cat-surface0">
            <div class="text-center mb-6">
                <i class="fa-solid fa-shield-cat text-4xl text-cat-blue mb-4"></i>
                <h1 class="text-2xl font-bold">Admin Access</h1>
            </div>
            
            <div class="space-y-4">
                <div class="relative">
                    <i class="fa-solid fa-user absolute left-4 top-3.5 text-cat-overlay"></i>
                    <input type="text" id="username" class="w-full bg-cat-base border border-cat-surface1 rounded-xl py-3 pl-10 pr-4 focus:border-cat-blue focus:outline-none" placeholder="Username">
                </div>
                <div class="relative">
                    <i class="fa-solid fa-key absolute left-4 top-3.5 text-cat-overlay"></i>
                    <input type="password" id="password" class="w-full bg-cat-base border border-cat-surface1 rounded-xl py-3 pl-10 pr-4 focus:border-cat-blue focus:outline-none" placeholder="Password">
                </div>

                <!-- TURNSTILE WIDGET -->
                <div class="flex justify-center my-4">
                    <div class="cf-turnstile" data-sitekey="{{SITE_KEY}}" data-theme="dark"></div>
                </div>

                <button onclick="performLogin()" class="w-full bg-cat-blue text-cat-base font-bold py-3 rounded-xl hover:bg-cat-lavender transition shadow-lg shadow-cat-blue/20">Login</button>
            </div>
        </div>
    </div>

    <!-- DASHBOARD VIEW -->
    <div id="dashboard-view" class="hidden flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <header class="flex justify-between items-center mb-8">
            <div class="flex items-center gap-3">
                <div class="bg-cat-blue/10 p-2 rounded-lg"><i class="fa-solid fa-link text-cat-blue text-xl"></i></div>
                <h1 class="text-xl font-bold">Shortener <span class="text-cat-overlay text-sm font-normal ml-2">v3.0</span></h1>
            </div>
            <button onclick="logout()" class="text-cat-red text-sm font-medium hover:bg-cat-red/10 px-3 py-2 rounded-lg transition">Logout</button>
        </header>

        <div class="bg-cat-mantle p-5 rounded-2xl shadow-lg border border-cat-surface0 mb-8">
            <div class="flex flex-col md:flex-row gap-3">
                <input type="text" id="slug" placeholder="Slug" class="flex-1 bg-cat-base border border-cat-surface1 rounded-lg py-3 px-4 focus:border-cat-blue focus:outline-none">
                <input type="url" id="url" placeholder="https://..." class="flex-[2] bg-cat-base border border-cat-surface1 rounded-lg py-3 px-4 focus:border-cat-green focus:outline-none">
                <button onclick="addLink()" class="bg-cat-green text-cat-base font-bold px-6 py-3 rounded-lg hover:bg-opacity-90 transition">Shorten</button>
            </div>
        </div>

        <div class="bg-cat-mantle rounded-2xl shadow-lg border border-cat-surface0 min-h-[400px]">
            <div class="p-4 border-b border-cat-surface0 flex justify-between items-center">
                <h3 class="font-semibold">Active Links</h3>
                <input type="text" id="search" placeholder="Search..." onkeyup="filterLinks()" class="bg-cat-base border border-cat-surface0 rounded-lg py-1.5 px-3 text-sm focus:border-cat-blue focus:outline-none w-32 md:w-64">
            </div>
            <div id="links-list" class="divide-y divide-cat-surface0"></div>
        </div>
    </div>

    <script>
        const API_URL = '/api';
        let allLinks = [];

        function showToast(msg, type='success') {
            const el = document.createElement('div');
            el.className = \`\${type==='error'?'bg-cat-red':'bg-cat-green'} text-cat-base px-4 py-3 rounded-lg shadow-xl mb-2 font-bold text-sm\`;
            el.innerHTML = msg;
            document.getElementById('toast-container').appendChild(el);
            setTimeout(() => el.remove(), 3000);
        }

        // --- AUTH LOGIC ---
        function getAuthHeader() { 
            return localStorage.getItem('cf_shortener_token'); 
        }

        async function performLogin() {
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            // Get Turnstile Token
            const formData = new FormData();
            const token = formData.get('cf-turnstile-response'); // Usually auto-injected, but let's access widget
            const widgetId = turnstile.getResponse();

            if (!user || !pass) return showToast("Enter credentials", "error");
            if (!widgetId) return showToast("Complete the Captcha", "error");

            // Verify with Server
            try {
                const res = await fetch(API_URL + '/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user, password: pass, cfToken: widgetId })
                });

                if (res.ok) {
                    // Create Basic Auth Header
                    const auth = 'Basic ' + btoa(user + ':' + pass);
                    localStorage.setItem('cf_shortener_token', auth);
                    showToast("Login Successful");
                    loadLinks();
                } else {
                    showToast("Invalid Credentials or Captcha", "error");
                    turnstile.reset(); // Reset captcha on fail
                }
            } catch(e) {
                showToast("Login error", "error");
            }
        }

        function logout() {
            localStorage.removeItem('cf_shortener_token');
            location.reload();
        }

        async function loadLinks() {
            const auth = getAuthHeader();
            if(!auth) return;

            try {
                const res = await fetch(API_URL + '/links', { headers: { 'Authorization': auth } });
                
                if(res.status === 401) { logout(); return; }
                
                document.getElementById('login-view').classList.add('hidden');
                document.getElementById('dashboard-view').classList.remove('hidden');
                
                allLinks = await res.json();
                renderLinks(allLinks);
            } catch(e) { showToast("Connection error", "error"); }
        }

        function renderLinks(links) {
            const container = document.getElementById('links-list');
            container.innerHTML = '';
            if(links.length === 0) { container.innerHTML = '<div class="p-8 text-center text-cat-overlay">No links found</div>'; return; }
            links.forEach(link => {
                const stats = link.stats || { clicks: 0 };
                const div = document.createElement('div');
                div.className = "p-4 hover:bg-cat-surface0/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group";
                div.innerHTML = \`
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="text-cat-blue font-mono font-bold">/\${link.name}</span>
                            <button onclick="navigator.clipboard.writeText('\${window.location.origin}/\${link.name}'); showToast('Copied!')" class="text-cat-overlay hover:text-cat-text"><i class="fa-regular fa-copy"></i></button>
                        </div>
                        <div class="text-cat-subtext text-xs truncate">\${link.url}</div>
                    </div>
                    <div class="flex items-center gap-4 justify-between md:justify-end w-full md:w-auto">
                        <div class="flex items-center gap-2 text-cat-yellow text-sm font-mono bg-cat-yellow/10 px-2 py-1 rounded"><i class="fa-solid fa-bolt"></i> \${stats.clicks}</div>
                        <div class="flex gap-2">
                            <button onclick='openStats(\${JSON.stringify(link)})' class="bg-cat-surface1 hover:text-cat-base text-cat-text px-3 py-1.5 rounded text-xs transition">Stats</button>
                            <button onclick="deleteLink('\${link.name}')" class="bg-cat-red/10 text-cat-red px-3 py-1.5 rounded text-xs transition"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>\`;
                container.appendChild(div);
            });
        }

        function openStats(link) {
            const stats = link.stats || { clicks: 0, countries: {}, os: {} };
            document.getElementById('modal-slug').innerText = '/' + link.name;
            document.getElementById('modal-url').innerText = link.url;
            document.getElementById('modal-url').href = link.url;
            document.getElementById('modal-clicks').innerText = stats.clicks;
            
            // Render Bars helper
            const render = (data, id, color) => {
                const box = document.getElementById(id); box.innerHTML = '';
                const sorted = Object.entries(data || {}).sort((a,b) => b[1] - a[1]);
                if(sorted.length > 0) document.getElementById('modal-top-country').innerText = sorted[0][0];
                sorted.forEach(([k, v]) => {
                    const p = (v / (sorted[0][1]||1)) * 100;
                    box.innerHTML += \`<div class="text-xs mb-1 flex justify-between"><span>\${k}</span><span>\${v}</span></div><div class="bg-cat-surface0 rounded-full h-1.5 mb-2"><div class="bg-\${color} h-1.5 rounded-full" style="width:\${p}%"></div></div>\`;
                });
            };
            render(stats.countries, 'country-list', 'cat-blue');
            render(stats.os, 'os-list', 'cat-green');
            
            const m = document.getElementById('stats-modal');
            m.classList.remove('hidden'); void m.offsetWidth; m.classList.remove('opacity-0');
            document.getElementById('stats-content').classList.remove('scale-95');
        }

        function closeModal() {
            const m = document.getElementById('stats-modal');
            m.classList.add('opacity-0');
            document.getElementById('stats-content').classList.add('scale-95');
            setTimeout(() => m.classList.add('hidden'), 300);
        }

        async function addLink() {
            const slug = document.getElementById('slug').value.trim();
            const url = document.getElementById('url').value.trim();
            if(!slug || !url) return showToast("Missing fields", "error");
            const res = await fetch(API_URL + '/links', {
                method: 'POST', headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, url })
            });
            if(res.ok) { document.getElementById('slug').value = ''; loadLinks(); }
            else showToast("Error", "error");
        }

        async function deleteLink(slug) {
            if(!confirm("Delete?")) return;
            await fetch(API_URL + '/links', {
                method: 'DELETE', headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug })
            });
            loadLinks();
        }

        function filterLinks() {
            const q = document.getElementById('search').value.toLowerCase();
            renderLinks(allLinks.filter(l => l.name.includes(q) || l.url.includes(q)));
        }

        if(getAuthHeader()) loadLinks();
    </script>
</body>
</html>
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // --- Helpers ---
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Helper to check credentials
    const checkAuth = (req) => {
        const auth = req.headers.get("Authorization");
        if (!auth || !auth.startsWith("Basic ")) return false;
        // Decode "Basic base64"
        const base64 = auth.split(" ")[1];
        try {
            const decoded = atob(base64);
            const [user, pass] = decoded.split(":");
            // Check against Environment Variables
            return user === env.ADMIN_USERNAME && pass === env.ADMIN_PASSWORD;
        } catch (e) { return false; }
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // 1. Serve Admin UI (Inject Site Key)
    if (path === "/admin") {
      const page = HTML_UI.replace("{{SITE_KEY}}", env.TURNSTILE_SITE_KEY || "YOUR_SITE_KEY_PLACEHOLDER");
      return new Response(page, { headers: { "Content-Type": "text/html" } });
    }

    // 2. Login Endpoint (Verifies Turnstile + Creds)
    if (path === "/api/login" && request.method === "POST") {
        const { username, password, cfToken } = await request.json();

        // A. Verify Credentials locally first (save API calls)
        if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
            return new Response("Invalid Credentials", { status: 401 });
        }

        // B. Verify Turnstile with Cloudflare
        const ip = request.headers.get('CF-Connecting-IP');
        const formData = new FormData();
        formData.append('secret', env.TURNSTILE_SECRET);
        formData.append('response', cfToken);
        formData.append('remoteip', ip);

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await fetch(url, { body: formData, method: 'POST' });
        const outcome = await result.json();

        if (!outcome.success) {
            return new Response("Captcha Failed", { status: 403 });
        }

        return new Response("OK", { status: 200 });
    }

    // 3. API Actions (Protected by Basic Auth)
    if (path.startsWith("/api/links")) {
      if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });

      if (request.method === "GET") {
        const list = await env.LINKS.list();
        const keys = list.keys.filter(k => !k.name.includes("::stats"));
        const result = await Promise.all(
          keys.map(async (key) => {
            const [url, statsStr] = await Promise.all([
                env.LINKS.get(key.name), env.LINKS.get(`${key.name}::stats`)
            ]);
            const stats = statsStr ? JSON.parse(statsStr) : { clicks: 0, countries: {}, os: {} };
            return { name: key.name, url, stats };
          })
        );
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }

      if (request.method === "POST") {
        let { slug, url } = await request.json();
        if (!slug || !url) return new Response("Error", { status: 400 });
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        await env.LINKS.put(slug, url);
        await env.LINKS.put(`${slug}::stats`, JSON.stringify({ clicks: 0, countries: {}, os: {} }));
        return new Response("Created", { status: 201 });
      }

      if (request.method === "DELETE") {
        const { slug } = await request.json();
        await env.LINKS.delete(slug);
        await env.LINKS.delete(`${slug}::stats`);
        return new Response("Deleted", { status: 200 });
      }
    }

    // 4. Public Redirect
    const slug = path.slice(1);
    if (!slug) return Response.redirect(`${url.origin}/admin`, 302);

    const destination = await env.LINKS.get(slug);

    if (destination) {
      ctx.waitUntil((async () => {
        try {
            const statKey = `${slug}::stats`;
            const country = request.cf?.country || "Unknown";
            const ua = request.headers.get("User-Agent") || "";
            let os = "Other";
            if (/android/i.test(ua)) os = "Android";
            else if (/ipad|iphone|ipod/i.test(ua)) os = "iOS";
            else if (/windows/i.test(ua)) os = "Windows";
            else if (/macintosh/i.test(ua)) os = "Mac";
            else if (/linux/i.test(ua)) os = "Linux";

            let stats = await env.LINKS.get(statKey, { type: "json" }) || { clicks: 0, countries: {}, os: {} };
            stats.clicks = (stats.clicks || 0) + 1;
            stats.countries[country] = (stats.countries[country] || 0) + 1;
            stats.os[os] = (stats.os[os] || 0) + 1;
            await env.LINKS.put(statKey, JSON.stringify(stats));
        } catch (err) { console.error(err); }
      })());
      return Response.redirect(destination, 302);
    }

    return new Response("Link not found", { status: 404 });
  },
};
