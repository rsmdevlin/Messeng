<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Messenger TG Style</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --main-bg: #181f2a;
      --accent: #5e6cff;
      --bubble-user: linear-gradient(135deg, #5e6cff 50%, #8796fd 100%);
      --bubble-other: #232c3d;
      --input-bg: #232c3d;
      --white: #fff;
      --gray: #aeb6c8;
      --radius: 18px;
      --shadow: 0 2px 12px rgba(30, 40, 70, 0.16);
      --reaction-size: 22px;
      --reaction-gap: 7px;
      --menu-bg: #232c3d;
      --menu-shadow: 0 8px 32px #1115;
      --call-green: #49f36b;
      --danger: #ff5252;
    }
    body {
      margin: 0;
      background: var(--main-bg);
      font-family: 'Montserrat', Arial, sans-serif;
      min-height: 100vh;
      color: var(--white);
      overflow: hidden;
      transition: background 0.2s;
      touch-action: pan-y;
    }
    .theme-light {
      --main-bg: #f6f7fa;
      --accent: #5e6cff;
      --bubble-user: linear-gradient(135deg, #5e6cff 50%, #8796fd 100%);
      --bubble-other: #e6e8f3;
      --input-bg: #e1e4f0;
      --white: #222;
      --gray: #444b5d;
      --menu-bg: #fff;
      --menu-shadow: 0 8px 32px #eee5;
    }
    .main-wrap {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background: var(--main-bg);
      transition: background 0.2s;
    }
    .messenger {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      max-width: 500px;
      margin: 0 auto;
      height: 100vh;
      width: 100vw;
      background: var(--main-bg);
      position: absolute;
      left:0; top:0; right:0; bottom:0;
      z-index: 2;
      transition: left 0.25s cubic-bezier(.4,.8,.3,1), right 0.25s cubic-bezier(.4,.8,.3,1);
      box-shadow: var(--shadow);
      touch-action: pan-y;
    }
    .header {
      padding: 18px 14px 14px 14px;
      background: var(--accent);
      display: flex;
      align-items: center;
      box-shadow: var(--shadow);
      border-bottom-left-radius: var(--radius);
      border-bottom-right-radius: var(--radius);
      position: sticky;
      top: 0;
      z-index: 3;
      transition: background 0.2s;
      user-select: none;
    }
    .header .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 12px;
      border: 2px solid #fff3;
      background: #fff3;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      color: var(--white);
      cursor: pointer;
      transition: border 0.18s;
    }
    .header .avatar:hover { border: 2px solid #fff; }
    .header .user-info {
      flex: 1;
      min-width: 0;
    }
    .header .user-info .name {
      font-weight: bold;
      font-size: 18px;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: color 0.18s;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 140px;
      display: inline-block;
    }
    .header .user-info .status {
      font-size: 13px;
      color: #fff9;
      margin-top: 2px;
    }
    .header .actions {
      display: flex;
      gap: 7px;
      margin-left: 10px;
    }
    .header button {
      background: none;
      border: none;
      color: var(--white);
      font-size: 22px;
      cursor: pointer;
      padding: 0 5px;
      opacity: 0.93;
      transition: opacity 0.15s;
    }
    .header button:hover { opacity: 1; }
    .chat-area {
      flex: 1 1 auto;
      overflow-y: auto;
      display: flex;
      flex-direction: column-reverse;
      padding: 14px 4vw 14px 4vw;
      gap: 14px;
      scroll-behavior: smooth;
      background: var(--main-bg);
      min-height: 0;
      position: relative;
      z-index: 1;
    }
    .bubble-row {
      display: flex;
      align-items: flex-end;
      margin-bottom: 2px;
      position: relative;
      user-select: none;
      z-index: 1;
    }
    .bubble-row.user { justify-content: flex-end; }
    .bubble-row.other { justify-content: flex-start; }
    .bubble {
      max-width: 74vw;
      min-width: 48px;
      padding: 11px 18px 19px 18px;
      border-radius: var(--radius);
      box-shadow: 0 2px 10px #0002;
      font-size: 16px;
      line-height: 1.42;
      word-break: break-word;
      position: relative;
      margin: 1px 0;
      background: var(--bubble-other);
      color: var(--gray);
      transition: background 0.17s, color 0.17s;
      animation: bubble-in 0.18s;
      cursor: pointer;
      user-select: text;
    }
    @keyframes bubble-in {
      from { transform: scale(0.95) translateY(16px); opacity: 0; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }
    .bubble.user {
      background: var(--bubble-user);
      color: var(--white);
      border-bottom-right-radius: 4px;
      margin-left: 9vw;
    }
    .bubble.other {
      background: var(--bubble-other);
      color: var(--gray);
      border-bottom-left-radius: 4px;
      margin-right: 9vw;
    }
    .bubble .meta {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #fff9;
      opacity: 0.88;
      gap: 3px;
      position: absolute;
      bottom: 5px; right: 16px;
      z-index: 1;
    }
    .bubble.other .meta { color: #5e6cffb7;}
    .bubble .meta .time { margin-right: 4px; }
    .bubble .meta .status {
      font-size: 11px;
      color: #c7ffb5;
    }
    /* Реакции */
    .reactions-bar {
      display: flex;
      gap: var(--reaction-gap);
      align-items: center;
      margin-top: 4px;
      margin-bottom: -5px;
      margin-left: 2px;
      min-height: var(--reaction-size);
      user-select: none;
      flex-wrap: wrap;
      max-width: 88vw;
      z-index: 2;
      position: relative;
    }
    .reaction {
      font-size: var(--reaction-size);
      line-height: 1;
      background: #fff2;
      border-radius: 50%;
      padding: 2px 7px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background 0.12s, transform 0.13s;
      box-shadow: 0 1px 6px #0001;
      border: 1.2px solid #fff4;
      margin-right: 2px;
      min-width: 28px;
    }
    .reaction.selected, .reaction:hover {
      background: var(--accent);
      color: #fff;
      transform: scale(1.12);
      border-color: #fff;
      z-index: 2;
    }
    .reaction .count {
      font-size: 13px;
      margin-left: 2px;
      color: #fffde9;
      font-weight: bold;
      pointer-events: none;
    }
    .reaction .users-tip {
      display: none;
      position: absolute;
      bottom: 115%;
      left: 45%;
      background: #222b;
      color: #fff;
      font-size: 14px;
      padding: 3px 12px;
      border-radius: 12px;
      white-space: pre-line;
      z-index: 22;
      pointer-events: none;
    }
    .reaction:hover .users-tip {
      display: block;
      animation: fade-in 0.18s;
    }
    .reaction-panel {
      position: fixed;
      left: 0; right: 0;
      bottom: 0;
      background: var(--menu-bg);
      box-shadow: var(--menu-shadow);
      padding: 16px 17px 10px 17px;
      border-top-left-radius: 20px;
      border-top-right-radius: 20px;
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      gap: 3px 12px;
      justify-content: center;
      min-height: 72px;
      animation: fade-in 0.17s;
      user-select: none;
    }
    .reaction-panel .reaction {
      font-size: 29px;
      margin: 0 2px 5px 2px;
      padding: 1px 10px;
      border-radius: 13px;
      background: none;
      border: none;
      box-shadow: none;
      transition: background 0.1s;
    }
    .reaction-panel .reaction.selected {
      background: var(--accent);
      color: #fff;
      box-shadow: 0 2px 14px #5e6cff22;
    }
    .reaction-panel .add-custom {
      border: none;
      background: none;
      font-size: 25px;
      margin-left: 9px;
      color: var(--accent);
      cursor: pointer;
    }
    .reaction-panel input {
      width: 36px;
      height: 36px;
      font-size: 22px;
      border-radius: 50%;
      border: none;
      text-align: center;
      margin-left: 3px;
      background: var(--main-bg);
      color: var(--accent);
      box-shadow: 0 1px 7px #0001;
    }
    .reaction-panel .close-reactions {
      position: absolute;
      top: 7px; right: 23px;
      font-size: 31px;
      color: #aaa;
      background: none;
      border: none;
      cursor: pointer;
      z-index: 101;
      opacity: 0.8;
      transition: color 0.13s;
    }
    .reaction-panel .close-reactions:hover { color: var(--danger);}
    /* Контекстное меню */
    .context-menu {
      position: fixed;
      bottom: 90px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--menu-bg);
      color: var(--white);
      box-shadow: var(--menu-shadow);
      border-radius: 22px;
      min-width: 170px;
      padding: 10px 0;
      z-index: 111;
      animation: fade-in 0.14s;
      font-size: 17px;
    }
    .context-menu button {
      width: 100%;
      background: none;
      border: none;
      color: inherit;
      padding: 12px 26px;
      font-size: inherit;
      text-align: left;
      cursor: pointer;
      transition: background 0.11s;
    }
    .context-menu button:hover {
      background: #5e6cff13;
      color: var(--accent);
    }
    .context-menu .danger {
      color: var(--danger);
    }
    /* Свайп Меню (слева) */
    .side-menu {
      position: fixed;
      left: -100vw; top: 0; width: 70vw; max-width: 320px; height: 100vh;
      background: var(--menu-bg);
      box-shadow: var(--menu-shadow);
      z-index: 110;
      transition: left 0.23s cubic-bezier(.4,.8,.3,1);
      border-top-right-radius: 18px;
      border-bottom-right-radius: 18px;
      display: flex;
      flex-direction: column;
      padding: 0 0 0 0;
      min-width: 220px;
      user-select: none;
    }
    .side-menu.open { left: 0; }
    .side-menu .menu-header {
      background: var(--accent);
      color: #fff;
      padding: 30px 15px 18px 22px;
      border-top-right-radius: 18px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .side-menu .menu-avatar {
      font-size: 38px;
      border: 3px solid #fff4;
      background: #fff2;
      border-radius: 50%;
      width: 50px; height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .side-menu .menu-user {
      flex: 1;
    }
    .side-menu .menu-user .name {
      font-size: 19px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .side-menu .menu-user .about {
      font-size: 14px;
      color: #e3e7ff;
      opacity: 0.95;
      margin-top: 2px;
    }
    .side-menu nav {
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .side-menu nav button {
      background: none;
      border: none;
      color: inherit;
      text-align: left;
      padding: 15px 28px;
      font-size: 16.5px;
      cursor: pointer;
      transition: background 0.11s;
    }
    .side-menu nav button:hover {
      background: #5e6cff13;
      color: var(--accent);
    }
    /* Список чатов (справа) */
    .chat-list {
      position: fixed;
      right: -100vw; top: 0; width: 72vw; max-width: 340px; height: 100vh;
      background: var(--menu-bg);
      box-shadow: var(--menu-shadow);
      z-index: 110;
      transition: right 0.23s cubic-bezier(.4,.8,.3,1);
      border-top-left-radius: 18px;
      border-bottom-left-radius: 18px;
      display: flex;
      flex-direction: column;
      padding: 0;
      user-select: none;
    }
    .chat-list.open { right: 0; }
    .chat-list .chat-header {
      background: var(--accent);
      color: #fff;
      padding: 30px 15px 18px 22px;
      border-top-left-radius: 18px;
      font-size: 22px;
      font-weight: bold;
      letter-spacing: 0.4px;
    }
    .chat-list .chat-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 13px 21px 13px 17px;
      border-bottom: 1.5px solid #5e6cff13;
      cursor: pointer;
      transition: background 0.11s;
    }
    .chat-list .chat-item:hover {
      background: #5e6cff13;
    }
    .chat-list .chat-avatar {
      font-size: 28px;
      border-radius: 50%;
      background: #fff2;
      border: 2px solid #fff4;
      width: 42px; height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .chat-list .chat-info {
      flex: 1;
      min-width: 0;
    }
    .chat-list .chat-name {
      font-weight: bold;
      font-size: 17px;
      margin-bottom: 2px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .chat-list .chat-last {
      font-size: 14px;
      color: #b3b8d8;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 120px;
    }
    /* Ввод */
    .input-area {
      display: flex;
      align-items: center;
      padding: 10px 4vw 18px 4vw;
      background: var(--main-bg);
      box-shadow: 0 -2px 16px #0001;
      border-top-left-radius: var(--radius);
      border-top-right-radius: var(--radius);
      position: sticky;
      bottom: 0;
      z-index: 4;
      gap: 8px;
      transition: background 0.2s;
    }
    .input-area input {
      flex: 1 1 auto;
      background: var(--input-bg);
      color: var(--white);
      border: none;
      outline: none;
      font-size: 16px;
      padding: 13px 16px;
      border-radius: 100px;
      margin-right: 4px;
      box-shadow: 0 1px 8px #1112;
      transition: box-shadow 0.12s;
    }
    .input-area input:focus { box-shadow: 0 2px 12px #5e6cff44; }
    .input-area button {
      background: var(--accent);
      color: var(--white);
      border: none;
      border-radius: 100px;
      font-size: 21px;
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px #5e6cff22;
      cursor: pointer;
      transition: background 0.1s;
    }
    .input-area button:active { background: #4758db; }
    /* Профиль и настройки */
    .modal, .profile-modal, .call-modal {
      display: none;
      position: fixed;
      left: 0; top: 0; width: 100vw; height: 100vh;
      background: #0007;
      z-index: 150;
      justify-content: center;
      align-items: center;
    }
    .modal.active, .profile-modal.active, .call-modal.active { display: flex; }
    .modal-content {
      background: var(--main-bg);
      color: var(--white);
      border-radius: 22px;
      box-shadow: 0 8px 32px #1115;
      padding: 28px 18px 18px 18px;
      min-width: 85vw;
      max-width: 380px;
      transition: background 0.2s;
      position: relative;
      animation: fade-in 0.18s;
    }
    .modal-content h2 {
      margin-top: 0;
      margin-bottom: 14px;
      font-size: 23px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-align: center;
    }
    .modal-content label {
      display: block;
      margin-top: 14px;
      margin-bottom: 5px;
      font-weight: 500;
      font-size: 15px;
    }
    .modal-content input, .modal-content textarea, .modal-content select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 12px;
      border: none;
      background: var(--input-bg);
      color: var(--white);
      font-size: 16px;
      margin-bottom: 6px;
      margin-top: 2px;
      box-shadow: 0 1px 5px #1112;
      transition: background 0.13s, color 0.13s;
      resize: none;
    }
    .modal-content .avatar-list {
      display: flex;
      gap: 9px;
      margin: 8px 0 14px 0;
      flex-wrap: wrap;
      justify-content: start;
    }
    .modal-content .avatar-btn {
      font-size: 28px;
      border: 2px solid #eee2;
      background: none;
      border-radius: 50%;
      width: 38px; height: 38px;
      cursor: pointer;
      transition: border 0.18s;
    }
    .modal-content .avatar-btn.selected {
      border: 2px solid var(--accent);
      background: #fff2;
    }
    .modal-content .close-btn {
      position: absolute;
      top: 10px; right: 15px;
      background: none; border: none;
      color: #fff8;
      font-size: 26px;
      cursor: pointer;
      transition: color 0.15s;
    }
    .modal-content .close-btn:hover { color: #fff; }
    .theme-switcher {
      margin-top: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 17px;
      justify-content: center;
    }
    .theme-switcher button {
      padding: 7px 19px;
      border-radius: 100px;
      border: none;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 1px 7px #5e6cff24;
      margin-left: 6px;
      transition: background 0.12s;
    }
    .theme-switcher button.active {
      background: #fff2;
      color: var(--accent);
      border: 1.5px solid var(--accent);
    }
    .profile-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: var(--main-bg);
      color: var(--white);
      border-radius: 22px;
      box-shadow: 0 8px 32px #1115;
      padding: 38px 18px 18px 18px;
      min-width: 88vw;
      max-width: 390px;
      position: relative;
      margin: 26px auto 0 auto;
      animation: fade-in 0.18s;
    }
    .profile-view .avatar-big {
      font-size: 63px;
      border: 4px solid var(--accent);
      border-radius: 50%;
      margin-bottom: 13px;
      background: #fff1;
      width: 80px; height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .profile-view .name {
      font-size: 22px;
      font-weight: bold;
      margin: 0 0 3px 0;
      text-align: center;
    }
    .profile-view .about {
      font-size: 15px;
      color: var(--gray);
      margin-bottom: 12px;
      text-align: center;
      white-space: pre-line;
    }
    .profile-view .edit-btn {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      padding: 7px 21px;
      margin-bottom: 12px;
      margin-top: 5px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.14s;
    }
    .profile-view .edit-btn:hover { background: #4758db; }
    .profile-view .close-btn {
      position: absolute;
      top: 10px; right: 15px;
      background: none; border: none;
      color: #fff8;
      font-size: 28px;
      cursor: pointer;
      transition: color 0.15s;
    }
    .profile-view .close-btn:hover { color: #fff; }
    .profile-view .profile-details {
      text-align: left;
      margin-top: 9px;
      font-size: 15px;
      color: #fff9;
    }
    .profile-view .profile-details b {
      color: #fff;
      font-weight: 600;
    }
    /* Вызов */
    .call-modal .call-content {
      background: var(--main-bg);
      border-radius: 28px;
      box-shadow: var(--menu-shadow);
      padding: 36px 24px 24px 24px;
      text-align: center;
      min-width: 82vw;
      max-width: 340px;
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: fade-in 0.18s;
      position: relative;
    }
    .call-modal .call-avatar {
      font-size: 62px;
      border: 4px solid var(--accent);
      border-radius: 50%;
      margin-bottom: 18px;
      margin-top: 2px;
      width: 84px; height: 84px;
      display: flex; align-items: center; justify-content: center;
      background: #fff1;
    }
    .call-modal .call-name {
      font-size: 23px;
      font-weight: bold;
      margin-bottom: 5px;
      color: var(--white);
    }
    .call-modal .call-status {
      color: var(--accent);
      margin-bottom: 22px;
      font-size: 15px;
      letter-spacing: 0.3px;
    }
    .call-modal .call-actions {
      display: flex;
      gap: 28px;
      margin-top: 19px;
    }
    .call-modal .call-btn {
      background: var(--call-green);
      color: #fff;
      border: none;
      border-radius: 50%;
      font-size: 29px;
      width: 60px; height: 60px;
      display: flex;
      align-items: center; justify-content: center;
      box-shadow: 0 2px 14px #49f36b33;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      outline: none;
    }
    .call-modal .call-btn.danger {
      background: var(--danger);
      color: #fff;
      box-shadow: 0 2px 14px #ff525244;
    }
    .call-modal .close-btn {
      position: absolute;
      top: 12px; right: 17px;
      font-size: 26px;
      color: #fff7;
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.15s;
    }
    .call-modal .close-btn:hover { color: #fff; }
    /* Scrollbar styles */
    ::-webkit-scrollbar { width: 7px; background: #232c3d; }
    ::-webkit-scrollbar-thumb { background: #5e6cff66; border-radius: 10px; }
    @media (max-width: 600px) {
      .main-wrap, .messenger { max-width: 100vw; }
      .chat-area { padding: 12px 2vw 12px 2vw; }
      .input-area { padding: 9px 2vw 13px 2vw; }
      .bubble { font-size: 15px; }
      .modal-content, .profile-view, .call-modal .call-content { min-width: 98vw; }
      .side-menu, .chat-list { width: 94vw; min-width: 0; max-width: none;}
    }
  </style>
</head>
<body>
<div class="main-wrap" id="main-wrap">
  <!-- Меню (свайп влево) -->
  <div class="side-menu" id="side-menu">
    <div class="menu-header">
      <div class="menu-avatar" id="side-avatar"></div>
      <div class="menu-user">
        <div class="name" id="side-name"></div>
        <div class="about" id="side-about"></div>
      </div>
    </div>
    <nav>
      <button onclick="showProfile()">Профиль</button>
      <button onclick="showSettings()">Настройки</button>
      <button onclick="switchTheme()">Сменить тему</button>
      <button onclick="alert('В будущем: Стикеры, Боты, Каналы, Группы!')">Скоро ещё фичи</button>
    </nav>
  </div>

  <!-- Список чатов (свайп вправо) -->
  <div class="chat-list" id="chat-list">
    <div class="chat-header">Чаты</div>
    <div class="chat-item" onclick="hideChatList()">
      <div class="chat-avatar" id="chat-avatar"></div>
      <div class="chat-info">
        <div class="chat-name" id="chat-title"></div>
        <div class="chat-last" id="chat-lastmsg"></div>
      </div>
    </div>
  </div>

  <!-- Чат -->
  <div class="messenger" id="messenger">
    <div class="header">
      <div class="avatar" id="avatar" title="Открыть профиль"></div>
      <div class="user-info">
        <div class="name" id="chat-name"></div>
        <div class="status" id="user-status">Онлайн • сейчас</div>
      </div>
      <div class="actions">
        <button title="Вызов" id="call-btn">&#x1F4DE;</button>
        <button title="Видеозвонок">&#x1F4F9;</button>
        <button title="Меню" id="menu-btn">&#9776;</button>
      </div>
    </div>
    <div id="chat-area" class="chat-area"></div>
    <form class="input-area" id="input-form" autocomplete="off">
      <input id="msg-input" type="text" placeholder="Введите сообщение..." maxlength="1000" autocomplete="off">
      <button type="submit" title="Отправить"><span>&#x27A4;</span></button>
    </form>
  </div>
</div>

<!-- Настройки профиля -->
<div class="modal" id="settings-modal">
  <div class="modal-content">
    <button class="close-btn" id="close-settings" title="Закрыть">&times;</button>
    <h2>Настройки профиля</h2>
    <label for="name-input">Имя:</label>
    <input type="text" id="name-input" maxlength="20">
    <label for="about-input">О себе:</label>
    <textarea id="about-input" maxlength="80" rows="2" style="resize:none"></textarea>
    <label>Аватар:</label>
    <div class="avatar-list" id="avatar-list"></div>
    <div class="theme-switcher">
      Тема:
      <button type="button" id="theme-dark" class="active">🌙 Тёмная</button>
      <button type="button" id="theme-light">☀️ Светлая</button>
    </div>
  </div>
</div>
<!-- Просмотр профиля -->
<div class="profile-modal" id="profile-modal">
  <div class="profile-view">
    <button class="close-btn" id="close-profile" title="Закрыть">&times;</button>
    <div class="avatar-big" id="profile-avatar"></div>
    <div class="name" id="profile-name"></div>
    <div class="about" id="profile-about"></div>
    <button class="edit-btn" id="edit-profile-btn">Редактировать</button>
    <div class="profile-details">
      <div><b>Имя:</b> <span id="profile-details-name"></span></div>
      <div><b>О себе:</b> <span id="profile-details-about"></span></div>
      <div><b>Тема:</b> <span id="profile-details-theme"></span></div>
    </div>
  </div>
</div>
<!-- Вызов -->
<div class="call-modal" id="call-modal">
  <div class="call-content">
    <button class="close-btn" id="close-call" title="Закрыть">&times;</button>
    <div class="call-avatar" id="call-avatar"></div>
    <div class="call-name" id="call-name"></div>
    <div class="call-status" id="call-status"></div>
    <div class="call-actions">
      <button class="call-btn danger" id="call-end">&#128222;</button>
      <button class="call-btn" id="call-accept">&#128222;</button>
    </div>
  </div>
</div>

<script>
  // ====== Data & State ======
  const AVATARS = [
    '😎','🦾','🧠','👽','🦊','🐼','🐸','🐧','🐱','🐻','🦁','🐯','🦄','🐙','👾','🤖','🧑‍💻','🚀','🎩','🍕','🌈','🥷','😺','🦉','🦋','🦦','🦕','🦜','🐉','🦔'
  ];
  const REACTION_EMOJIS = [
    '👍','😂','❤️','🔥','😍','👏','😎','🎉','🤔','🥲','😭','🥰','😮','😅','💯','😡','😏','🫶','🙏','😳'
  ];
  let user = JSON.parse(localStorage.getItem('chatUser')) || {
    id: 1,
    name: 'Вы',
    about: 'Я использую топовый мессенджер!',
    avatar: AVATARS[0],
    theme: 'dark'
  };
  const other = {
    id: 2,
    name: 'Андрей Веб',
    avatar: '🦾'
  };
  let messages = JSON.parse(localStorage.getItem('chatMsgs')) || [
    {
      id: 1,
      from: 2,
      text: 'Привет! 👋\nГотов протестировать крутой мессенджер?',
      time: new Date(Date.now() - 1000 * 80),
      status: 'read',
      reactions: {},
      deleted: [],
    },
    {
      id: 2,
      from: 1,
      text: 'Привет! Уже запускаю 🚀\nДизайн просто топ🔥',
      time: new Date(Date.now() - 1000 * 55),
      status: 'read',
      reactions: {},
      deleted: [],
    },
    {
      id: 3,
      from: 2,
      text: 'Жду твои сообщения и идеи! 😉',
      time: new Date(Date.now() - 1000 * 40),
      status: 'delivered',
      reactions: {},
      deleted: [],
    }
  ];
  let editingMsg = null;
  let chatList = [
    {
      id: 1,
      name: other.name,
      avatar: other.avatar,
      last: () => messages.length ? (messages[messages.length-1].text || '') : ''
    }
  ];

  // ====== DOM ======
  const chatArea = document.getElementById('chat-area');
  const inputForm = document.getElementById('input-form');
  const msgInput = document.getElementById('msg-input');
  const avatarDiv = document.getElementById('avatar');
  const chatNameDiv = document.getElementById('chat-name');
  const messengerDiv = document.getElementById('messenger');
  const mainWrap = document.getElementById('main-wrap');

  // ====== Render ======
  function renderMessages() {
    chatArea.innerHTML = '';
    messages.slice(-90).reverse().forEach((msg, idx) => {
      // Не показывать если soft deleted у нас
      if (msg.deleted && msg.deleted.includes(user.id)) return;
      const isUser = msg.from === user.id;
      const row = document.createElement('div');
      row.className = 'bubble-row ' + (isUser ? 'user' : 'other');
      row.dataset.msgId = msg.id;

      // Bubble
      const bubble = document.createElement('div');
      bubble.className = 'bubble ' + (isUser ? 'user' : 'other');
      bubble.innerHTML = msg.text.replace(/\n/g, '<br>');
      bubble.title = "Двойной тап — реакция, долгий тап — меню";
      bubble.tabIndex = 0;

      // Реакции
      const reactions = msg.reactions || {};
      const keys = Object.keys(reactions).filter(e=>reactions[e].length>0);
      if (keys.length > 0) {
        const bar = document.createElement('div');
        bar.className = 'reactions-bar';
        keys.sort((a,b) => reactions[b].length - reactions[a].length);
        for (let emoji of keys) {
          const usersArr = reactions[emoji] || [];
          const selected = usersArr.includes(user.id);
          const r = document.createElement('div');
          r.className = 'reaction' + (selected ? ' selected' : '');
          r.innerHTML = emoji + `<span class="count">${usersArr.length>1?' '+usersArr.length:''}</span>`;
          // Tooltip с именами юзеров
          const tip = document.createElement('span');
          tip.className = 'users-tip';
          let usersTip = usersArr.map(uid => uid===user.id?user.name:other.name).join('\n');
          tip.textContent = usersTip;
          r.appendChild(tip);
          r.onmouseenter = () => tip.style.display = 'block';
          r.onmouseleave = () => tip.style.display = 'none';
          r.onclick = (ev) => {
            ev.stopPropagation();
            toggleReaction(msg.id, emoji);
          };
          bar.appendChild(r);
        }
        bubble.appendChild(bar);
      }

      // Метаданные
      const meta = document.createElement('div');
      meta.className = 'meta';
      const time = document.createElement('span');
      time.className = 'time';
      time.textContent = formatTime(msg.time);
      meta.appendChild(time);
      if (isUser) {
        const status = document.createElement('span');
        status.className = 'status';
        status.textContent = msg.status === 'read' ? '✓✓' : (msg.status === 'delivered' ? '✓' : '');
        meta.appendChild(status);
      }
      bubble.appendChild(meta);

      // Реакции и меню: двойной тап, долгий тап или ⋮ (на bubble)
      let tapTimer = null;
      let tapCount = 0, tapDelay = 0;
      bubble.onmousedown = (e) => {
        tapTimer = setTimeout(() => showMsgMenu(msg, bubble), 400);
      };
      bubble.onmouseup = () => { clearTimeout(tapTimer); };
      bubble.onmouseleave = () => { clearTimeout(tapTimer); };
      bubble.ontouchstart = (e) => {
        tapTimer = setTimeout(() => showMsgMenu(msg, bubble), 390);
      };
      bubble.ontouchend = () => { clearTimeout(tapTimer); };
      bubble.onclick = (e) => {
        tapCount++;
        if (tapCount === 1) {
          tapDelay = setTimeout(()=>tapCount=0, 350);
        } else if (tapCount===2) {
          tapCount = 0;
          clearTimeout(tapDelay);
          showReactionPanel(msg, bubble);
        }
      };
      // Двойной тап для десктопа (dblclick)
      bubble.ondblclick = (e) => {
        showReactionPanel(msg, bubble);
      };

      row.appendChild(bubble);
      chatArea.appendChild(row);
    });
    saveState();
  }
  function formatTime(date) {
    if (!(date instanceof Date)) date = new Date(date);
    let h = date.getHours(), m = date.getMinutes();
    return (h < 10 ? '0':'') + h + ':' + (m < 10 ? '0':'') + m;
  }

  // ===== Реакции как в ТГ =====
  function toggleReaction(msgId, emoji) {
    const msg = messages.find(m => m.id == msgId);
    if (!msg.reactions) msg.reactions = {};
    const arr = msg.reactions[emoji] || [];
    if (arr.includes(user.id)) {
      msg.reactions[emoji] = arr.filter(uid => uid !== user.id);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      // Снимаем предыдущую свою реакцию (тг стиль)
      for (let e of Object.keys(msg.reactions)) {
        msg.reactions[e] = msg.reactions[e].filter(uid=>uid!==user.id);
        if (msg.reactions[e].length === 0) delete msg.reactions[e];
      }
      msg.reactions[emoji] = msg.reactions[emoji]||[];
      msg.reactions[emoji].push(user.id);
    }
    renderMessages(); scrollToBottom();
  }
  let currentReactionPanel = null;
  function showReactionPanel(msg, bubble) {
    closeAllPickers();
    const panel = document.createElement('div');
    panel.className = 'reaction-panel';
    for (let emoji of REACTION_EMOJIS) {
      const btn = document.createElement('button');
      btn.className = 'reaction'+(msg.reactions[emoji]&&msg.reactions[emoji].includes(user.id)?' selected':'');
      btn.innerText = emoji;
      btn.onclick = (ev) => {
        ev.stopPropagation();
        toggleReaction(msg.id, emoji);
        closeAllPickers();
      };
      panel.appendChild(btn);
    }
    // Своя реакция
    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.maxLength = 2;
    customInput.placeholder = '🖊';
    customInput.title = 'Введи любой эмодзи!';
    panel.appendChild(customInput);
    const addBtn = document.createElement('button');
    addBtn.className = 'add-custom reaction';
    addBtn.title = 'Добавить свою реакцию';
    addBtn.innerText = "➕";
    addBtn.onclick = (ev) => {
      ev.stopPropagation();
      let val = customInput.value.trim();
      if (val && /[\p{Emoji}]/u.test(val)) {
        toggleReaction(msg.id, val);
        closeAllPickers();
      } else {
        customInput.value = '';
        customInput.placeholder = '😄';
      }
    };
    panel.appendChild(addBtn);
    // Закрытие крестик
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-reactions';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = closeAllPickers;
    panel.appendChild(closeBtn);
    document.body.appendChild(panel);
    customInput.focus();
    currentReactionPanel = panel;
    setTimeout(()=>{document.addEventListener('click', closeAllPickers, {once:true});}, 20);
  }
  function closeAllPickers() {
    if (currentReactionPanel && currentReactionPanel.parentNode) {
      currentReactionPanel.parentNode.removeChild(currentReactionPanel);
      currentReactionPanel = null;
    }
    if (currentMenu && currentMenu.parentNode) {
      currentMenu.parentNode.removeChild(currentMenu);
      currentMenu = null;
    }
  }
  // ========== Контекстное меню сообщения ============
  let currentMenu = null;
  function showMsgMenu(msg, bubble) {
    closeAllPickers();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    // Ответить
    let btn = document.createElement('button');
    btn.textContent = 'Ответить';
    btn.onclick = () => { closeAllPickers(); msgInput.value = `> ${msg.text.replace(/\n/g,' ')}\n`; msgInput.focus();}
    menu.appendChild(btn);
    // Реакция
    btn = document.createElement('button');
    btn.textContent = 'Реакция';
    btn.onclick = () => { closeAllPickers(); showReactionPanel(msg, bubble);}
    menu.appendChild(btn);
    // Редактировать (только свои)
    if (msg.from === user.id) {
      btn = document.createElement('button');
      btn.textContent = 'Редактировать';
      btn.onclick = () => { closeAllPickers(); startEditMessage(msg);}
      menu.appendChild(btn);
    }
    // Удаление
    if (msg.from === user.id) {
      let b1 = document.createElement('button');
      b1.textContent = 'Удалить у меня';
      b1.className = 'danger';
      b1.onclick = () => { closeAllPickers(); deleteMsg(msg, 'me');}
      menu.appendChild(b1);
      let b2 = document.createElement('button');
      b2.textContent = 'Удалить у всех';
      b2.className = 'danger';
      b2.onclick = () => { closeAllPickers(); deleteMsg(msg, 'all');}
      menu.appendChild(b2);
    } else {
      let b = document.createElement('button');
      b.textContent = 'Удалить у меня';
      b.className = 'danger';
      b.onclick = () => { closeAllPickers(); deleteMsg(msg, 'me');}
      menu.appendChild(b);
    }
    document.body.appendChild(menu);
    currentMenu = menu;
    setTimeout(()=>{document.addEventListener('click', closeAllPickers, {once:true});}, 25);
  }
  // ========== Редактирование ===========
  function startEditMessage(msg) {
    editingMsg = msg;
    msgInput.value = msg.text;
    msgInput.focus();
    msgInput.style.background = "#ffe77c";
    msgInput.style.color = "#181f2a";
    msgInput.select();
  }
  inputForm.onsubmit = (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;
    if (editingMsg) {
      editingMsg.text = text;
      editingMsg.time = new Date();
      editingMsg.status = 'delivered';
      editingMsg = null;
      msgInput.style.background = '';
      msgInput.style.color = '';
      msgInput.value = '';
      renderMessages();
      scrollToBottom();
      saveState();
      return;
    }
    const msg = {
      id: Date.now(),
      from: user.id,
      text,
      time: new Date(),
      status: 'delivered',
      reactions: {},
      deleted: []
    };
    messages.push(msg);
    msgInput.value = '';
    renderMessages();
    scrollToBottom();
    setTimeout(() => {
      msg.status = 'read'; renderMessages();
    }, 850);
    fakeReply(text);
    saveState();
  };
  // ========== Удаление ===========
  function deleteMsg(msg, mode) {
    if (mode === 'me') {
      msg.deleted = msg.deleted||[];
      if (!msg.deleted.includes(user.id)) msg.deleted.push(user.id);
    } else if (mode === 'all') {
      messages = messages.filter(m => m.id !== msg.id);
    }
    renderMessages(); saveState();
  }
  // ========== Fake Bot ===========
  function fakeReply(lastUserMsg) {
    if (lastUserMsg.toLowerCase().includes('привет')) {
      setTimeout(() => { addOtherMsg('👏 Рад тебя видеть!'); }, 1300);
    } else if (lastUserMsg.toLowerCase().includes('идея')) {
      setTimeout(() => { addOtherMsg('Пиши свои идеи, обсудим!'); }, 1700);
    } else if (lastUserMsg.endsWith('?')) {
      setTimeout(() => { addOtherMsg('Интересный вопрос! 🤔'); }, 1100);
    } else if (lastUserMsg.length > 30) {
      setTimeout(() => { addOtherMsg('Сообщение принято! 👍'); }, 1200);
    } else {
      setTimeout(() => { addOtherMsg('😊'); }, 1000);
    }
  }
  function addOtherMsg(text) {
    messages.push({
      id: Date.now() + Math.random(),
      from: other.id,
      text,
      time: new Date(),
      status: 'delivered',
      reactions: {},
      deleted: []
    });
    renderMessages();
    scrollToBottom();
    saveState();
  }
  // ========== Keyboard UX ==========
  msgInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      inputForm.dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      editingMsg = null;
      msgInput.style.background = '';
      msgInput.style.color = '';
      msgInput.value = '';
    }
  });
  // ========== Профиль и настройки ==========
  avatarDiv.onclick = showProfile;
  function showProfile() {
    document.getElementById('profile-modal').classList.add('active');
    document.getElementById('profile-avatar').textContent = user.avatar;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-about').textContent = user.about || '';
    document.getElementById('profile-details-name').textContent = user.name;
    document.getElementById('profile-details-about').textContent = user.about || '—';
    document.getElementById('profile-details-theme').textContent = user.theme==='light'?'Светлая':'Тёмная';
  }
  document.getElementById('close-profile').onclick = () =>
    document.getElementById('profile-modal').classList.remove('active');
  document.getElementById('edit-profile-btn').onclick = () => {
    document.getElementById('profile-modal').classList.remove('active');
    showSettings();
  };
  document.getElementById('menu-btn').onclick = () => {
    openSideMenu();
  };
  function showSettings() {
    document.getElementById('settings-modal').classList.add('active');
    document.getElementById('name-input').value = user.name;
    document.getElementById('about-input').value = user.about||'';
    // Аватары
    const avList = document.getElementById('avatar-list');
    avList.innerHTML = '';
    AVATARS.forEach(a => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-btn'+(user.avatar===a?' selected':'');
      btn.innerText = a;
      btn.onclick = () => {
        user.avatar = a;
        document.querySelectorAll('.avatar-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
      };
      avList.appendChild(btn);
    });
    // Темы
    document.getElementById('theme-dark').classList.toggle('active', user.theme==='dark');
    document.getElementById('theme-light').classList.toggle('active', user.theme==='light');
  }
  // Закрыть
  document.getElementById('close-settings').onclick = () => {
    document.getElementById('settings-modal').classList.remove('active');
    saveUser();
    applyProfile();
  };
  document.getElementById('settings-modal').onclick = (e) => {
    if (e.target === document.getElementById('settings-modal'))
      document.getElementById('close-settings').onclick();
  };
  document.getElementById('name-input').oninput = (e) => {
    user.name = e.target.value.slice(0, 20);
  };
  document.getElementById('about-input').oninput = (e) => {
    user.about = e.target.value.slice(0, 80);
  };
  document.getElementById('theme-dark').onclick = () => {
    user.theme = 'dark';
    document.getElementById('theme-dark').classList.add('active');
    document.getElementById('theme-light').classList.remove('active');
  };
  document.getElementById('theme-light').onclick = () => {
    user.theme = 'light';
    document.getElementById('theme-dark').classList.remove('active');
    document.getElementById('theme-light').classList.add('active');
  };
  function applyProfile() {
    avatarDiv.textContent = user.avatar;
    chatNameDiv.textContent = other.name;
    // Side menu
    document.getElementById('side-avatar').textContent = user.avatar;
    document.getElementById('side-name').textContent = user.name;
    document.getElementById('side-about').textContent = user.about||'—';
    // chat list
    document.getElementById('chat-avatar').textContent = other.avatar;
    document.getElementById('chat-title').textContent = other.name;
    document.getElementById('chat-lastmsg').textContent = messages.length ? (messages[messages.length-1].text||'') : '';
    if (user.theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
    saveUser();
  }
  function saveUser() {
    localStorage.setItem('chatUser', JSON.stringify(user));
    applyProfile();
    renderMessages();
  }
  function saveState() {
    localStorage.setItem('chatMsgs', JSON.stringify(messages));
  }
  // ======= Меню (свайп влево) =========
  let startX = 0, dx = 0, swiping = false;
  mainWrap.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX, dx = 0; swiping = false;
  });
  mainWrap.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    dx = e.touches[0].clientX - startX;
    // Свайп вправо — чаты (от левого края)
    if (startX < 30 && dx > 25) { openChatList(); swiping=true; }
    // Свайп влево — меню (от правого края)
    if (startX > window.innerWidth-50 && dx < -25) { openSideMenu(); swiping=true; }
  });
  mainWrap.addEventListener('touchend', ()=>{
    startX = 0; dx = 0; swiping=false;
  });
  function openSideMenu() {
    document.getElementById('side-menu').classList.add('open');
    document.body.style.overflow='hidden';
    setTimeout(()=>{document.addEventListener('click', closeSideMenu, {once:true});}, 18);
  }
  function closeSideMenu() {
    document.getElementById('side-menu').classList.remove('open');
    document.body.style.overflow='';
  }
  function switchTheme() {
    user.theme = user.theme==='dark'?'light':'dark';
    applyProfile();
    closeSideMenu();
  }
  // ======= Чаты (свайп вправо) =========
  function openChatList() {
    document.getElementById('chat-list').classList.add('open');
    document.body.style.overflow='hidden';
    setTimeout(()=>{document.addEventListener('click', hideChatList, {once:true});}, 18);
  }
  function hideChatList() {
    document.getElementById('chat-list').classList.remove('open');
    document.body.style.overflow='';
  }
  // ========== Вызов ===========
  document.getElementById('call-btn').onclick = showCall;
  function showCall() {
    document.getElementById('call-modal').classList.add('active');
    document.getElementById('call-avatar').textContent = other.avatar;
    document.getElementById('call-name').textContent = other.name;
    document.getElementById('call-status').textContent = 'Вызов...';
  }
  document.getElementById('close-call').onclick = () =>
    document.getElementById('call-modal').classList.remove('active');
  document.getElementById('call-end').onclick = () => {
    document.getElementById('call-status').textContent = 'Вызов завершён';
    setTimeout(()=>document.getElementById('call-modal').classList.remove('active'), 700);
  };
  document.getElementById('call-accept').onclick = () => {
    document.getElementById('call-status').textContent = 'Соединение...';
    setTimeout(()=>document.getElementById('call-status').textContent='Звонок завершён', 1200);
    setTimeout(()=>document.getElementById('call-modal').classList.remove('active'), 1600);
  }
  // ========== Старт ==========
  applyProfile();
  renderMessages();
  scrollToBottom();
  setTimeout(() => msgInput.focus(), 200);
</script>
</body>
</html>
