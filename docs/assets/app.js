/* ── DroneLens Docs — Shared JS ──────────────────────────────────────────── */

/* Mark active sidebar link based on current page */
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === page) a.classList.add('active');
  });
})();

/* Toggle endpoint bodies */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.endpoint-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const body = hdr.nextElementSibling;
      if (!body) return;
      body.classList.toggle('open');
      const arrow = hdr.querySelector('.ep-arrow');
      if (arrow) arrow.style.transform = body.classList.contains('open') ? 'rotate(90deg)' : '';
    });
  });

  /* Copy buttons on pre blocks */
  document.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.style.cssText = `
      position:absolute; top:.5rem; right:${pre.querySelector('.pre-label') ? '5rem' : '.75rem'};
      background:rgba(0,212,255,.12); border:1px solid rgba(0,212,255,.25);
      color:#00d4ff; font-size:.68rem; padding:.2rem .5rem; border-radius:4px;
      cursor:pointer; font-family:inherit; letter-spacing:.04em;
      transition:background .15s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(0,212,255,.22)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(0,212,255,.12)');
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent);
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    });
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
});
