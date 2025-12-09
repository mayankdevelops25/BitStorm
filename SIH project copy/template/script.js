/**
 * - Active category tabs
 * - Accessible mega dropdown with hover-delay + click toggle + keyboard nav
 * - Single dropdowns (experiences + plan) toggles
 * - Defensive checks so it won't throw if elements missing
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------
     1) Highlight active category tab
     --------------------------- */
  (function initTabs() {
    const tabs = document.querySelectorAll('.cat-tab');
    if (!tabs || tabs.length === 0) return;
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  })();


  /* ---------------------------
     2) Mega menu (smooth hover + click + keyboard)
     --------------------------- */
  (function initMegaMenu() {
    const dropdown = document.querySelector('.dropdown-mega');
    if (!dropdown) return;

    const toggle = dropdown.querySelector('.mega-toggle');
    const panel = dropdown.querySelector('.mega-menu');
    if (!toggle || !panel) return;

    // ARIA initial state
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('role', 'menu');
    panel.setAttribute('aria-hidden', 'true');

    let hoverTimer = null;
    const OPEN_DELAY = 120;
    const CLOSE_DELAY = 180;
    let isOpen = false;

    const openPanel = () => {
      if (isOpen) return;
      isOpen = true;
      dropdown.classList.add('open');
      panel.style.display = 'flex';
      panel.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
    };

    const closePanel = () => {
      if (!isOpen) return;
      isOpen = false;
      dropdown.classList.remove('open');
      panel.style.display = 'none';
      panel.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
    };

    // Hover (desktop): give buffer so cursor can move between toggle and panel
    dropdown.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(openPanel, OPEN_DELAY);
    });

    dropdown.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(closePanel, CLOSE_DELAY);
    });

    // Click toggle (works for touch & keyboard)
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(hoverTimer);
      isOpen ? closePanel() : openPanel();
    });

    // Close when clicking outside or pressing Escape
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanel();
    });

    // Keyboard navigation between links in panel (ArrowUp/Down)
    const links = Array.from(panel.querySelectorAll('a[role="menuitem"], a'));
    if (links.length > 0) {
      links.forEach((link, idx) => {
        link.setAttribute('tabindex', '0');
        link.addEventListener('keydown', (ev) => {
          if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            links[(idx + 1) % links.length].focus();
          } else if (ev.key === 'ArrowUp') {
            ev.preventDefault();
            links[(idx - 1 + links.length) % links.length].focus();
          } else if (ev.key === 'Home') {
            ev.preventDefault();
            links[0].focus();
          } else if (ev.key === 'End') {
            ev.preventDefault();
            links[links.length - 1].focus();
          }
        });
      });
    }

    // Ensure panel display matches CSS-driven state when resizing / mobile:
    window.addEventListener('resize', () => {
      // If mobile (narrow) we hide the mega menu; keep it hidden unless explicitly opened
      if (window.innerWidth <= 991 && !dropdown.classList.contains('open')) {
        panel.style.display = 'none';
      }
    });
  })();


  /* ---------------------------
     3) Defensive wired init for "MEGA" block (older code path compatibility)
     --------------------------- */
  (function wireLegacyMega() {
    const mega = document.querySelector('.dropdown-mega');
    if (!mega) return;
    if (mega.dataset.wired) return;
    mega.dataset.wired = 'true';
    // This block simply ensures aria attributes (already handled in initMegaMenu),
    // kept for backward compatibility with older markup.
    const toggle = mega.querySelector('.mega-toggle');
    const panel = mega.querySelector('.mega-menu');
    if (toggle && panel) {
      toggle.setAttribute('aria-haspopup','true');
      toggle.setAttribute('aria-expanded','false');
    }
  })();


  /* ---------------------------
     4) Single dropdowns (experiences + plan) — toggle behavior
     --------------------------- */
  (function initSingleDropdowns() {
    const selectors = ['.dropdown-single', '.dropdown-plan'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(drop => {
        if (!drop || drop.dataset.wired === 'true') return;
        drop.dataset.wired = 'true';

        const toggle = drop.querySelector('.single-toggle');
        const menu = drop.querySelector('.single-menu');
        if (!toggle || !menu) return;

        toggle.setAttribute('aria-haspopup','true');
        toggle.setAttribute('aria-expanded','false');

        const open = () => {
          drop.classList.add('open');
          toggle.setAttribute('aria-expanded','true');
        };
        const close = () => {
          drop.classList.remove('open');
          toggle.setAttribute('aria-expanded','false');
        };

        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          const isOpen = drop.classList.contains('open');
          // close other dropdowns of this type
          document.querySelectorAll(sel + '.open').forEach(d => { if (d !== drop) d.classList.remove('open'); });
          drop.classList.toggle('open', !isOpen);
          toggle.setAttribute('aria-expanded', String(!isOpen));
        });

        // close when clicking outside or pressing Escape
        document.addEventListener('click', (e) => {
          if (!drop.contains(e.target)) { close(); }
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') close();
        });
      });
    });
  })();


  /* ---------------------------
     5) Clean-up: remove any old naive handlers if present (defensive)
     --------------------------- */
  (function removeNaiveHandlers() {
    // Some older code used to attach direct mouseover/mouseleave handlers globally.
    // We cannot remove unknown functions, but ensure there are no duplicate inline style toggles left:
    const naiveDrop = document.querySelector('.dropdown-mega');
    if (!naiveDrop) return;
    // If someone set inline display on the panel earlier, ensure consistent start state:
    const panel = naiveDrop.querySelector('.mega-menu');
    if (panel && !naiveDrop.classList.contains('open')) panel.style.display = 'none';
  })();

}); // DOMContentLoaded end






/* -------------------------------
   Single dropdown (Experiences) — hover buffer + click + keyboard
   ------------------------------- */
(function initSingleDropdown() {
  const drop = document.querySelector('.dropdown-single');
  if (!drop) return;

  const toggle = drop.querySelector('.single-toggle');
  const panel = drop.querySelector('.single-menu');
  if (!toggle || !panel) return;

  // ARIA
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('role', 'menu');

  let timer = null;
  const OPEN_DELAY = 100;
  const CLOSE_DELAY = 160;
  let open = false;

  const openPanel = () => {
    if (open) return;
    open = true;
    drop.classList.add('open');
    panel.style.display = 'block';
    toggle.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
  };
  const closePanel = () => {
    if (!open) return;
    open = false;
    drop.classList.remove('open');
    panel.style.display = 'none';
    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
  };

  // Hover buffer so it doesn't instantly close when moving mouse
  drop.addEventListener('mouseenter', () => {
    clearTimeout(timer);
    timer = setTimeout(openPanel, OPEN_DELAY);
  });
  drop.addEventListener('mouseleave', () => {
    clearTimeout(timer);
    timer = setTimeout(closePanel, CLOSE_DELAY);
  });

  // Click to toggle (useful for touch)
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    open ? closePanel() : openPanel();
  });

  // Close on outside click or Escape
  document.addEventListener('click', (e) => {
    if (!drop.contains(e.target)) closePanel();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  // Keyboard nav inside panel (ArrowUp/Down/Home/End)
  const links = Array.from(panel.querySelectorAll('a'));
  links.forEach((lnk, idx) => {
    lnk.setAttribute('tabindex', '0');
    lnk.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        links[(idx + 1) % links.length].focus();
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        links[(idx - 1 + links.length) % links.length].focus();
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        links[0].focus();
      } else if (ev.key === 'End') {
        ev.preventDefault();
        links[links.length - 1].focus();
      }
    });
  });

  // Ensure hidden on resize for mobile breakpoints
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 991 && !drop.classList.contains('open')) {
      panel.style.display = 'none';
    }
  });

})();

/* -------------------------------
   Plan dropdown — hover buffer + click + keyboard
   ------------------------------- */
(function initPlanDropdown() {
  const drop = document.querySelector('.dropdown-plan');
  if (!drop) return;

  const toggle = drop.querySelector('.plan-toggle');
  const panel = drop.querySelector('.plan-menu');
  if (!toggle || !panel) return;

  // ARIA
  toggle.setAttribute('aria-haspopup','true');
  toggle.setAttribute('aria-expanded','false');
  panel.setAttribute('aria-hidden','true');
  panel.setAttribute('role','menu');

  let timer = null;
  const OPEN_DELAY = 100;
  const CLOSE_DELAY = 160;
  let isOpen = false;

  const openPanel = () => {
    if (isOpen) return;
    isOpen = true;
    drop.classList.add('open');
    panel.style.display = 'block';
    toggle.setAttribute('aria-expanded','true');
    panel.setAttribute('aria-hidden','false');
  };
  const closePanel = () => {
    if (!isOpen) return;
    isOpen = false;
    drop.classList.remove('open');
    panel.style.display = 'none';
    toggle.setAttribute('aria-expanded','false');
    panel.setAttribute('aria-hidden','true');
  };

  // Hover buffer
  drop.addEventListener('mouseenter', () => {
    clearTimeout(timer);
    timer = setTimeout(openPanel, OPEN_DELAY);
  });
  drop.addEventListener('mouseleave', () => {
    clearTimeout(timer);
    timer = setTimeout(closePanel, CLOSE_DELAY);
  });

  // Click toggle (touch/keyboard)
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    isOpen ? closePanel() : openPanel();
  });

  // Close when clicking outside or pressing Escape
  document.addEventListener('click', (e) => {
    if (!drop.contains(e.target)) closePanel();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

  // Keyboard navigation inside panel
  const links = Array.from(panel.querySelectorAll('a'));
  links.forEach((lnk, idx) => {
    lnk.setAttribute('tabindex','0');
    lnk.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); links[(idx + 1) % links.length].focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); links[(idx - 1 + links.length) % links.length].focus(); }
      else if (ev.key === 'Home') { ev.preventDefault(); links[0].focus(); }
      else if (ev.key === 'End') { ev.preventDefault(); links[links.length - 1].focus(); }
    });
  });

  // Keep hidden on resize (mobile)
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 991 && !drop.classList.contains('open')) panel.style.display = 'none';
  });

})();



/* ===== Reasons carousel script ===== */
(function reasonsCarousel() {
  const root = document.getElementById('reasons-explore');
  if (!root) return;

  const track = root.querySelector('.rc-track');
  const slides = Array.from(root.querySelectorAll('.rc-slide'));
  const prevBtn = root.querySelector('.rc-prev');
  const nextBtn = root.querySelector('.rc-next');
  const dots = Array.from(root.querySelectorAll('.rc-dot'));
  if (!track || slides.length === 0) return;

  let idx = 0;
  const SLIDE_COUNT = slides.length;
  const AUTOPLAY_DELAY = 5000;
  let autoplayTimer = null;
  let isHovering = false;
  let startX = null, deltaX = 0;

  const goTo = (n, immediate = false) => {
    idx = (n % SLIDE_COUNT + SLIDE_COUNT) % SLIDE_COUNT;
    const translate = -idx * 100;
    if (immediate) {
      track.style.transition = 'none';
      track.style.transform = `translateX(${translate}%)`;
      // force reflow then restore transition
      void track.offsetWidth;
      track.style.transition = '';
    } else {
      track.style.transform = `translateX(${translate}%)`;
    }
    // indicators
    dots.forEach(d => d.setAttribute('aria-pressed', 'false'));
    if (dots[idx]) dots[idx].setAttribute('aria-pressed', 'true');
  };

  const next = () => goTo(idx + 1);
  const prev = () => goTo(idx - 1);

  nextBtn && nextBtn.addEventListener('click', (e) => { e.preventDefault(); next(); resetAutoplay(); });
  prevBtn && prevBtn.addEventListener('click', (e) => { e.preventDefault(); prev(); resetAutoplay(); });

  dots.forEach(d => d.addEventListener('click', (e) => {
    const to = Number(d.dataset.to);
    goTo(to);
    resetAutoplay();
  }));

  // autoplay
  const startAutoplay = () => {
    clearAutoplay();
    autoplayTimer = setInterval(() => { if (!isHovering) next(); }, AUTOPLAY_DELAY);
  };
  const clearAutoplay = () => { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } };
  const resetAutoplay = () => { clearAutoplay(); startAutoplay(); };

  // pause on hover / focus
  root.addEventListener('mouseenter', () => { isHovering = true; });
  root.addEventListener('mouseleave', () => { isHovering = false; });

  // keyboard
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); resetAutoplay(); }
    if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
  });

  // touch swipe
  const viewport = root.querySelector('.rc-viewport');
  viewport.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    deltaX = 0;
    track.style.transition = 'none';
  }, {passive:true});
  viewport.addEventListener('touchmove', (e) => {
    if (startX === null) return;
    deltaX = e.touches[0].clientX - startX;
    const percent = (deltaX / viewport.offsetWidth) * 100;
    track.style.transform = `translateX(${ -idx * 100 + percent }%)`;
  }, {passive:true});
  viewport.addEventListener('touchend', (e) => {
    track.style.transition = '';
    if (Math.abs(deltaX) > viewport.offsetWidth * 0.18) {
      if (deltaX < 0) next(); else prev();
    } else {
      goTo(idx);
    }
    startX = null; deltaX = 0;
    resetAutoplay();
  });

  // init
  goTo(0, true);
  startAutoplay();

  // ensure hidden track transition is reset if CSS changed
  window.addEventListener('resize', () => goTo(idx, true));
})();





/* Videos player interactions */
(function initVideosSection() {
  const section = document.getElementById('videos-section');
  if (!section) return;

  const list = section.querySelectorAll('.video-item');
  const iframe = document.getElementById('main-video');
  const titleEl = document.getElementById('main-title');

  // helper: build embed url from id
  const embedFor = (id) => `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&enablejsapi=1&autoplay=1`;

  // optional titles for nicer display — read from .meta text if present
  const getMetaTitle = li => {
    const meta = li.querySelector('.meta strong');
    return meta ? meta.textContent.trim() : 'Video';
  };

  const setSelected = (target) => {
    list.forEach(li => {
      li.classList.toggle('selected', li === target);
      li.setAttribute('aria-pressed', String(li === target));
    });
  };

  // click & keyboard
  list.forEach(li => {
    li.addEventListener('click', () => {
      const id = li.dataset.yt;
      if (!id) return;
      iframe.src = embedFor(id);
      titleEl.textContent = getMetaTitle(li);
      setSelected(li);
      // scroll thumbnail into view nicely
      li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        li.click();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = li.nextElementSibling || list[0];
        next && next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = li.previousElementSibling || list[list.length - 1];
        prev && prev.focus();
      }
    });
  });

  // ensure first item is selected on load
  const first = section.querySelector('.video-item');
  if (first) {
    setSelected(first);
    // ensure iframe src matches first item's id if different
    const id = first.dataset.yt;
    if (id && iframe && !iframe.src.includes(id)) {
      iframe.src = embedFor(id);
      titleEl.textContent = getMetaTitle(first);
    }
  }
})();







/* --- Social feeds (grid + pagination + modal embed) --- */
(function initSocialFeeds() {
  const feeds = [
    /* Facebook reels & posts */
    { url: 'https://www.facebook.com/reel/878585827929844/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Reel 1' },
    { url: 'https://www.facebook.com/reel/1804178876918497/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Reel 2' },
    { url: 'https://www.facebook.com/reel/1960616161393717/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Reel 3' },
    { url: 'https://www.facebook.com/100064823136135/posts/1213834797453947/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Post' },
    { url: 'https://www.facebook.com/reel/848957084358859/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Reel 4' },
    { url: 'https://www.facebook.com/100064823136135/posts/1273622611475165/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Post 2' },
    { url: 'https://www.facebook.com/reel/1283660409318708/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Reel 5' },
    { url: 'https://www.facebook.com/reel/1014379690429315/?mibextid=rS40aB7S9Ucbxw6v', platform: 'facebook', caption: 'FB Reel 6' },

    /* Instagram reels */
    { url: 'https://www.instagram.com/reel/DDGiNBVJYux/', platform: 'instagram', caption: 'IG Reel 1' },
    { url: 'https://www.instagram.com/reel/DJ_u6z6pbMR/', platform: 'instagram', caption: 'IG Reel 2' },
    { url: 'https://www.instagram.com/reel/DMCagkHOEL0/', platform: 'instagram', caption: 'IG Reel 3' },
    { url: 'https://www.instagram.com/reel/DCtslLMNYQK/', platform: 'instagram', caption: 'IG Reel 4' },
    { url: 'https://www.instagram.com/reel/C6gPq4FiyWu/', platform: 'instagram', caption: 'IG Reel 5' },
    { url: 'https://www.instagram.com/reel/DL699IiyBAu/', platform: 'instagram', caption: 'IG Reel 6' },
    { url: 'https://www.instagram.com/reel/DL5ELPsSGYa/', platform: 'instagram', caption: 'IG Reel 7' },
    { url: 'https://www.instagram.com/reel/DIaCz0-Tedx/', platform: 'instagram', caption: 'IG Reel 8' },
    { url: 'https://www.instagram.com/reel/DGN2maySDRn/', platform: 'instagram', caption: 'IG Reel 9' },
    { url: 'https://www.instagram.com/reel/DGSqoyqSCVW/', platform: 'instagram', caption: 'IG Reel 10' },
    { url: 'https://www.instagram.com/reel/DPtXf2jEu89/', platform: 'instagram', caption: 'IG Reel 11' },
    { url: 'https://www.instagram.com/reel/Cxeed_YPRZX/', platform: 'instagram', caption: 'IG Reel 12' },
    { url: 'https://www.instagram.com/reel/Cs-0fkVuFpe/', platform: 'instagram', caption: 'IG Reel 13' },
    { url: 'https://www.instagram.com/reel/DHD3JCaTgbS/', platform: 'instagram', caption: 'IG Reel 14' },
    { url: 'https://www.instagram.com/reel/DLkhrGUSXmf/', platform: 'instagram', caption: 'IG Reel 15' },
    { url: 'https://www.instagram.com/reel/CzqD5gvPDh0/', platform: 'instagram', caption: 'IG Reel 16' },
    { url: 'https://www.instagram.com/reel/DPN4mV4kSFZ/', platform: 'instagram', caption: 'IG Reel 17' },
    { url: 'https://www.instagram.com/reel/DCqPFNDo5xh/', platform: 'instagram', caption: 'IG Reel 18' },
    { url: 'https://www.instagram.com/reel/DAA7i15B-nw/', platform: 'instagram', caption: 'IG Reel 19' }
  ];

  const perPage = 9;
  let page = 1;
  const grid = document.getElementById('feedsGrid');
  const pager = document.getElementById('feedsPager');
  const prevBtn = document.getElementById('feedsPrev');
  const nextBtn = document.getElementById('feedsNext');

  if (!grid || !pager || !prevBtn || !nextBtn) return;

  function makeCard(item, idx) {
    // extract a friendly short label/pill
    const pillClass = item.platform === 'instagram' ? 'pill-ig' : 'pill-fb';
    // You can replace data-thumb later with actual thumbnail URLs.
    const thumb = item.thumb || ''; // placeholder: none by default
    const thumbHtml = thumb
      ? `<div class="feed-thumb" style="background-image:url('${thumb}')"></div>`
      : `<div class="feed-thumb placeholder" aria-hidden="true"><div><span style="font-size:20px">${item.platform.toUpperCase()}</span></div></div>`;

    const el = document.createElement('article');
    el.className = 'feed-card';
    el.tabIndex = 0;
    el.innerHTML = `
      ${thumbHtml}
      <div class="feed-meta">
        <div class="platform"><span class="pill ${pillClass}">${item.platform[0].toUpperCase()}</span><span class="pf-name">${item.platform.toUpperCase()}</span></div>
        <div class="time">${/* optional */ ''}</div>
      </div>
      <div class="feed-caption">${escapeHtml(item.caption || item.url)}</div>
    `;
    // store url
    el.dataset.url = item.url;
    el.dataset.platform = item.platform;
    el.dataset.index = idx;
    return el;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function renderPage(n) {
    page = n;
    const start = (page - 1) * perPage;
    const subset = feeds.slice(start, start + perPage);
    grid.innerHTML = '';
    subset.forEach((f, i) => grid.appendChild(makeCard(f, start + i)));

    // attach click handlers
    grid.querySelectorAll('.feed-card').forEach(card => {
      card.addEventListener('click', () => openFeed(card.dataset.url, card.dataset.platform));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); card.click();
        }
      });
    });

    renderPager();
  }

  function renderPager() {
    const totalPages = Math.ceil(feeds.length / perPage) || 1;
    pager.innerHTML = '';

    // show first 3 pages and last page with ellipsis if many pages (keeps it simple)
    const pagesToShow = [];
    if (totalPages <= 7) {
      for (let i=1;i<=totalPages;i++) pagesToShow.push(i);
    } else {
      pagesToShow.push(1,2,3);
      if (page > 4 && page < totalPages-2) {
        // center current
        pagesToShow.push('...');
        pagesToShow.push(page-1, page, page+1);
        pagesToShow.push('...');
      } else {
        pagesToShow.push('...');
      }
      pagesToShow.push(totalPages);
    }

    pagesToShow.forEach(p => {
      const node = document.createElement('div');
      node.className = 'pg-number';
      if (p === '...') { node.textContent = '…'; node.style.cursor = 'default'; node.style.background = 'transparent'; node.style.color = '#666'; node.style.border = 'none'; }
      else {
        node.textContent = p;
        if (p === page) node.classList.add('active');
        node.tabIndex = 0;
        node.addEventListener('click', () => renderPage(p));
        node.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderPage(p); });
      }
      pager.appendChild(node);
    });

    // enable/disable prev/next
    prevBtn.disabled = (page <= 1);
    nextBtn.disabled = (page >= Math.ceil(feeds.length / perPage));
  }

  prevBtn.addEventListener('click', () => { if (page > 1) renderPage(page - 1); });
  nextBtn.addEventListener('click', () => { if (page < Math.ceil(feeds.length / perPage)) renderPage(page + 1); });

  // modal open (tries embed then fallback)
  const modal = document.getElementById('feedModal');
  const modalIframe = document.getElementById('feedEmbed');
  const openOriginal = document.getElementById('openOriginal');

  function openFeed(url, platform) {
    // build embed src
    let embedSrc = '';
    if (platform === 'instagram') {
      // instagram supports /embed URL — some browsers/sites may block iframe; fallback will open original.
      // remove trailing params/ ? parts for embed
      const path = url.split('?')[0].replace(/\/+$/, '');
      embedSrc = path + (path.endsWith('/') ? 'embed/' : '/embed/');
    } else if (platform === 'facebook') {
      // facebook video plugin requires encoded href param
      embedSrc = 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url) + '&show_text=0';
    } else {
      embedSrc = url;
    }

    // show modal and set iframe src
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    modalIframe.src = embedSrc;
    openOriginal.href = url;
    // If embed blocked (X-Frame), user can click Open on platform — we also attach a short timeout to detect blocked case:
    // try to detect failure to load: if iframe doesn't fire load in 4s, leave it (user can click openOriginal)
    let loaded = false;
    const onLoad = () => { loaded = true; modalIframe.removeEventListener('load', onLoad); };
    modalIframe.addEventListener('load', onLoad);
    setTimeout(() => {
      if (!loaded) {
        // leave iframe as-is; user can click Open on platform. Optionally show small notice (not implemented to keep UI clean).
      }
    }, 3500);

    // focus modal for keyboard users
    modal.querySelector('.fm-close').focus();
  }

  // close handlers
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModal));
  document.querySelector('.fm-close').addEventListener('click', closeModal);
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    // unload iframe to stop media
    modalIframe.src = '';
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('show')) closeModal(); });

  // initial render
  renderPage(1);
})();






/* HERO below section */
/* EXPERIENCE STACK: "come closer" compact interaction */
(function experienceStackCompact() {
  const root = document.getElementById('experience-stack');
  if (!root) return;
  const stack = root.querySelector('.es-stack');
  if (!stack) return;

  let compactTimeout = null;

  // add compact class on pointer enter (desktop)
  stack.addEventListener('pointerenter', () => {
    clearTimeout(compactTimeout);
    stack.classList.add('compact');
  });
  // remove after small delay when leaving for smoothness
  stack.addEventListener('pointerleave', () => {
    clearTimeout(compactTimeout);
    compactTimeout = setTimeout(() => stack.classList.remove('compact'), 220);
  });

  // keyboard: focus inside stack toggles compact state
  stack.addEventListener('focusin', () => stack.classList.add('compact'));
  stack.addEventListener('focusout', () => stack.classList.remove('compact'));

  // mobile: a tap toggles the compact state briefly (so touch users see effect)
  stack.addEventListener('click', (e) => {
    // ignore clicks on interactive inner controls (if any)
    if (e.target.closest('.es-widget')) return;
    stack.classList.add('compact');
    clearTimeout(compactTimeout);
    compactTimeout = setTimeout(() => stack.classList.remove('compact'), 1200);
  });

  // optional: if you'd like to pause the bg video when compact is active uncomment below
  // const bgIframe = root.querySelector('.es-bg iframe');
  // function postCmd(cmd) { if (!bgIframe || !bgIframe.contentWindow) return; bgIframe.contentWindow.postMessage(cmd, '*'); }
  // stack.addEventListener('pointerenter', () => postCmd('{"event":"command","func":"pauseVideo","args":""}'));
  // stack.addEventListener('pointerleave', () => postCmd('{"event":"command","func":"playVideo","args":""}'));
})();




