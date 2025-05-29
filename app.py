import os
import sqlite3
import random
from flask import Flask, render_template_string, request, redirect, url_for, flash, session, abort, send_from_directory, jsonify, get_flashed_messages
from datetime import datetime
from functools import wraps
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'supersecretkey'
UPLOAD_FOLDER = 'avatars'
BG_UPLOAD_FOLDER = 'profilebgs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(BG_UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_AVATAR_SIZE = 2 * 1024 * 1024

from pin_thread import pin_bp
app.register_blueprint(pin_bp)

ADMIN_USERS = {"slaughter", "Basa"}  # впиши нужных админов

DB = 'forum.sqlite'

USER_BANNERS = [
    {"id": "rainbow", "label": "🌈 RAINBOW GOD", "css": "background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);background-size:400% 100%;animation:banner-rainbow 1.5s linear infinite;color:#fff;text-shadow:0 0 8px #fff;"},
    {"id": "matrix","label": "💻 MATRIX MASTER","css": "background:#111; color:#0f0; text-shadow:0 0 12px #0f0; animation:matrix-glow 2s alternate infinite;"},
    {"id": "firestarter","label":"🔥 FIRESTARTER","css":"background:linear-gradient(90deg,#ff9800,#f44336);color:#fff;animation:firepulse 1.1s infinite alternate;"},
    {"id": "iceking","label":"❄️ ICE KING","css":"background:linear-gradient(90deg,#81d4fa,#b3e5fc);color:#002b36; animation:iceblink 2.2s infinite alternate;"},
    {"id": "neondev","label":"🟣 NEON DEV","css":"background:linear-gradient(90deg,#b026ff,#00eaff,#ff5cce,#b026ff);background-size:400% 100%;color:#fff;animation:neonpulse 2.5s infinite alternate;box-shadow:0 0 12px #00eaff;"},
    {"id": "python_guru", "label": "🐍 Python Guru", "css": "background:#306998;color:#fff;"},
    {"id": "web_wizard", "label": "🌐 Web Wizard", "css": "background:#00bcd4;color:#191919;"},
    {"id": "rocket_dev", "label": "🚀 Rocket Dev", "css": "background:#ff7043;color:#fff;"},
    {"id": "community", "label": "🤝 Community", "css": "background:#43a047;color:#fff;"}
]
ADMIN_BANNERS = [
    {"id": "super_admin", "label": "👑 SUPER ADMIN", "css": "background:linear-gradient(90deg,#ffd700,#f39c12,#ffd700);background-size:400% 100%;color:#23272e;animation:banner-rainbow 1.5s linear infinite;"},
    {"id": "main_mod","label":"🛡️ MAIN MOD","css":"background:#333;color:#61dafb;animation:matrix-glow 2s alternate infinite;"},
    {"id": "wizard","label":"🧙‍♂️ WIZARD","css":"background:linear-gradient(90deg,#8e2de2,#4a00e0);color:#fff;animation:neonpulse 2s infinite alternate;"},
]
CATEGORIES = ['Общее', 'Python', 'Web', 'DevOps']
THREAD_BANNERS = [
    {"id": "default", "label": "Без баннера", "url": ""},
    {"id": "python", "label": "🐍 Python", "url": "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg"},
    {"id": "rocket", "label": "🚀 Rocket", "url": "https://img.icons8.com/color/96/rocket--v1.png"},
    {"id": "web", "label": "🌐 Web", "url": "https://img.icons8.com/color/96/internet--v1.png"},
    {"id": "neon", "label": "🟣 NEON", "url": "https://img.icons8.com/color/96/cyberpunk.png"},
]
PROFILE_BG_PRESETS = [
    'https://images.unsplash.com/photo-1465101178521-c1a9136a3fd8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
]
DEFAULT_AVATAR_URL = "https://ui-avatars.com/api/?background=23272e&color=61dafb&name={}"

FORUM_QUOTES = [
    "Каждый баг — это скрытая фича.",
    "Тут даже админ не всегда понимает, что происходит.",
    "Пиши код — ломай систему!",
    "Форум не багует, он живёт своей жизнью.",
    "Если всё работает — значит ты чего-то не заметил.",
    "Сначала форум, потом production!",
    "В этом чате только свои.",
    "Профиль — твоя визитка, не забудь украсить.",
    "Сила форума в единстве сообщений.",
    "Кодить можно везде — даже здесь!"
]

def init_db():
    with sqlite3.connect(DB) as db:
        db.execute('''CREATE TABLE IF NOT EXISTS users (
            nickname TEXT PRIMARY KEY,
            password TEXT, role TEXT, banned INTEGER, muted INTEGER, bio TEXT, avatar TEXT, created TEXT,
            banner TEXT, profile_bg TEXT, techs TEXT, city TEXT, website TEXT, status TEXT, theme TEXT
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS threads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT, author TEXT, category TEXT, banner TEXT, date TEXT
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id INTEGER, author TEXT, text TEXT, date TEXT
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS friends (
            user1 TEXT, user2 TEXT, status TEXT, PRIMARY KEY(user1,user2)
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS private_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT, recipient TEXT, text TEXT, date TEXT, unread INTEGER DEFAULT 1, edited INTEGER DEFAULT 0
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT, text TEXT, url TEXT, date TEXT, read INTEGER DEFAULT 0
        )''')
        db.execute('''CREATE TABLE IF NOT EXISTS chat (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT, text TEXT, date TEXT
        )''')
        cur = db.execute("SELECT COUNT(*) FROM users WHERE nickname='slaughter'")
        if cur.fetchone()[0] == 0:
            db.execute(
                "INSERT INTO users (nickname, password, role, banned, muted, bio, avatar, created, banner, profile_bg, techs, city, website, status, theme) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                ('slaughter','admincode','admin',0,0,'Великий админ форума.','',datetime.now().strftime("%Y-%m-%d %H:%M"),'super_admin', '', '', '', '', '', 'dark')
            )
        db.commit()
init_db()

def count_unread_notifications(user):
    db = db_connect()
    n = db.execute("SELECT COUNT(*) FROM notifications WHERE user=? AND read=0", (user,)).fetchone()[0]
    db.close()
    return n

def db_connect():
    return sqlite3.connect(DB)

def nowstr():
    return datetime.now().strftime("%Y-%m-%d %H:%M")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_avatar_url(user):
    if user.get('avatar'):
        return url_for('avatar_file', filename=user['avatar'])
    else:
        return DEFAULT_AVATAR_URL.format(user['nickname'])

def get_profile_bg(user):
    if user and user.get('profile_bg'):
        if user['profile_bg'].startswith('http'):
            return user['profile_bg']
        else:
            return url_for('profile_bg_file', filename=user['profile_bg'])
    return random.choice(PROFILE_BG_PRESETS)

def get_user(nick):
    db = db_connect()
    cur = db.execute('SELECT * FROM users WHERE nickname=?', (nick,))
    row = cur.fetchone()
    db.close()
    if row:
        keys = ['nickname','password','role','banned','muted','bio','avatar','created','banner','profile_bg','techs','city','website','status','theme']
        user = dict(zip(keys, row))
        user['banned'] = bool(user['banned'])
        user['muted'] = bool(user['muted'])
        return user
    return None

def get_user_banner(user):
    if not user or not user.get('banner'):
        return ''
    all_banners = USER_BANNERS + (ADMIN_BANNERS if user['role']=='admin' else [])
    for b in all_banners:
        if b['id']==user['banner']:
            return f'<span class="banner-anim" style="{b["css"]}">{b["label"]}</span>'
    return ''

def is_admin():
    return 'user' in session and get_user(session['user']) and get_user(session['user'])['role'] == 'admin'

def login_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        u = session.get('user')
        user = get_user(u) if u else None
        if user and not user.get('banned', False):
            return f(*args, **kwargs)
        else:
            flash("Войдите в свой аккаунт.")
            return redirect(url_for('login'))
    return wrap

def admin_required(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        user = get_user(session['user']) if session.get('user') else None
        if user and user['role']=='admin':
            return f(*args, **kwargs)
        else:
            abort(403)
    return wrap

@app.route("/avatars/<filename>")
def avatar_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/profilebgs/<filename>")
def profile_bg_file(filename):
    return send_from_directory(BG_UPLOAD_FOLDER, filename)

@app.route("/chat/api")
def chat_api():
    db = db_connect()
    cur = db.execute("SELECT author,text,date FROM chat ORDER BY id DESC LIMIT 30")
    res = [{"author":a,"text":t,"date":d} for a,t,d in reversed(list(cur.fetchall()))]
    db.close()
    return jsonify(res)

@app.route("/chat/send", methods=["POST"])
def chat_send():
    if not session.get('user'):
        return jsonify({"ok":0})
    j = request.get_json(force=True)
    text = j.get("text","").strip()[:200]
    if not text: return jsonify({"ok":0})
    db = db_connect()
    db.execute("INSERT INTO chat(author,text,date) VALUES (?,?,?)", (session['user'], text, nowstr()))
    db.commit()
    db.close()
    return jsonify({"ok":1})

@app.route("/")
def index():
    db = db_connect()
    cur = db.execute("""
        SELECT t.id, t.title, t.author, t.category, t.banner, t.date, COUNT(m.id), t.pinned
        FROM threads t LEFT JOIN messages m ON t.id = m.thread_id
        GROUP BY t.id
        ORDER BY t.pinned DESC, t.id DESC
    """)
    threads = cur.fetchall()
    db.close()
    content = "<h1>Темы</h1>"
    is_admin = session.get("user") in ADMIN_USERS

    now = datetime.utcnow()
    NEW_THREAD_MINUTES = 10   # Сколько минут тема считается новой

    for t in threads:
        thread_id, title, author, cat, banner, date, count, pinned = t
        user = get_user(author)
        banner_tag = ""
        for b in THREAD_BANNERS:
            if b["id"] == banner and b["url"]:
                banner_tag = f'<img src="{b["url"]}" alt="" class="banner">'
        pin_btn = ""
        if is_admin:
            if pinned:
                pin_btn = f'''
                <form method="POST" action="{url_for("unpin_thread", thread_id=thread_id)}" style="display:inline;">
                    <button class="btn btn-small" style="margin-left:8px;">Открепить</button>
                </form>
                '''
            else:
                pin_btn = f'''
                <form method="POST" action="{url_for("pin_thread", thread_id=thread_id)}" style="display:inline;">
                    <button class="btn btn-small" style="margin-left:8px;">Закрепить</button>
                </form>
                '''
        # --- Новое: баннер "Новое" ---
        try:
            created_dt = datetime.strptime(date, "%Y-%m-%d %H:%M:%S")
        except Exception:
            created_dt = now  # если формат даты неожиданный
        is_new = (now - created_dt) < timedelta(minutes=NEW_THREAD_MINUTES)
        new_badge = '''
            <span class="new-badge">
                <span class="badge-bar"></span>
                Новое
            </span>
        ''' if is_new else ''

        content += f'''
        <div class="thread{' pinned' if pinned else ''}">
            {banner_tag}
            {f'<div class="pin-banner">📌 Эта тема закреплена администратором</div>' if pinned else ''}
            <span class="category">{cat}</span>
            <a href="{url_for('thread', thread_id=thread_id)}">{title}</a>
            {new_badge}
            {pin_btn}
            <div class="meta">
                <img src="{get_avatar_url(user)}" class="avatar">
                <a href="{url_for('profile', nickname=author)}" class="user-link">{author}</a>
                {get_user_banner(user)}
                | {date} | Сообщений: {count}
            </div>
        </div>
        '''
    content += f'''
    <form method="POST" action="{url_for("new_thread")}" style="background:#222; border-radius:10px; padding:18px; margin-top:24px;">
        <h3 style="margin-top:0; color:#61dafb;">Создать новую тему</h3>
        <label class="form-label">Раздел:</label>
        <select name="category">{''.join(f'<option>{c}</option>' for c in CATEGORIES)}</select>
        <label class="form-label">Заголовок темы:</label>
        <input name="title" type="text" placeholder="Коротко и ясно" required maxlength="80">
        <label class="form-label">Первое сообщение в теме:</label>
        <textarea name="message" placeholder="Расскажи подробно о проблеме или теме" required maxlength="2000"></textarea>
        <label class="form-label">Баннер:</label>
        <div>
        {''.join(f'''
        <span style="display:inline-block;text-align:center;margin-right:12px;">
            <label>
                <input type="radio" name="banner" value="{b["id"]}" {"checked" if i==0 else ""}>
                <br>
                {f'<img src="{b["url"]}" style="max-height:38px;">' if b["url"] else ""}
                <div style="font-size:0.98em;">{b["label"]}</div>
            </label>
        </span>''' for i, b in enumerate(THREAD_BANNERS))}
        </div>
        <button class="btn" type="submit">Создать тему</button>
    </form>
    '''
    return render_base(content, "Темы")
# --- pin/unpin routes для админа ---

@app.route("/thread/<int:thread_id>/pin", methods=["POST"])
@login_required
def pin_thread(thread_id):
    if session.get("user") not in ADMIN_USERS:
        flash("Только для админов.")
        return redirect(url_for('index'))
    db = db_connect()
    db.execute("UPDATE threads SET pinned=1 WHERE id=?", (thread_id,))
    db.commit()
    db.close()
    flash("Тема закреплена.")
    return redirect(url_for('index'))

@app.route("/thread/<int:thread_id>/unpin", methods=["POST"])
@login_required
def unpin_thread(thread_id):
    if session.get("user") not in ADMIN_USERS:
        flash("Только для админов.")
        return redirect(url_for('index'))
    db = db_connect()
    db.execute("UPDATE threads SET pinned=0 WHERE id=?", (thread_id,))
    db.commit()
    db.close()
    flash("Тема откреплена.")
    return redirect(url_for('index'))

@app.route("/new-thread", methods=["POST"])
@login_required
def new_thread():
    title = request.form.get("title", "").strip()
    msg = request.form.get("message", "").strip()
    category = request.form.get("category", CATEGORIES[0])
    banner = request.form.get("banner", "default")
    author = session['user']
    if not title or not msg:
        flash("Заполни все поля!")
        return redirect(url_for('index'))
    db = db_connect()
    db.execute("INSERT INTO threads(title,author,category,banner,date) VALUES (?,?,?,?,?)",
        (title, author, category, banner, nowstr()))
    tid = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.execute("INSERT INTO messages(thread_id,author,text,date) VALUES (?,?,?,?)",
        (tid, author, msg, nowstr()))
    db.commit()
    db.close()
    flash("Тема создана!")
    return redirect(url_for('thread', thread_id=tid))

@app.route("/thread/<int:thread_id>", methods=["GET", "POST"])
def thread(thread_id):
    db = db_connect()
    cur = db.execute("SELECT * FROM threads WHERE id=?", (thread_id,))
    thread = cur.fetchone()
    if not thread:
        db.close()
        flash("Тема не найдена.")
        return redirect(url_for('index'))
    if request.method == "POST":
        if not session.get('user') or get_user(session['user']).get("banned", False):
            db.close()
            flash("Войдите в аккаунт.")
            return redirect(url_for('login'))
        author = session['user']
        if get_user(author).get("muted", False):
            db.close()
            flash("Вы в муте и не можете писать сообщения.")
            return redirect(url_for('thread', thread_id=thread_id))
        msg = request.form.get("message", "").strip()
        if msg:
            db.execute("INSERT INTO messages(thread_id,author,text,date) VALUES (?,?,?,?)",
                (thread_id, author, msg, nowstr()))
            db.commit()
            flash("Сообщение добавлено!")
        else:
            flash("Пустое сообщение не отправляется.")
        db.close()
        return redirect(url_for('thread', thread_id=thread_id))
    cur = db.execute("SELECT * FROM messages WHERE thread_id=? ORDER BY id", (thread_id,))
    msgs = cur.fetchall()
    thread_d = dict(zip(['id','title','author','category','banner','date'], thread))
    db.close()
    banner_tag = ""
    for b in THREAD_BANNERS:
        if b["id"] == thread_d["banner"] and b["url"]:
            banner_tag = f'<img src="{b["url"]}" alt="" class="banner">'
    content = f'''
    <div class="back"><a href="{url_for("index")}" style="color:#61dafb;">← К темам</a></div>
    <h1>{thread_d["title"]}</h1>
    {banner_tag}
    <div class="meta">Раздел: <b>{thread_d["category"]}</b> | Автор: <a href="{url_for("profile", nickname=thread_d["author"])}" class="user-link">{thread_d["author"]}</a>{get_user_banner(get_user(thread_d["author"]))} | {thread_d["date"]}</div>
    <h3>Сообщения</h3>
    '''
    for m in msgs:
        mid,tid,author,text,date = m
        user = get_user(author)
        content += f'''
        <div class="thread">
            <span class="meta"><img src="{get_avatar_url(user)}" class="avatar"><a href="{url_for("profile", nickname=author)}" class="user-link">{author}</a>{get_user_banner(user)} | {date}</span>
            <div style="margin-top:4px;">{text}</div>
        </div>
        '''
    if session.get("user") and not get_user(session.get("user")).get("banned", False):
        if get_user(session.get("user")).get("muted", False):
            content += '<div style="color:#ff2d55;">Вы в муте!</div>'
        else:
            content += f'''
            <form method="POST">
                <h3>Ответить</h3>
                <textarea name="message" placeholder="Твой ахуенный ответ" required maxlength="2000"></textarea>
                <button class="btn" type="submit">Отправить</button>
            </form>
            '''
    else:
        content += '<div style="margin:16px 0;color:#aaa;">Войдите чтобы отвечать.</div>'
    return render_base(content, thread_d["title"])

@app.route("/categories")
def categories_page():
    db = db_connect()
    cats = {}
    for cat in CATEGORIES:
        cur = db.execute("SELECT id,title,author,category,banner,date FROM threads WHERE category=? ORDER BY id DESC", (cat,))
        cats[cat] = cur.fetchall()
    db.close()
    content = "<h1>Разделы форума</h1>"
    for cat, ths in cats.items():
        content += f"<h2>{cat}</h2>"
        for t in ths:
            thread_id,title,author,cat,ban,date = t
            user = get_user(author)
            content += f'''
            <div class="thread">
                <a href="{url_for("thread", thread_id=thread_id)}">{title}</a>
                <div class="meta"><img src="{get_avatar_url(user)}" class="avatar"><a href="{url_for("profile", nickname=author)}" class="user-link">{author}</a>{get_user_banner(user)} | {date}</div>
            </div>
            '''
        if not ths:
            content += "<p>Тем пока нет.</p>"
    return render_base(content, "Разделы")

@app.route('/profile/<nickname>', methods=["GET", "POST"])
def profile(nickname):
    from datetime import datetime, timedelta
    import random

    user = get_user(nickname)
    if not user:
        flash("Пользователь не найден.")
        return redirect(url_for('index'))

    db = db_connect()
    cur = db.execute("SELECT * FROM threads WHERE author=? ORDER BY id DESC", (nickname,))
    user_threads = cur.fetchall()
    db.close()

    me = get_user(session["user"]) if session.get("user") else None

    admin_controls = ""
    if me and me["role"] == "admin" and me["nickname"] != user["nickname"]:
        admin_controls = f'''
        <form method="post" action="{url_for("admin_action", nickname=user["nickname"])}">
          <button class="btn btn-small" name="action" value="ban" {"disabled class='disabled'" if user["banned"] else ""}>Забанить</button>
          <button class="btn btn-small" name="action" value="unban" {"disabled class='disabled'" if not user["banned"] else ""}>Разбанить</button>
          <button class="btn btn-small" name="action" value="mute" {"disabled class='disabled'" if user["muted"] else ""}>Мут</button>
          <button class="btn btn-small" name="action" value="unmute" {"disabled class='disabled'" if not user["muted"] else ""}>Размут</button>
          <button class="btn btn-small" name="action" value="makeadmin" {"disabled class='disabled'" if user["role"] == "admin" else ""}>Дать админку</button>
          <button class="btn btn-small" name="action" value="removeadmin" {"disabled class='disabled'" if user["role"] != "admin" else ""}>Забрать админку</button>
          <button class="btn btn-small btn-red" name="action" value="delete">Удалить пользователя</button>
        </form>
        '''

    banner_choices = USER_BANNERS + (ADMIN_BANNERS if user["role"] == "admin" else [])
    banner_html = ""
    bg_form = ""
    magic_btn = ""
    edit_fields = ""

    if session.get("user") == user["nickname"]:
        banner_html = '<form method="POST" style="margin-bottom:18px;"><label class="form-label">Ваш баннер:</label>'
        banner_html += '<div class="banner-list">'
        for b in banner_choices:
            banner_html += f'''
            <label class="banner-row">
              <input type="radio" name="banner" value="{b["id"]}" {"checked" if user.get("banner") == b["id"] else ""}>
              <span class="banner-anim" style="{b["css"]}">{b["label"]}</span>
            </label>
            '''
        banner_html += '</div><button class="btn btn-small" type="submit" name="set_banner" value="1">Сохранить баннер</button></form>'
        bg_form = f'''
        <form method="POST" enctype="multipart/form-data" style="margin-top:12px;">
            <label class="form-label">Задний фон профиля:</label>
            <input type="file" name="bgfile" accept="image/*">
            <button class="btn btn-small" type="submit" name="set_bg" value="1">Загрузить свой фон</button>
        </form>
        <form method="POST" style="margin-top:6px;">
            <label class="form-label">Или выбери пресет:</label>
            <select name="presetbg">{
                ''.join(f'<option value="{bg}">{bg[:40]}</option>' for bg in PROFILE_BG_PRESETS)
            }</select>
            <button class="btn btn-small" type="submit" name="set_bg_preset" value="1">Выбрать</button>
        </form>
        '''
        magic_btn = f'''
        <form method="POST" style="margin:18px 0;">
            <button class="magic-btn" name="magic" value="1">MAGIC ✨</button>
        </form>
        '''
        edit_fields = f'''
        <form method="POST" style="margin:12px 0 22px;">
            <div class="profile-fields">
                <label>О себе:</label>
                <textarea name="bio">{user.get("bio", "")}</textarea>
                <label>Любимые технологии:</label>
                <input type="text" name="techs" value="{user.get("techs", "") or ""}">
                <label>Город:</label>
                <input type="text" name="city" value="{user.get("city", "") or ""}">
                <label>Сайт:</label>
                <input type="text" name="website" value="{user.get("website", "") or ""}">
                <label>Статус/цитата:</label>
                <input type="text" name="status" value="{user.get("status", "") or ""}">
                <button class="btn" name="save_profile" value="1">Сохранить профиль</button>
            </div>
        </form>
        '''

    avatar_form = ""
    if session.get("user") == user["nickname"]:
        avatar_form = f'''
        <form method="POST" enctype="multipart/form-data" style="margin-top:18px;">
            <label class="form-label">Загрузить аватарку:</label>
            <input type="file" name="avatar" accept="image/*">
            <button class="btn" type="submit" name="set_avatar" value="1">Сохранить</button>
        </form>
        '''

    # --- Дружба/чат ---
    friendship_buttons = ""
    if session.get("user") and session["user"] != user["nickname"]:
        db = db_connect()
        cur = db.execute("""
            SELECT status FROM friends
            WHERE (user1=? AND user2=?) OR (user1=? AND user2=?)""",
            (session["user"], user["nickname"], user["nickname"], session["user"]))
        friendship = cur.fetchone()
        db.close()
        if not friendship:
            friendship_buttons = f'<a href="{url_for("add_friend", nickname=user["nickname"])}" class="btn">Добавить в друзья</a>'
        elif friendship[0] == "pending":
            friendship_buttons = "<span>Заявка отправлена.</span>"
        elif friendship[0] == "accepted":
            friendship_buttons = f'<a href="{url_for("private_chat", nickname=user["nickname"])}" class="btn">Чат</a>'

    # --- ОНЛАЙН/ОФФЛАЙН + НАСТРОЙКИ ЧЕКБОКСОВ ---
    last_seen_str = user.get("last_seen", "")
    is_online = False
    minutes_ago = None
    if last_seen_str:
        try:
            try:
                last_seen = datetime.strptime(last_seen_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                last_seen = datetime.strptime(last_seen_str, "%Y-%m-%d %H:%M:%S.%f")
            diff = datetime.utcnow() - last_seen
            minutes_ago = int(diff.total_seconds() // 60)
            is_online = diff < timedelta(minutes=3)
        except Exception:
            is_online = False
            minutes_ago = None
    else:
        is_online = False
        minutes_ago = None

    status_text = "в сети" if is_online else (f"был {minutes_ago} мин назад" if minutes_ago is not None else "неизвестно")
    status_class = "online" if is_online else "offline"

    settings_panel = ""
    if session.get("user") == user["nickname"]:
        can_message = int(user.get("can_message", 1))
        notify = int(user.get("notify", 1))
        settings_panel = f"""
        <div class="user-settings-panel">
          <div class="setting-row">
            <span>Разрешить писать вам</span>
            <label class="switch">
              <input type="checkbox" id="can_message" {'checked' if can_message else ''}>
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <span>Уведомления</span>
            <label class="switch">
              <input type="checkbox" id="notify" {'checked' if notify else ''}>
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <span>Статус</span>
            <span id="online-status" class="status-dot {status_class}"></span>
            <span id="last-seen-text">{status_text}</span>
          </div>
        </div>
        <script>
        document.querySelectorAll('.user-settings-panel input[type="checkbox"]').forEach(el => {{
          el.addEventListener('change', function() {{
            fetch('/update_setting', {{
              method: 'POST',
              headers: {{'Content-Type': 'application/json'}},
              body: JSON.stringify({{setting: this.id, value: this.checked}})
            }})
          }});
        }});
        </script>
        """
    else:
        settings_panel = f"""
        <div class="user-settings-panel">
          <div class="setting-row">
            <span>Статус</span>
            <span id="online-status" class="status-dot {status_class}"></span>
            <span id="last-seen-text">{status_text}</span>
          </div>
        </div>
        """

    # --- POST обработка ---
    if request.method == "POST" and session.get("user") == user["nickname"]:
        db = db_connect()
        if request.form.get("set_banner"):
            new_banner = request.form.get("banner", "")
            banners_ok = [b["id"] for b in USER_BANNERS + ADMIN_BANNERS]
            if new_banner in banners_ok:
                db.execute("UPDATE users SET banner=? WHERE nickname=?", (new_banner, user["nickname"]))
                db.commit()
                flash("Баннер обновлен!")
                return redirect(url_for('profile', nickname=nickname))
        if request.form.get("set_avatar"):
            file = request.files.get('avatar')
            if file and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                fname = f"{user['nickname']}_{int(datetime.now().timestamp())}.{ext}"
                path = os.path.join(UPLOAD_FOLDER, secure_filename(fname))
                file.save(path)
                db.execute("UPDATE users SET avatar=? WHERE nickname=?", (fname, user["nickname"]))
                db.commit()
                flash("Аватарка обновлена!")
                return redirect(url_for('profile', nickname=nickname))
            elif file:
                flash("Недопустимый формат файла.")
        if request.form.get("set_bg"):
            file = request.files.get('bgfile')
            if file and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                fname = f"{user['nickname']}_{int(datetime.now().timestamp())}.{ext}"
                path = os.path.join(BG_UPLOAD_FOLDER, secure_filename(fname))
                file.save(path)
                db.execute("UPDATE users SET profile_bg=? WHERE nickname=?", (fname, user["nickname"]))
                db.commit()
                flash("Фон профиля обновлен!")
                return redirect(url_for('profile', nickname=nickname))
            elif file:
                flash("Недопустимый формат файла.")
        if request.form.get("set_bg_preset"):
            bg = request.form.get("presetbg")
            if bg in PROFILE_BG_PRESETS:
                db.execute("UPDATE users SET profile_bg=? WHERE nickname=?", (bg, user["nickname"]))
                db.commit()
                flash("Фон профиля обновлен (пресет)!")
                return redirect(url_for('profile', nickname=nickname))
        if request.form.get("save_profile"):
            bio = request.form.get("bio", "")
            techs = request.form.get("techs", "")
            city = request.form.get("city", "")
            website = request.form.get("website", "")
            status = request.form.get("status", "")
            db.execute("UPDATE users SET bio=?, techs=?, city=?, website=?, status=? WHERE nickname=?",
                (bio, techs, city, website, status, user["nickname"]))
            db.commit()
            flash("Профиль обновлен!")
            return redirect(url_for('profile', nickname=nickname))
        if request.form.get("magic"):
            all_banners = [b["id"] for b in USER_BANNERS + ADMIN_BANNERS]
            banner = random.choice(all_banners)
            bg = random.choice(PROFILE_BG_PRESETS)
            techs = random.choice([
                "Python, Flask, JS", "Rust, Go, Linux", "C++, Unreal, Vulkan",
                "HTML, CSS, JS", "Kubernetes, Docker, CI/CD"
            ])
            city = random.choice(["Москва", "Воронеж", "Питер", "Казань", "Новосибирск", "Сочи", ""])
            quotes = [
                "🔥 Да пребудет код!", "🚀 Вперёд к багам!", "💻 Пишу без остановки",
                "🧙 Магия форума", "👾 Жги баги, чини фичи!", "🌈 Код вне радуги!"
            ]
            status = random.choice(quotes)
            db.execute("UPDATE users SET banner=?, profile_bg=?, techs=?, city=?, status=? WHERE nickname=?",
                (banner, bg, techs, city, status, user["nickname"]))
            db.commit()
            flash("✨ MAGIC! Профиль рандомизирован!")
            return redirect(url_for('profile', nickname=nickname))
        db.close()

    profile_bg = get_profile_bg(user)
    extra = ""
    if user.get("status") and "matrix" in user["status"].lower():
        extra = '<style>body{background:#101812!important;color:#0f0!important;}</style>'
    profile_url = request.url

    content = f'''
    {extra}
    <div style="position:relative;min-height:500px;">
      <img src="{profile_bg}" alt="" class="profile-bg">
      <div class="profile-card">
        <div style="display:flex;align-items:center;">
            <img src="{get_avatar_url(user)}" class="avatar-big">
            <div style="margin-left:18px;">
                <div style="font-size:1.4em;font-weight:bold;">{user["nickname"]} {get_user_banner(user)}</div>
                <div style="color:#61dafb;">{user.get("status") or ""}</div>
                <div>Роль: <b>{user["role"]}</b> | С {user.get("created") or "?"}</div>
                <div>Город: {user.get("city") or ""}</div>
                <div>Сайт: <a href="{user.get("website") or "#"}" style="color:#61dafb;" target="_blank">{user.get("website") or ""}</a></div>
                <div style="margin:6px 0;">
                  <button class="btn btn-small" onclick="navigator.clipboard.writeText('{profile_url}');this.innerText='Скопировано!';setTimeout(()=>this.innerText='Скопировать ссылку',1500)">Скопировать ссылку</button>
                  <span style="color:#aaa;font-size:0.92em;">Тем: {len(user_threads)}</span>
                </div>
                {friendship_buttons}
            </div>
        </div>
        {settings_panel}
        {admin_controls}
        {banner_html}
        {magic_btn}
        {avatar_form}
        {bg_form}
        {edit_fields}
        <div style="margin:20px 0 0;"><b>О себе:</b><br>{user.get("bio") or ""}</div>
        <div style="margin:10px 0 0;"><b>Любимые технологии:</b> {user.get("techs") or ""}</div>
        {'<div style="color:red;">[Забанен]</div>' if user["banned"] else ""}
      </div>
    </div>
    <h2 style="margin-top:26px;">Темы пользователя</h2>
    {''.join(f'<div class="thread"><a href="{url_for("thread", thread_id=t[0])}">{t[1]}</a><div class="meta">{t[5]}</div></div>' for t in user_threads) or "<p>Тем нет.</p>"}
    '''
    return render_base(content, f"Профиль {nickname}")

# ===============================
# 1. Роут сохранения чекбоксов
# ===============================
@app.route('/update_setting', methods=['POST'])
def update_setting():
    if 'user' not in session:
        return {'ok': 0}, 403
    user = session['user']
    data = request.get_json(force=True)
    setting = data.get('setting')
    value = int(bool(data.get('value')))
    if setting not in ('can_message', 'notify'):
        return {'ok': 0}, 400
    db = db_connect()
    db.execute(f"UPDATE users SET {setting}=? WHERE nickname=?", (value, user))
    db.commit()
    db.close()
    return {'ok': 1}

# ===============================
# 2. Функция онлайн/оффлайн
# ===============================
from datetime import datetime, timedelta

def get_online_status(user):
    last_seen_str = user.get("last_seen", "")
    is_online = False
    minutes_ago = None
    if last_seen_str:
        try:
            try:
                last_seen = datetime.strptime(last_seen_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                last_seen = datetime.strptime(last_seen_str, "%Y-%m-%d %H:%M:%S.%f")
            diff = datetime.utcnow() - last_seen
            minutes_ago = int(diff.total_seconds() // 60)
            is_online = diff < timedelta(minutes=3)
        except Exception:
            is_online = False
            minutes_ago = None
    else:
        is_online = False
        minutes_ago = None

    status_text = "в сети" if is_online else (f"был {minutes_ago} мин назад" if minutes_ago is not None else "неизвестно")
    status_class = "online" if is_online else "offline"
    return status_text, status_class

@app.route('/profile/<nickname>/admin-action', methods=['POST'])
@admin_required
def admin_action(nickname):
    user = get_user(nickname)
    if not user:
        flash("Пользователь не найден.")
        return redirect(url_for('admin_panel'))
    action = request.form.get("action")
    db = db_connect()
    if action == "ban":
        db.execute("UPDATE users SET banned=1 WHERE nickname=?", (nickname,))
        flash("Пользователь забанен.")
    elif action == "unban":
        db.execute("UPDATE users SET banned=0 WHERE nickname=?", (nickname,))
        flash("Пользователь разбанен.")
    elif action == "mute":
        db.execute("UPDATE users SET muted=1 WHERE nickname=?", (nickname,))
        flash("Пользователь в муте.")
    elif action == "unmute":
        db.execute("UPDATE users SET muted=0 WHERE nickname=?", (nickname,))
        flash("Пользователь размучен.")
    elif action == "makeadmin":
        db.execute("UPDATE users SET role='admin' WHERE nickname=?", (nickname,))
        flash("Пользователь теперь админ.")
    elif action == "removeadmin":
        db.execute("UPDATE users SET role='user' WHERE nickname=?", (nickname,))
        flash("Права админа сняты.")
    elif action == "delete":
        db.execute("DELETE FROM users WHERE nickname=?", (nickname,))
        flash("Пользователь удалён.")
    db.commit()
    db.close()
    return redirect(url_for('admin_panel'))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == 'POST':
        nickname = request.form.get("nickname", "").strip()
        password = request.form.get("password", "").strip()
        user = get_user(nickname)
        if not user or user['password'] != password:
            flash("Неверный ник или пароль.")
            return redirect(url_for('login'))
        if user.get("banned", False):
            flash("Вы забанены.")
            return redirect(url_for('login'))
        session['user'] = nickname
        flash("Успешный вход!")
        return redirect(url_for('index'))
    content = '''
    <h1>Вход</h1>
    <form method="POST">
    <input name="nickname" type="text" placeholder="Ник" required maxlength="20"><br>
    <input name="password" type="password" placeholder="Пароль" required maxlength="100"><br>
    <button class="btn" type="submit">Войти</button>
    </form>
    '''
    return render_base(content, "Вход")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == 'POST':
        nickname = request.form.get("nickname", "").strip()
        password = request.form.get("password", "").strip()
        bio = request.form.get("bio", "").strip()
        if not nickname or not password:
            flash("Ник и пароль обязательны.")
            return redirect(url_for('register'))
        if get_user(nickname):
            flash("Пользователь с таким ником уже существует.")
            return redirect(url_for('register'))
        created = nowstr()
        # Подставляем значения по умолчанию для всех 18 полей
        db = db_connect()
        db.execute("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                   (
                       nickname,                      # 1
                       password,                      # 2
                       "user",                        # 3 role
                       0,                             # 4 banned
                       0,                             # 5 muted
                       bio or "Обычный участник.",    # 6 bio
                       "",                            # 7 avatar
                       created,                       # 8 created
                       "default",                     # 9 banner
                       "default",                     #10 profile_bg
                       "",                            #11 techs
                       "",                            #12 city
                       "",                            #13 website
                       "",                            #14 status
                       "dark",                        #15 theme
                       1,                             #16 can_message
                       1,                             #17 notify
                       created                        #18 last_seen
                   ))
        db.commit()
        db.close()
        flash("Регистрация успешна! Теперь войдите.")
        return redirect(url_for('login'))
    content = '''
    <h1>Регистрация</h1>
    <form method="POST">
    <input name="nickname" type="text" placeholder="Ник" required maxlength="20"><br>
    <input name="password" type="password" placeholder="Пароль" required maxlength="100"><br>
    <input name="bio" type="text" placeholder="О себе (по желанию)" maxlength="100"><br>
    <button class="btn" type="submit">Зарегистрироваться</button>
    </form>
    '''
    return render_base(content, "Регистрация")

@app.route("/logout")
@login_required
def logout():
    session.pop('user')
    flash("Вы вышли.")
    return redirect(url_for('login'))

@app.route("/admin")
@admin_required
def admin_panel():
    db = db_connect()
    cur = db.execute("SELECT nickname,role,banned,muted,bio,avatar,created,banner FROM users ORDER BY nickname")
    users = cur.fetchall()
    stat_threads = db.execute("SELECT COUNT(*) FROM threads").fetchone()[0]
    stat_msgs = db.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
    db.close()
    quick_links = f'''
    <div class="quick-links">
        <a href="{url_for('index')}">Все темы ({stat_threads})</a>
        <a href="{url_for('categories_page')}">Разделы</a>
        <a href="{url_for('admin_panel')}">Пользователи ({len(users)})</a>
        <span>Всего сообщений: {stat_msgs}</span>
    </div>
    '''
    table = '''
    <table class="admin-table" style="width:100%;margin-top:16px;">
    <tr>
        <th>Аватар</th><th>Ник</th><th>Баннер</th><th>Роль</th><th>Статус</th><th>Регистрация</th><th>Действия</th>
    </tr>
    '''
    for u in users:
        nick,role,banned,muted,bio,avatar,created,banner = u
        user = dict(zip(['nickname','role','banned','muted','bio','avatar','created','banner'], u))
        table += f'''
        <tr>
            <td><img src="{get_avatar_url(user)}" class="avatar"></td>
            <td><a href="{url_for("profile", nickname=nick)}">{nick}</a></td>
            <td>{get_user_banner(user)}</td>
            <td>{role}</td>
            <td>
                {'<span class="status-badge badge-ban">ban</span>' if banned else ""}
                {'<span class="status-badge badge-mute">mute</span>' if muted else ""}
            </td>
            <td>{created}</td>
            <td>
                <form method="post" action="{url_for("admin_action", nickname=nick)}" style="display:inline;">
                  <button class="btn btn-small" name="action" value="ban" {"disabled class='disabled'" if banned else ""}>Бан</button>
                  <button class="btn btn-small" name="action" value="unban" {"disabled class='disabled'" if not banned else ""}>Разбан</button>
                  <button class="btn btn-small" name="action" value="mute" {"disabled class='disabled'" if muted else ""}>Мут</button>
                  <button class="btn btn-small" name="action" value="unmute" {"disabled class='disabled'" if not muted else ""}>Размут</button>
                  <button class="btn btn-small" name="action" value="makeadmin" {"disabled class='disabled'" if role=="admin" else ""}>Админ</button>
                  <button class="btn btn-small" name="action" value="removeadmin" {"disabled class='disabled'" if role!="admin" else ""}>Снять</button>
                  <button class="btn btn-small btn-red" name="action" value="delete" onclick="return confirm('Удалить пользователя?')">Удалить</button>
                </form>
            </td>
        </tr>
        '''
    table += "</table>"
    content = f'''
    <h1>Админ-панель</h1>
    {quick_links}
    {table}
    '''
    return render_base(content, "Админка")

@app.route("/set-theme/<theme>")
@login_required
def set_theme(theme):
    if theme not in ("dark", "light", "matrix"):
        flash("Нет такой темы!")
        return redirect(request.referrer or url_for("index"))
    db = db_connect()
    db.execute("UPDATE users SET theme=? WHERE nickname=?", (theme, session["user"]))
    db.commit()
    db.close()
    session["theme"] = theme
    flash("Тема обновлена!")
    return redirect(request.referrer or url_for("profile", nickname=session["user"]))

def get_theme_css(user):
    if not user: return ""
    theme = user.get("theme") or "dark"
    if theme == "light":
        return """
        <style>
        body { background:#f8fafc; color:#222; }
        .container { background:#fff; box-shadow:0 0 30px #bbb6; }
        .menu, .thread, .profile-card { background:#f2f7ff; color:#222; }
        .flash { background:#ffb300; color:#191919; }
        .avatar-big { border:2px solid #007aff; }
        </style>
        """
    if theme == "matrix":
        return """
        <style>
        body { background:#101812; color:#0f0; font-family: 'Fira Mono', monospace;}
        .container, .menu, .thread, .profile-card { background:#181c20; color:#0f0; }
        .flash { background:#009900; color:#fff; }
        .avatar-big { border:2px solid #0f0; }
        a, .user-link { color:#55ff66!important; }
        </style>
        """
    return ""

# ----------- Друзья ----------
@app.route("/friends")
@login_required
def friends():
    user = session["user"]
    db = db_connect()
    cur = db.execute("""
        SELECT user2 FROM friends WHERE user1=? AND status='accepted'
        UNION
        SELECT user1 FROM friends WHERE user2=? AND status='accepted'
    """, (user, user))
    friends_list = [row[0] for row in cur.fetchall()]
    cur = db.execute("SELECT user1 FROM friends WHERE user2=? AND status='pending'", (user,))
    requests = [row[0] for row in cur.fetchall()]
    cur = db.execute("SELECT user2 FROM friends WHERE user1=? AND status='pending'", (user,))
    outgoing = [row[0] for row in cur.fetchall()]
    db.close()
    content = "<h1>Друзья</h1>"
    content += "<h3>Ваши друзья:</h3>"
    for f in friends_list:
        content += f'<div><a href="{url_for("profile", nickname=f)}">{f}</a> <a href="{url_for("private_chat", nickname=f)}" class="btn btn-small">Чат</a></div>'
    if not friends_list:
        content += "<p>Нет друзей.</p>"
    content += "<h3>Входящие заявки:</h3>"
    for r in requests:
        content += f'<div>{r} <a href="{url_for("friend_accept", nickname=r)}" class="btn btn-small">Принять</a> <a href="{url_for("friend_decline", nickname=r)}" class="btn btn-small btn-red">Отклонить</a></div>'
    if not requests:
        content += "<p>Нет новых заявок.</p>"
    content += "<h3>Исходящие заявки:</h3>"
    for r in outgoing:
        content += f"<div>{r} (ожидание)</div>"
    if not outgoing:
        content += "<p>Нет исходящих заявок.</p>"
    return render_base(content, "Друзья")

@app.route("/add-friend/<nickname>")
@login_required
def add_friend(nickname):
    user = session["user"]
    if user == nickname or not get_user(nickname):
        flash("Некорректный пользователь.")
        return redirect(url_for("profile", nickname=nickname))
    db = db_connect()
    cur = db.execute("SELECT status FROM friends WHERE user1=? AND user2=?", (user, nickname))
    if cur.fetchone():
        flash("Уже отправлено или вы друзья.")
    else:
        db.execute("INSERT INTO friends (user1, user2, status) VALUES (?, ?, 'pending')", (user, nickname))
        if get_user(nickname).get("notify", 1):
            db.execute("INSERT INTO notifications (user, text, url, date) VALUES (?, ?, ?, ?)",
                (nickname, f"Пользователь {user} отправил вам заявку в друзья.", url_for('friends'), nowstr()))
        db.commit()
        flash("Заявка отправлена!")
    db.close()
    return redirect(url_for("profile", nickname=nickname))

# ----------- Личный чат ----------
@app.route("/pm/<nickname>", methods=["GET", "POST"])
@login_required
def private_chat(nickname):
    user = session["user"]
    if not get_user(nickname) or user == nickname:
        flash("Некорректный пользователь.")
        return redirect(url_for("friends"))
    db = db_connect()
    cur = db.execute("""
        SELECT 1 FROM friends
        WHERE ((user1=? AND user2=?) OR (user1=? AND user2=?)) AND status='accepted'
    """, (user, nickname, nickname, user))
    if not cur.fetchone():
        flash("Только друзья могут писать друг другу.")
        db.close()
        return redirect(url_for('profile', nickname=nickname))

    recipient = get_user(nickname)
    if not recipient.get("can_message", 1):
        flash("Пользователь запретил личные сообщения.")
        db.close()
        return redirect(url_for('profile', nickname=nickname))

    if request.method == "POST":
        text = request.form.get("text", "").strip()
        if text:
            db.execute("INSERT INTO private_messages (sender, recipient, text, date, unread) VALUES (?, ?, ?, ?, 1)", (user, nickname, text, nowstr()))
            if recipient.get("notify", 1):
                db.execute("INSERT INTO notifications (user, text, url, date) VALUES (?, ?, ?, ?)",
                    (nickname, f"Новое личное сообщение от {user}", url_for('private_chat', nickname=user), nowstr()))
            db.commit()
    cur = db.execute("""
        SELECT id, sender, text, date, edited FROM private_messages
        WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)
        ORDER BY id
    """, (user, nickname, nickname, user))
    messages = cur.fetchall()
    db.execute("UPDATE private_messages SET unread=0 WHERE recipient=? AND sender=?", (user, nickname))
    db.commit()
    db.close()

    chat_html = f'<h1 style="color:#61dafb;margin:20px 0 24px 0;">Чат с {nickname}</h1><div class="pm-messages">'
    for msg_id, sender, text, date, edited in messages:
        mine = (sender == session['user'])
        sender_user = get_user(sender)
        chat_html += f'''
        <div class="pm-msg {'mine' if mine else ''}" data-id="{msg_id}">
            <img src="{get_avatar_url(sender_user)}" class="pm-avatar">
            <div class="pm-bubble" style="position:relative;">
                <div class="pm-sender">{sender}</div>
                <div>{text}</div>
                {'<div class="pm-edited">ред.</div>' if edited else ''}
                <div class="pm-time">{date}</div>
                {f'<span class="pm-menu-btn" onclick="showMsgMenu({msg_id}, event)">⋮</span>' if mine else ''}
            </div>
        </div>
        '''
    chat_html += '</div>'
    chat_html += f'''
    <form method="POST" class="pm-inputbox">
        <textarea name="text" placeholder="Напишите сообщение..." required maxlength="2000"></textarea>
        <button type="submit">Отправить</button>
    </form>
    <form method="POST" action="{url_for('clear_pm', nickname=nickname)}" style="text-align:right;">
        <button class="btn btn-red btn-small" onclick="return confirm('Очистить чат?')">🗑 Очистить чат</button>
    </form>
    <div id="pm-modal-bg" style="display:none;"></div>
    <div id="pm-modal-menu" style="display:none;">
      <button onclick="editMsg()">✏️ Редактировать</button>
      <button onclick="deleteMsg()">🗑 Удалить</button>
      <button onclick="closeMsgMenu()">Отмена</button>
    </div>
    <script>
    let currentMsgId = null;
    function showMsgMenu(msgId, e) {{
      currentMsgId = msgId;
      document.getElementById('pm-modal-bg').style.display = 'block';
      document.getElementById('pm-modal-menu').style.display = 'block';
      document.body.classList.add('pm-blur');
      let menu = document.getElementById('pm-modal-menu');
      menu.style.left = e.pageX + 'px';
      menu.style.top = e.pageY + 'px';
    }}
    function closeMsgMenu() {{
      document.getElementById('pm-modal-bg').style.display = 'none';
      document.getElementById('pm-modal-menu').style.display = 'none';
      document.body.classList.remove('pm-blur');
    }}
    function deleteMsg() {{
      if (confirm('Удалить сообщение?')) {{
        fetch('/pmmsg/' + currentMsgId + '/delete', {{method: 'POST'}})
          .then(()=>location.reload());
      }}
    }}
    function editMsg() {{
      let text = prompt('Новое сообщение:');
      if (text !== null) {{
        fetch('/pmmsg/' + currentMsgId + '/edit', {{
          method:'POST',
          headers:{{'Content-Type':'application/json'}},
          body:JSON.stringify({{text}})
        }}).then(()=>location.reload());
      }}
      closeMsgMenu();
    }}
    document.getElementById('pm-modal-bg').onclick = closeMsgMenu;
    </script>
    '''
    return render_base(chat_html, f"Чат с {nickname}")

@app.route("/pm/<nickname>/clear", methods=["POST"])
@login_required
def clear_pm(nickname):
    user = session["user"]
    if not get_user(nickname) or user == nickname:
        abort(404)
    db = db_connect()
    db.execute("""
        DELETE FROM private_messages 
        WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)""", 
        (user, nickname, nickname, user))
    db.commit()
    db.close()
    flash("Чат очищен!")
    return redirect(url_for('private_chat', nickname=nickname))

# ---------- Уведомления ----------
@app.route("/notifications")
@login_required
def notifications():
    user = session["user"]
    db = db_connect()
    cur = db.execute("SELECT id, text, url, date, read FROM notifications WHERE user=? ORDER BY id DESC", (user,))
    notes = cur.fetchall()
    db.execute("UPDATE notifications SET read=1 WHERE user=?", (user,))
    db.commit()
    db.close()
    content = "<h1>Уведомления</h1>"
    content += '''
    <form method="POST" action="/notifications/clear" style="text-align:right;margin-bottom:10px;">
        <button class="btn btn-red btn-small" onclick="return confirm('Очистить все?')">Очистить все</button>
    </form>
    '''
    for id_, text, url, date, read in notes:
        content += f'''
        <div class="notif-card {'unread' if not read else ''}">
            <span class="notif-icon">📬</span>
            <span class="notif-text"><a href="{url}">{text}</a></span>
            <span class="notif-time">{date}</span>
        </div>
        '''
    if not notes:
        content += "<p>Нет уведомлений.</p>"
    # --- Добавь CSS в BASE_STYLE ---
    return render_base(content, "Уведомления")

@app.route("/notifications/clear", methods=["POST"])
@login_required
def clear_notifications():
    user = session["user"]
    db = db_connect()
    db.execute("DELETE FROM notifications WHERE user=?", (user,))
    db.commit()
    db.close()
    flash("Все уведомления удалены!")
    return redirect(url_for('notifications'))

@app.route('/pmmsg/<int:msgid>/delete', methods=['POST'])
@login_required
def pmmsg_delete(msgid):
    user = session['user']
    db = db_connect()
    db.execute("DELETE FROM private_messages WHERE id=? AND sender=?", (msgid, user))
    db.commit()
    db.close()
    return '', 204

@app.route('/pmmsg/<int:msgid>/edit', methods=['POST'])
@login_required
def pmmsg_edit(msgid):
    user = session['user']
    text = request.json.get('text', '').strip()
    db = db_connect()
    db.execute("UPDATE private_messages SET text=?, edited=1 WHERE id=? AND sender=?", (text, msgid, user))
    db.commit()
    db.close()
    return '', 204

@app.before_request
def update_last_seen():
    if session.get("user"):
        db = db_connect()
        db.execute("UPDATE users SET last_seen=datetime('now') WHERE nickname=?", (session["user"],))
        db.commit()
        db.close()

BASE_STYLE = """
<style>
body { background: #191919; color: #fff; font-family: 'Fira Mono', monospace; margin: 0;}
.container { max-width: 1100px; margin: auto; padding: 24px;}
h1 { color: #61dafb; }
.menu { background: #23272e; padding:12px; border-radius:8px; margin-bottom: 14px; display: flex; align-items:center; }
.menu a { color: #fff; text-decoration:none; margin-right:18px; }
.menu .user { margin-left:auto; }
.menu .burger { display:none; cursor:pointer; margin-right:12px; font-size:1.7em;}
.menu-items { display:flex;}
@media (max-width: 900px) {
  .menu-items { display: none; flex-direction: column;}
  .menu.open .menu-items { display: flex; }
  .menu .burger { display:block;}
  .container { padding: 6px; }
}
.thread { background: #23272e; border-radius: 10px; margin: 16px 0; padding: 16px; }
.thread > a {
  color: #61dafb;         /* Голубой цвет, как Telegram */
  font-weight: 700;       /* Жирный */
  text-decoration: none;  /* Без подчеркивания */
  font-size: 1.22em;      /* Немного больше размер */
  transition: color 0.2s;
}
.thread > a:hover {
  color: #40a2d8;         /* Оттенок при наведении */
  text-decoration: underline;
}
.thread > a {
  color: #61dafb;         /* Голубой цвет, как Telegram */
  font-weight: 700;       /* Жирный */
  text-decoration: none;  /* Без подчеркивания */
  font-size: 1.22em;      /* Немного больше размер */
  transition: color 0.2s;
}
.thread > a:hover {
  color: #40a2d8;         /* Оттенок при наведении */
  text-decoration: underline;
}
.meta { color: #aaa; font-size: 0.92em; }
.flash { color:#fff; background:#ff2d55; padding:8px; border-radius:6px; margin-bottom:12px;}
.category { background:#222; padding:3px 10px; border-radius:6px; margin-right:8px; font-size:0.95em;}
.user-link { color: #61dafb; cursor:pointer; text-decoration:underline;}
.banner-anim {margin-left:8px; border-radius:10px; padding:3px 14px; font-size:1em; box-shadow:0 0 8px #0008;}
@keyframes banner-rainbow {0%{filter:hue-rotate(0);}100%{filter:hue-rotate(360deg);}}
@keyframes neonpulse {0%{box-shadow:0 0 12px #00eaff;}100%{box-shadow:0 0 36px #b026ff;}}
@keyframes matrix-glow {0%{text-shadow:0 0 6px #0f0;}100%{text-shadow:0 0 24px #0f0;}}
@keyframes firepulse {0%{box-shadow:0 0 6px #f44336;}100%{box-shadow:0 0 24px #ff9800;}}
@keyframes iceblink {0%{box-shadow:0 0 8px #b3e5fc;}100%{box-shadow:0 0 32px #81d4fa;}}
.avatar {border-radius: 50%; width: 46px; height: 46px; object-fit:cover; margin-right:10px; vertical-align:middle;}
.avatar-big {border-radius: 50%; width: 100px; height: 100px; object-fit:cover; margin-right:18px; vertical-align:middle; border: 2px solid #61dafb;}
.profile-bg {position: absolute;top:0;left:0;width:100%;height:100%;z-index:0;object-fit:cover;filter:brightness(0.26) blur(2.5px);}
.profile-card {position:relative;z-index:1;max-width:560px;margin:auto;background:rgba(34,39,46,0.92);border-radius:22px;box-shadow:0 0 22px #0008;padding:40px 36px 32px;margin-top:22px;}
.profile-fields {margin:22px 0 0;}
.profile-fields label {font-weight:bold;display:block;margin-top:14px;}
input[type="text"], input[type="password"], textarea, select {background: #181c20; color: #fff; border: none; border-radius: 4px; padding: 8px; width: 100%; margin: 8px 0;}
textarea {min-height: 90px;}
input[type="file"] {color:#fff;}
.btn {background: #61dafb; color: #191919; border: none; border-radius: 4px; padding: 7px 18px; margin-right: 4px; cursor: pointer; font-size:1em;}
.btn-red {background: #ff2d55; color: #fff;}
.btn-small {font-size: 0.95em; padding: 4px 12px;}
.quick-links {margin: 12px 0 24px;}
.quick-links a {background: #222; color: #61dafb; padding: 6px 12px; border-radius: 6px; margin-right: 8px; text-decoration:none;}
.admin-table {width:100%; border-collapse: collapse; margin-top:16px;}
.admin-table th, .admin-table td {padding: 8px 10px;}
.admin-table th {background: #111; color:#61dafb;}
.admin-table tr {background: #23272e;}
.admin-table tr:nth-child(even) {background: #1a1a1a;}
.admin-table td {border-bottom:1px solid #333;}
#chatbox {position:fixed;right:40px;top:55px;width:340px;max-width:95vw;background:#23272e;border-radius:12px 0 12px 12px;box-shadow:-3px 2px 10px #0004;z-index:99;padding:0 0 8px;display:flex;flex-direction:column;}
#chatheader {background:#23272e;padding:8px 14px;border-radius:12px 0 0 0;cursor:move;color:#61dafb;font-weight:bold;}
#chatmessages {flex:1;overflow-y:auto;max-height:320px;padding:8px;}
#chatinput {display:flex;padding:0 8px;}
#chatinput input {flex:1;background:#181c20;color:#fff;border:0;border-radius:4px;padding:8px;}
#chatinput button {background:#61dafb;color:#191919;border:0;border-radius:4px;padding:8px 12px;margin-left:5px;}
#chatbox.closed {right:-302px;}
@media (max-width: 900px) {
  #chatbox {display:none;}
}
.magic-btn {background:linear-gradient(90deg,#ff2d55,#61dafb,#ffd700,#ff2d55);background-size:200% 100%;color:#fff;font-weight:bold;box-shadow:0 0 18px #ff2d55;animation:banner-rainbow 2.1s linear infinite;border-radius:16px;padding:12px 36px;font-size:1.2em;border:0;cursor:pointer;transition:box-shadow .2s;}
.magic-btn:hover {box-shadow:0 0 35px #ffd700;}
.banner-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 10px;
}
.banner-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.08em;
}
.banner-row input[type="radio"] {
  accent-color: #61dafb;
  width: 18px;
  height: 18px;
  margin-right: 4px;
}
/* --- Telegram-like PM styles --- */
.pm-messages { max-width:600px; margin:auto; padding:24px 0 0 0;}
.pm-msg { display:flex; margin-bottom:14px; align-items:flex-end; }
.pm-msg.mine { flex-direction: row-reverse; }
.pm-avatar { width:42px; height:42px; border-radius:50%; margin:0 10px; box-shadow:0 0 10px #0003;}
.pm-bubble {
    background:#222;
    color:#fff;
    border-radius:18px;
    padding:12px 18px 8px 18px;
    max-width:70%;
    min-width:90px;
    box-shadow:0 2px 14px #0005;
    position:relative;
    word-break:break-word;
    font-size:1.07em;
}
.pm-msg.mine .pm-bubble {
    background:#61dafb;
    color:#191919;
}
.pm-sender { font-weight:bold; font-size:0.98em; margin-bottom:4px;}
.pm-time { font-size:0.85em; color:#aaa; text-align:right; margin-top:4px;}
.pm-inputbox {
    width:100%; max-width:600px; margin:auto; display:flex; align-items:center; gap:8px; padding:18px 0;
}
.pm-inputbox textarea {
    flex:1; min-height:45px; border-radius:8px; border:0; background:#23272e; color:#fff; font-size:1.1em; padding:10px 14px;
}
.pm-inputbox button {
    background:#61dafb; color:#191919; border:0; border-radius:8px; font-size:1em; font-weight:bold; padding:8px 22px; cursor:pointer;
    transition:background 0.15s; margin-left:6px;
}
.pm-inputbox button:hover { background:#19a9e7; }

/* --- Notifications cards --- */
.notif-card { background:#23272e; border-radius:12px; padding:10px 16px; margin-bottom:8px; display:flex; align-items:center; }
.notif-card.unread { background:#2b3a55; box-shadow:0 0 8px #61dafb44; }
.notif-icon { font-size:1.3em; margin-right:10px; }
.notif-text { flex:1; }
.notif-text a {
  color: #61dafb;          /* Цвет ссылки уведомления */
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.notif-text a:hover {
  color: #40a2d8;          /* Цвет при наведении */
  text-decoration: underline;
}
.notif-time { color:#fff; font-size:0.93em; margin-left:10px; }

#pm-modal-bg {
  position:fixed;z-index:1000;left:0;top:0;width:100vw;height:100vh;
  background:rgba(0,0,0,0.22);
}
#pm-modal-menu {
  position:absolute;z-index:1002;background:#23272e;border-radius:16px;box-shadow:0 0 20px #000a;
  padding:22px 20px;display:flex;flex-direction:column;gap:8px;
}
.pm-menu-btn {
  position:absolute;top:8px;right:12px;cursor:pointer;font-size:1.18em;color:#aaa;padding:2px 8px;
}
.pm-edited {color:#aaa;font-size:0.85em;display:inline;margin-left:6px;}

/* Исправленный блюр — меню и его содержимое НЕ блюрятся! */
.pm-blur #main-content {
  filter: blur(100px);
}
.thread.pinned {
    border: 2px solid #ffd700;
    background: #23272e linear-gradient(90deg, #ffe06611 0%, #ffe06633 100%);
}
.pin-banner {
    background: #ffe066;
    color: #23272e;
    padding: 6px 18px;
    border-radius: 7px;
    font-weight: bold;
    margin-bottom: 7px;
    display: inline-block;
    box-shadow: 0 2px 8px #0002;
    letter-spacing: 0.05em;
}
.user-settings-panel {
    background: #222c;
    border-radius: 14px;
    padding: 22px 26px;
    max-width: 350px;
    margin: 32px auto 0 auto;
    box-shadow: 0 4px 32px #0002;
}
.setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    font-size: 1.09em;
    color: #eee;
}
.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
}
.switch input {display:none;}
.slider {
  position: absolute;
  cursor: pointer;
  background-color: #888b;
  border-radius: 24px;
  top:0; left:0; right:0; bottom:0;
  transition: background .2s;
}
.slider:before {
  content: "";
  position: absolute;
  left: 4px; top: 4px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform .2s;
}
input:checked + .slider {
  background: #1ed760;
}
input:checked + .slider:before {
  transform: translateX(22px);
}
.status-dot {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 50%;
  margin-right: 7px;
  background: #eee;
}
.status-dot.online { background: #00e05a; box-shadow: 0 0 8px #1ed76077; }
.status-dot.offline { background: #999; }
</style>
<script>
function toggleMenu() {
  document.querySelector('.menu').classList.toggle('open');
}
function dragElement(elm) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var header = document.getElementById("chatheader");
  if (header) header.onmousedown = dragMouseDown;
  function dragMouseDown(e) {
    e = e || window.event; e.preventDefault();
    pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
    elm.classList.add('dragging');
  }
  function elementDrag(e) {
    e = e || window.event; e.preventDefault();
    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
    elm.style.top = (elm.offsetTop - pos2) + "px"; elm.style.left = (elm.offsetLeft - pos1) + "px";
    localStorage.setItem('chatbox-pos', JSON.stringify({left:elm.style.left,top:elm.style.top}));
  }
  function closeDragElement() { document.onmouseup = null; document.onmousemove = null; elm.classList.remove('dragging'); }
}
function scrollChatDown(){let c=document.getElementById('chatmessages');if(c)c.scrollTop=c.scrollHeight;}
function loadChat(){
  fetch('/chat/api').then(r=>r.json()).then(d=>{
    let html='';
    for(let m of d){
      html+=`<div style="margin-bottom:6px"><span style="font-weight:bold;color:#61dafb">${m.author}</span>: <span>${m.text}</span> <span style="color:#777;font-size:0.89em;">${m.date.slice(11)}</span></div>`;
    }
    document.getElementById('chatmessages').innerHTML = html;
    scrollChatDown();
  });
}
function sendChat(){
  let inp=document.getElementById('chatinputtext');
  let msg=inp.value.trim();
  if(!msg)return;
  fetch('/chat/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:msg})}).then(r=>r.json()).then(d=>{
    inp.value='';
    loadChat();
  });
  return false;
}
setInterval(loadChat,2000);
window.addEventListener('DOMContentLoaded',function(){
  var chat = document.getElementById('chatbox');
  if(chat){ dragElement(chat);
    var pos = localStorage.getItem('chatbox-pos'); if(pos){ pos=JSON.parse(pos); chat.style.left=pos.left; chat.style.top=pos.top; }
  }
  if(document.getElementById('chatmessages')){loadChat();scrollChatDown();}
});
</script>
"""

def render_base(content, title="SuperForum"):
    user = get_user(session['user']) if session.get('user') else None
    flashes = ''.join(f'<div class="flash">{msg}</div>' for msg in get_flashed_messages())
    notif_count = count_unread_notifications(user["nickname"]) if user else 0
    menu = f"""
    <nav class="menu">
        <span class="burger" onclick="toggleMenu()">☰</span>
        <div class="menu-items">
            <a href="{url_for('index')}">Главная</a>
            <a href="{url_for('categories_page')}">Разделы</a>
            {f'<a href="{url_for("friends")}">Друзья</a>' if user else ''}
            {f'<a href="{url_for("notifications")}" style="color:#ffd700;">Уведомления{" ("+str(notif_count)+")" if notif_count else ""}</a>' if user else ''}
            {f'<a href="{url_for("profile", nickname=user["nickname"])}">Профиль</a>' if user else ''}
            {f'<a href="{url_for("admin_panel")}">Админка</a>' if user and user["role"]=="admin" else ''}
            {f'<a href="{url_for("logout")}">Выйти</a>' if user else f'<a href="{url_for("login")}">Войти</a><a href="{url_for("register")}">Регистрация</a>'}
        </div>
        {f'<span class="user"><img src="{get_avatar_url(user)}" class="avatar">{user["nickname"]}{get_user_banner(user)}</span>' if user else ''}
    </nav>
    """
    theme_sel = ""
    if user:
        theme = user.get("theme") or "dark"
        theme_sel = f'''
        <form method="get" action="" style="margin-bottom:12px;">
            <span>🎨 Тема:</span>
            <a href="{url_for('set_theme', theme='dark')}" style="margin-right:10px;{('font-weight:bold;text-decoration:underline;' if theme=='dark' else '')}">Dark</a>
            <a href="{url_for('set_theme', theme='light')}" style="margin-right:10px;{('font-weight:bold;text-decoration:underline;' if theme=='light' else '')}">Light</a>
            <a href="{url_for('set_theme', theme='matrix')}" style="{('font-weight:bold;text-decoration:underline;' if theme=='matrix' else '')}">Matrix</a>
        </form>
        '''
    chatbox = """
    <div id="chatbox">
      <div id="chatheader">💬 Общий онлайн-чат (тащи мышкой!)</div>
      <div id="chatmessages"></div>
      <form id="chatinput" onsubmit="return sendChat()">
        <input id="chatinputtext" autocomplete="off" maxlength="200" placeholder="Онлайн-чат для всех...">
        <button type="submit">⏎</button>
      </form>
    </div>
    """
    quote = random.choice(FORUM_QUOTES)
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    {BASE_STYLE}
    {get_theme_css(user)}
</head>
<body>
    <div class="container">
        {menu}
        {theme_sel}
        {flashes}
        <div style="font-size:1.12em;color:#61dafb;margin-bottom:8px;">💡 {quote}</div>
        {content}
        <div class="footer">
            <hr>
            Made with ❤️ by Copilot &amp; Flask &bull; 2025
        </div>
    </div>
    {chatbox}
</body>
</html>
"""

if __name__ == "__main__":
    app.run(debug=True, port=5000)
