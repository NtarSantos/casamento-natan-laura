const PB_URL = 'https://projetotest-pocketbase.zpj4h1.easypanel.host';
let eventDate = new Date('2027-03-21T16:00:00-03:00');
let pixKey = '';
const $ = selector => document.querySelector(selector);
function updateCountdown() {
  const total = Math.max(0, Math.floor((eventDate.getTime() - Date.now()) / 1000));
  const values = { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60 };
  Object.entries(values).forEach(([id, value]) => { document.getElementById(id).textContent = String(value).padStart(2, '0'); });
}
updateCountdown(); setInterval(updateCountdown, 1000);
const menu = $('.menu-toggle');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); $('#main-nav').classList.remove('open'); }
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); $('#main-nav').classList.toggle('open', open); });
$('#main-nav').addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) document.querySelectorAll('#main-nav a').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id)); }); }, { rootMargin: '-10% 0px -65% 0px' });
document.querySelectorAll('main>section[id]').forEach(section => observer.observe(section));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
});
document.querySelectorAll('.gallery-photo').forEach(button => button.addEventListener('click', () => {
  const source = button.querySelector('img'), dialog = $('#photo-dialog');
  dialog.querySelector('img').src = source.src.replace('w=700', 'w=1400'); dialog.querySelector('img').alt = source.alt;
  dialog.querySelector('p').textContent = button.querySelector('span').textContent; dialog.showModal();
}));
$('#gift-button').addEventListener('click', () => $('#gift-dialog').showModal());
$('#copy-pix').addEventListener('click', async () => { try { await navigator.clipboard.writeText(pixKey); $('#gift-status').textContent = 'Chave copiada!'; } catch { $('#gift-status').textContent = 'Copie a chave acima para usar no aplicativo do seu banco.'; } });
const form = $('#rsvp-form');
function updateCompanions() {
  const attending = form.elements.vai.value === 'sim', count = form.elements.acomp;
  count.disabled = !attending; $('.companions-field').hidden = !attending || Number(count.value) === 0;
  form.elements.nomes_acomp.required = attending && Number(count.value) > 0;
}
form.addEventListener('change', updateCompanions); form.elements.acomp.addEventListener('input', updateCompanions);
form.addEventListener('submit', async e => {
  e.preventDefault();
  const status = form.querySelector('.form-status'), button = form.querySelector('[type="submit"]'), data = new FormData(form), nome = String(data.get('nome')).trim();
  if (!nome) { form.elements.nome.focus(); status.textContent = 'Preencha seu nome para continuar.'; return; }
  const vai = data.get('vai') === 'sim';
  button.disabled = true; status.className = 'form-status'; status.textContent = 'Enviando sua resposta…';
  try {
    const response = await fetch(PB_URL + '/api/collections/rsvps/records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ nome, vai, acomp: vai ? Number(data.get('acomp') || 0) : 0, nomes_acomp: vai ? String(data.get('nomes_acomp') || '').trim() : '', restricao: String(data.get('restricao') || '').trim(), recado: String(data.get('recado') || '').trim() }) });
    if (!response.ok) throw new Error('Falha ao salvar');
    status.textContent = vai ? 'Presença confirmada! Vai ser lindo ter você com a gente. ♡' : 'Resposta recebida. Obrigado por nos avisar com carinho.';
    status.classList.add('success'); form.reset(); updateCompanions();
  } catch { status.textContent = 'Não conseguimos salvar sua resposta agora. Seus dados continuam aqui; tente novamente em alguns instantes.'; }
  finally { button.disabled = false; }
});
async function loadConfig() {
  try {
    const response = await fetch(PB_URL + '/api/collections/site_config/records?perPage=1', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return;
    const config = (await response.json()).items?.[0]; if (!config) return;
    document.querySelectorAll('[data-text]').forEach(node => { if (typeof config[node.dataset.text] === 'string' && config[node.dataset.text].trim()) node.textContent = config[node.dataset.text]; });
    document.querySelectorAll('[data-map]').forEach(node => { try { const url = new URL(config[node.dataset.map]); if (url.protocol === 'https:') node.href = url.href; } catch {} });
    if (config.data_evento && Number.isFinite(new Date(config.data_evento).getTime())) { eventDate = new Date(config.data_evento); updateCountdown(); }
    if (config.mostrar_contagem === false) $('#contagem').hidden = true;
    if (config.pix_chave) { pixKey = config.pix_chave; $('#gift-description').textContent = 'Para participar do nosso novo começo, nossa chave PIX é: ' + pixKey; $('#copy-pix').hidden = false; }
  } catch { /* O conteúdo local permanece disponível se o serviço estiver fora do ar. */ }
}
loadConfig();
