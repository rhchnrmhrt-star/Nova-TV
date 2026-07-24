(() => {
  'use strict';

  const API = window.NovaAPI;
  const root = document.getElementById('app');
  if (!API || !root) return;

  let hls = null;
  const deviceId = localStorage.getItem('novaDeviceId') || (() => {
    const id = `NV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    localStorage.setItem('novaDeviceId', id);
    return id;
  })();

  const store = {
    view: 'home',
    query: '',
    category: 'الكل',
    quality: 'الكل',
    theme: localStorage.getItem('novaUltimateTheme') || 'dark',
    autoplay: localStorage.getItem('novaUltimateAutoplay') !== '0',
    backup: localStorage.getItem('novaUltimateBackup') !== '0',
    favorites: JSON.parse(localStorage.getItem('novaUltimateFavorites') || '[]').map(String),
    history: JSON.parse(localStorage.getItem('novaUltimateHistory') || '[]').map(String),
    activation: JSON.parse(localStorage.getItem('novaActivation') || 'null')
  };

  const esc = (value = '') => String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[ch]);
  const idOf = channel => String(channel?.id ?? '');
  const allChannels = () => API.getChannels({ includeDisabled: false }) || [];
  const save = () => {
    localStorage.setItem('novaUltimateTheme', store.theme);
    localStorage.setItem('novaUltimateAutoplay', store.autoplay ? '1' : '0');
    localStorage.setItem('novaUltimateBackup', store.backup ? '1' : '0');
    localStorage.setItem('novaUltimateFavorites', JSON.stringify(store.favorites));
    localStorage.setItem('novaUltimateHistory', JSON.stringify(store.history));
    if (store.activation) localStorage.setItem('novaActivation', JSON.stringify(store.activation));
  };

  function normalizeCategory(channel) {
    const text = `${channel.category || ''} ${channel.name || ''}`.toLowerCase();
    if (/sport|رياض|football|soccer/.test(text)) return 'الرياضية';
    if (/news|أخبار|اخبار/.test(text)) return 'الأخبار';
    if (/kid|child|أطفال|اطفال|عائلي|family/.test(text)) return 'الأطفال';
    if (/movie|film|cinema|أفلام|افلام/.test(text)) return 'الأفلام';
    if (/document|وثائ/.test(text)) return 'الوثائقية';
    if (/music|موسيق/.test(text)) return 'الموسيقى';
    if (/econom|business|اقتصاد/.test(text)) return 'الاقتصاد';
    return 'الترفيه';
  }

  function iconFor(channel) {
    const cat = normalizeCategory(channel);
    return ({
      'الرياضية': '⚽', 'الأخبار': '▤', 'الأطفال': '☺', 'الأفلام': '▣',
      'الوثائقية': '◎', 'الموسيقى': '♫', 'الاقتصاد': '▥', 'الترفيه': '★'
    })[cat] || '▶';
  }

  function accentFor(channel) {
    const cat = normalizeCategory(channel);
    return ({
      'الرياضية': '#2469e8', 'الأخبار': '#d62f3a', 'الأطفال': '#2ba66d',
      'الأفلام': '#e06b18', 'الوثائقية': '#159888', 'الموسيقى': '#8b35df',
      'الاقتصاد': '#3c65c9', 'الترفيه': '#7736d9'
    })[cat] || '#7139db';
  }

  function validActivation() {
    return Boolean(store.activation?.code && API.validateActivation(store.activation.code).ok);
  }

  function toast(message) {
    let el = document.getElementById('ultimateToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ultimateToast';
      el.className = 'ultimate-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el.timer);
    el.timer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function renderActivation() {
    root.innerHTML = `
      <main class="ultimate-activation ${store.theme}">
        <section class="ultimate-activation-card">
          <div class="ultimate-logo-badge">N</div>
          <div class="ultimate-brand large">Nova <b>TV</b></div>
          <h1>مرحبًا بك في Nova TV</h1>
          <p>أدخل كود التفعيل لفتح النسخة الاحترافية.</p>
          <input id="ultimateCode" value="NOVA-2026" autocomplete="off" aria-label="كود التفعيل">
          <button class="ultimate-primary" onclick="NovaUltimate.activate()">تفعيل الجهاز</button>
          <div id="ultimateActivationError" class="ultimate-error"></div>
          <small>معرّف الجهاز: ${esc(deviceId)}</small>
        </section>
      </main>`;
    setTimeout(() => document.getElementById('ultimateCode')?.focus(), 50);
  }

  function activate() {
    const input = document.getElementById('ultimateCode');
    const error = document.getElementById('ultimateActivationError');
    const result = API.claimDevice(String(input?.value || '').trim().toUpperCase(), deviceId);
    if (!result.ok) {
      error.textContent = ({
        invalid: 'كود التفعيل غير صحيح.', disabled: 'هذا الكود متوقف.',
        expired: 'انتهت صلاحية الكود.', device_limit: 'تم بلوغ الحد الأقصى للأجهزة.'
      })[result.error] || 'تعذر تفعيل الجهاز.';
      return;
    }
    store.activation = { code: result.item.code, expiresAt: result.item.expiresAt, deviceId };
    save();
    render('home');
  }

  function navigation(active) {
    const items = [
      ['home', '⌂', 'الرئيسية'], ['channels', '▣', 'القنوات'], ['favorites', '♡', 'المفضلة'],
      ['history', '↶', 'سجل المشاهدة'], ['account', '♙', 'الحساب والإعدادات']
    ];
    return `
      <header class="ultimate-topbar">
        <button class="ultimate-brand-button" onclick="NovaUltimate.render('home')"><span class="ultimate-brand">Nova <b>TV</b></span></button>
        <nav class="ultimate-topnav">
          ${items.map(([key,,label]) => `<button class="${active === key ? 'active' : ''}" onclick="NovaUltimate.render('${key}')">${label}</button>`).join('')}
        </nav>
        <button class="ultimate-search-icon" onclick="NovaUltimate.render('channels',true)" aria-label="بحث">⌕</button>
      </header>
      <aside class="ultimate-sidebar">
        ${items.map(([key,icon,label]) => `<button title="${label}" class="${active === key ? 'active' : ''}" onclick="NovaUltimate.render('${key}')"><span>${icon}</span></button>`).join('')}
        <button title="الإعدادات" class="${active === 'account' ? 'active' : ''}" onclick="NovaUltimate.render('account')"><span>⚙</span></button>
      </aside>
      <nav class="ultimate-mobile-nav">
        ${items.slice(0, 4).map(([key,icon,label]) => `<button class="${active === key ? 'active' : ''}" onclick="NovaUltimate.render('${key}')"><span>${icon}</span><small>${label}</small></button>`).join('')}
      </nav>`;
  }

  function shell(active, content) {
    root.innerHTML = `<div class="ultimate-app ${store.theme}">${navigation(active)}<main class="ultimate-main">${content}</main></div>`;
    wireRemote();
  }

  function logo(channel, compact = false) {
    if (channel.logoUrl) {
      return `<img class="ultimate-channel-logo ${compact ? 'compact' : ''}" src="${esc(channel.logoUrl)}" alt="${esc(channel.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="ultimate-fallback-logo" style="display:none;--accent:${accentFor(channel)}">${iconFor(channel)}</span>`;
    }
    return `<span class="ultimate-fallback-logo" style="--accent:${accentFor(channel)}">${iconFor(channel)}</span>`;
  }

  function favoriteButton(channel) {
    const saved = store.favorites.includes(idOf(channel));
    return `<button class="ultimate-heart ${saved ? 'saved' : ''}" onclick="event.stopPropagation();NovaUltimate.toggleFavorite('${esc(idOf(channel))}')">${saved ? '♥' : '♡'}</button>`;
  }

  function featuredCard(channel) {
    return `<article class="ultimate-feature-card" onclick="NovaUltimate.openPlayer('${esc(idOf(channel))}')">
      <div class="ultimate-feature-art" style="--accent:${accentFor(channel)}">${logo(channel)}</div>
      <span class="ultimate-live-label">مباشر</span>
      <strong>${esc(channel.name)}</strong>
    </article>`;
  }

  function listCard(channel) {
    return `<article class="ultimate-list-card" tabindex="0" onclick="NovaUltimate.openPlayer('${esc(idOf(channel))}')">
      <div class="ultimate-list-logo" style="--accent:${accentFor(channel)}">${logo(channel, true)}</div>
      <div class="ultimate-list-copy"><strong>${esc(channel.name)}</strong><span>${normalizeCategory(channel)}</span><small>مباشر</small></div>
      ${favoriteButton(channel)}
    </article>`;
  }

  function heroChannel(channels) {
    return channels.find(c => normalizeCategory(c) === 'الرياضية') || channels.find(c => c.featured) || channels[0];
  }

  function homePage() {
    const channels = allChannels();
    const hero = heroChannel(channels);
    const featured = channels.slice(0, 5);
    if (!hero) return emptyLoading();
    return `
      <section class="ultimate-hero">
        <div class="ultimate-hero-overlay"></div>
        <div class="ultimate-hero-copy">
          <span class="ultimate-live-label">مباشر</span>
          <h1>${esc(hero.name)}</h1>
          <strong>مباشر الآن</strong>
          <p>${esc(hero.description || 'بث مباشر بجودة واضحة وتجربة مشاهدة سريعة.')}</p>
          <button class="ultimate-primary" onclick="NovaUltimate.openPlayer('${esc(idOf(hero))}')">▶ شاهد الآن</button>
        </div>
        <div class="ultimate-stadium-ball">⚽</div>
        <div class="ultimate-dots"><i></i><i></i><i class="active"></i><i></i></div>
      </section>
      <section class="ultimate-section">
        <div class="ultimate-section-title"><h2>قنوات مميزة</h2><button onclick="NovaUltimate.render('channels')">عرض الكل</button></div>
        <div class="ultimate-feature-grid">${featured.map(featuredCard).join('')}</div>
      </section>
      <section class="ultimate-quick-grid">
        <button onclick="NovaUltimate.render('channels',true)"><span>⌕</span><b>بحث سريع</b><small>ابحث عن قناة</small></button>
        <button onclick="NovaUltimate.render('history')"><span>◷</span><b>سجل المشاهدة</b><small>تابع المشاهدة</small></button>
        <button onclick="NovaUltimate.render('favorites')"><span>♡</span><b>المفضلة</b><small>${store.favorites.length} قناة محفوظة</small></button>
      </section>`;
  }

  function channelFilters(channels) {
    const fixed = ['الكل', 'الأطفال', 'الترفيه', 'الأخبار', 'الرياضية'];
    return `<div class="ultimate-filter-row">
      <div class="ultimate-tabs">${fixed.map(cat => `<button class="${store.category === cat ? 'active' : ''}" onclick="NovaUltimate.setCategory('${cat}')">${cat === 'الكل' ? 'كل القنوات' : cat}</button>`).join('')}</div>
      <button class="ultimate-quality" onclick="NovaUltimate.toggleQuality()">☷ الجودة: ${store.quality}</button>
    </div>`;
  }

  function filteredChannels() {
    const query = store.query.trim().toLowerCase();
    return allChannels().filter(channel => {
      const categoryOk = store.category === 'الكل' || normalizeCategory(channel) === store.category;
      const queryOk = !query || `${channel.name} ${channel.category || ''} ${channel.country || ''}`.toLowerCase().includes(query);
      return categoryOk && queryOk;
    });
  }

  function channelsPage(focus = false) {
    const channels = filteredChannels();
    setTimeout(() => focus && document.getElementById('ultimateSearch')?.focus(), 80);
    return `
      <section class="ultimate-page-head"><h1>القنوات</h1></section>
      <div class="ultimate-search-box"><span>⌕</span><input id="ultimateSearch" value="${esc(store.query)}" placeholder="ابحث عن قناة" oninput="NovaUltimate.search(this.value)"></div>
      ${channelFilters(channels)}
      <div class="ultimate-count">${channels.length} قناة متاحة</div>
      <section class="ultimate-list-grid">${channels.length ? channels.slice(0, 120).map(listCard).join('') : '<div class="ultimate-empty">لا توجد نتائج مطابقة.</div>'}</section>`;
  }

  function collectionPage(title, ids, emptyText) {
    const map = new Map(allChannels().map(c => [idOf(c), c]));
    const channels = ids.map(id => map.get(String(id))).filter(Boolean);
    return `<section class="ultimate-page-head"><h1>${title}</h1></section>
      <section class="ultimate-list-grid">${channels.length ? channels.map(listCard).join('') : `<div class="ultimate-empty">${emptyText}</div>`}</section>`;
  }

  function accountPage() {
    const count = allChannels().length;
    return `<section class="ultimate-page-head"><h1>الحساب والإعدادات</h1></section>
      <div class="ultimate-settings-grid">
        <section class="ultimate-profile-panel">
          <div class="ultimate-profile-card"><div class="ultimate-avatar">●</div><div><small>مرحبًا بك</small><h2>مستخدم Nova</h2><span>nova.user@example.com</span></div></div>
          <button>إدارة الحساب</button>
          <div class="ultimate-protection"><span>🛡</span><div><b>الخادم المحمي</b><small>نشط · اتصال آمن ومستقر</small></div><i>›</i></div>
          <button class="ultimate-logout" onclick="NovaUltimate.logout()">تسجيل الخروج ↪</button>
        </section>
        <section class="ultimate-settings-panel">
          <div class="ultimate-theme-row"><b>السمة ◉</b><div><button class="${store.theme === 'dark' ? 'active' : ''}" onclick="NovaUltimate.setTheme('dark')">داكن</button><button class="${store.theme === 'light' ? 'active' : ''}" onclick="NovaUltimate.setTheme('light')">فاتح</button><button onclick="NovaUltimate.setTheme('dark')">الجهاز</button></div></div>
          ${toggleRow('التشغيل التلقائي', 'autoplay', store.autoplay)}
          ${toggleRow('البث الاحتياطي', 'backup', store.backup)}
          <button class="ultimate-setting-row" onclick="NovaUltimate.cyclePreferredQuality()"><span><b>الجودة المفضلة</b><small>عدد القنوات المتاحة: ${count}</small></span><strong>${localStorage.getItem('novaPreferredQuality') || 'HD 1080p'}⌄</strong></button>
          <button class="ultimate-setting-row" onclick="NovaUltimate.resetSettings()"><span><b>إعادة ضبط الإعدادات</b><small>استعادة الخيارات الافتراضية</small></span><strong>↻</strong></button>
        </section>
      </div>`;
  }

  function toggleRow(label, key, enabled) {
    return `<button class="ultimate-setting-row" onclick="NovaUltimate.toggleSetting('${key}')"><span><b>${label}</b></span><i class="ultimate-switch ${enabled ? 'on' : ''}"><u></u></i></button>`;
  }

  function emptyLoading() {
    return `<div class="ultimate-empty"><strong>جارٍ تحميل القنوات العامة…</strong><small>ستظهر القنوات تلقائيًا بعد اكتمال المزامنة.</small><button class="ultimate-primary" onclick="NovaUltimate.refreshChannels()">تحديث الآن</button></div>`;
  }

  function render(view = 'home', focus = false) {
    if (!validActivation()) {
      store.activation = null;
      localStorage.removeItem('novaActivation');
      renderActivation();
      return;
    }
    store.view = view;
    let content = '';
    if (view === 'home') content = homePage();
    else if (view === 'channels') content = channelsPage(focus);
    else if (view === 'favorites') content = collectionPage('المفضلة', store.favorites, 'لم تضف أي قناة إلى المفضلة بعد.');
    else if (view === 'history') content = collectionPage('سجل المشاهدة', store.history, 'لم تشاهد أي قناة بعد.');
    else content = accountPage();
    shell(view, content);
  }

  function search(value) {
    store.query = value;
    const cards = filteredChannels();
    const grid = document.querySelector('.ultimate-list-grid');
    const count = document.querySelector('.ultimate-count');
    if (grid) grid.innerHTML = cards.length ? cards.slice(0, 120).map(listCard).join('') : '<div class="ultimate-empty">لا توجد نتائج مطابقة.</div>';
    if (count) count.textContent = `${cards.length} قناة متاحة`;
  }

  function setCategory(category) {
    store.category = category;
    render('channels');
  }

  function toggleQuality() {
    store.quality = store.quality === 'الكل' ? 'HD' : store.quality === 'HD' ? 'SD' : 'الكل';
    render('channels');
  }

  function toggleFavorite(id) {
    const key = String(id);
    store.favorites = store.favorites.includes(key) ? store.favorites.filter(x => x !== key) : [key, ...store.favorites];
    save();
    toast(store.favorites.includes(key) ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة');
    render(store.view);
  }

  function openPlayer(id) {
    const channel = allChannels().find(c => idOf(c) === String(id));
    if (!channel) return;
    store.history = [String(id), ...store.history.filter(x => x !== String(id))].slice(0, 40);
    save();
    root.innerHTML = `<div class="ultimate-player-page ${store.theme}">
      <header class="ultimate-player-head"><button onclick="NovaUltimate.render('channels')">←</button><h1>${esc(channel.name)}</h1><span class="ultimate-live-label">مباشر</span><button onclick="NovaUltimate.toggleFavorite('${esc(idOf(channel))}')">${store.favorites.includes(idOf(channel)) ? '♥' : '♡'}</button></header>
      <main class="ultimate-player-stage">
        <video id="ultimateVideo" controls playsinline ${store.autoplay ? 'autoplay' : ''}></video>
        <div class="ultimate-player-placeholder"><span>${iconFor(channel)}</span><small>جارٍ تشغيل البث…</small></div>
        <div id="ultimatePlayerError" class="ultimate-player-error"></div>
      </main>
      <footer class="ultimate-player-controls"><span>● بث احتياطي ${store.backup ? '1' : 'متوقف'}</span><b>● مباشر</b><button onclick="NovaUltimate.fullscreen()">⛶</button></footer>
    </div>`;
    startStream(channel);
  }

  function startStream(channel) {
    const video = document.getElementById('ultimateVideo');
    const placeholder = document.querySelector('.ultimate-player-placeholder');
    const error = document.getElementById('ultimatePlayerError');
    if (!video) return;
    if (hls) { hls.destroy(); hls = null; }
    const showVideo = () => placeholder?.classList.add('hidden');
    video.addEventListener('playing', showVideo, { once: true });
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.play().catch(() => {});
    } else if (window.Hls?.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => store.autoplay && video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal && error) error.innerHTML = '<b>تعذر تشغيل هذا المصدر.</b><button onclick="NovaUltimate.render(\'channels\')">اختيار قناة أخرى</button>';
      });
    } else {
      video.src = channel.url;
    }
  }

  function fullscreen() {
    const stage = document.querySelector('.ultimate-player-stage');
    if (!document.fullscreenElement) stage?.requestFullscreen?.(); else document.exitFullscreen?.();
  }

  function toggleSetting(key) {
    if (key === 'autoplay') store.autoplay = !store.autoplay;
    if (key === 'backup') store.backup = !store.backup;
    save();
    render('account');
  }

  function setTheme(theme) {
    store.theme = theme;
    save();
    render('account');
  }

  function cyclePreferredQuality() {
    const current = localStorage.getItem('novaPreferredQuality') || 'HD 1080p';
    const values = ['HD 1080p', 'HD 720p', 'تلقائي'];
    localStorage.setItem('novaPreferredQuality', values[(values.indexOf(current) + 1) % values.length]);
    render('account');
  }

  function resetSettings() {
    store.autoplay = true;
    store.backup = true;
    store.theme = 'dark';
    localStorage.setItem('novaPreferredQuality', 'HD 1080p');
    save();
    toast('تمت إعادة ضبط الإعدادات');
    render('account');
  }

  async function refreshChannels() {
    toast('جارٍ تحديث مصادر القنوات…');
    try {
      const result = await API.refreshPublicChannels(true);
      toast(result?.ok ? `تم تحميل ${result.count || allChannels().length} قناة` : 'تعذر تحميل المصادر الآن');
      render(store.view);
    } catch {
      toast('تعذر تحديث القنوات');
    }
  }

  function logout() {
    if (store.activation?.code) API.releaseDevice(store.activation.code, deviceId);
    store.activation = null;
    localStorage.removeItem('novaActivation');
    renderActivation();
  }

  function wireRemote() {
    const selectors = 'button,input,[tabindex="0"]';
    const items = [...document.querySelectorAll(selectors)].filter(el => el.offsetParent !== null);
    document.onkeydown = event => {
      if (event.key === 'Escape') { render('home'); return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const current = document.activeElement;
      const rect = current?.getBoundingClientRect?.();
      if (!rect) { items[0]?.focus(); return; }
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const candidates = items.filter(el => el !== current).map(el => {
        const r = el.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
        const valid = event.key === 'ArrowLeft' ? dx < 0 : event.key === 'ArrowRight' ? dx > 0 : event.key === 'ArrowUp' ? dy < 0 : dy > 0;
        return valid ? { el, score: Math.abs(dx) + Math.abs(dy) + (event.key.includes('Left') || event.key.includes('Right') ? Math.abs(dy) : Math.abs(dx)) } : null;
      }).filter(Boolean).sort((a, b) => a.score - b.score);
      candidates[0]?.el.focus();
      candidates[0]?.el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      event.preventDefault();
    };
  }

  window.NovaUltimate = Object.freeze({
    activate, render, search, setCategory, toggleQuality, toggleFavorite, openPlayer,
    fullscreen, toggleSetting, setTheme, cyclePreferredQuality, resetSettings,
    refreshChannels, logout
  });

  window.addEventListener('nova:channels-updated', () => render(store.view));
  validActivation() ? render('home') : renderActivation();
})();