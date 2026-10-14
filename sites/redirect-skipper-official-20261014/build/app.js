const grid = document.querySelector('#site-grid');
const search = document.querySelector('#site-search');
const expand = document.querySelector('#show-sites');
const count = document.querySelector('#site-count');
const empty = document.querySelector('#empty-state');
let sites = [];
let filter = 'all';
let expanded = false;

const community = new Set(['知乎', '少数派', 'CSDN', '简书', '爱发电', '微博', 'YouTube', '豆瓣', '机核', '百度贴吧', '百度贴吧(安全检查)', '花瓣', '紫忆论坛']);
const developer = new Set(['掘金', 'Gitee', '阿里云', 'InfoQ(写作社区)', 'InfoQ', 'OSChina', '腾讯云', '51CTO', 'HackV']);
const colors = ['#3478ef', '#df754a', '#7e82b9', '#50a391', '#ae849c', '#66869d'];
const marks = { '知乎': '知', '掘金': '◈', 'CSDN': 'C', '少数派': '◉', '简书': '简', 'Gitee': 'g', '爱发电': '爱', '微博': '微', 'YouTube': '▶', '语雀': '语', '阿里云': '云', '豆瓣': '豆', '腾讯文档': '文', '腾讯云': '云', '金山文档': 'W' };

function renderSites() {
  const query = search.value.trim().toLowerCase();
  const matched = sites.filter(site => {
    const category = community.has(site.title) ? 'community' : developer.has(site.title) ? 'developer' : 'other';
    return (filter === 'all' || filter === category) && (site.title.toLowerCase().includes(query) || site.hostname.toLowerCase().includes(query));
  });
  const visible = expanded ? matched : matched.slice(0, 8);
  grid.replaceChildren();
  for (const site of visible) {
    const card = document.createElement('div');
    card.className = 'site-card';
    const icon = document.createElement('span');
    icon.className = 'site-icon';
    icon.setAttribute('aria-hidden', 'true');
    const color = colors[sites.indexOf(site) % colors.length];
    icon.style.setProperty('--icon-color', color);
    icon.style.setProperty('--icon-bg', `${color}0d`);
    icon.textContent = marks[site.title] || site.title.slice(0, 1);
    const text = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = site.title;
    const host = document.createElement('small');
    host.textContent = site.hostname;
    text.append(title, host);
    const check = document.createElement('span');
    check.className = 'site-tick';
    check.textContent = '✓';
    check.setAttribute('aria-hidden', 'true');
    card.append(icon, text, check);
    grid.append(card);
  }
  empty.hidden = matched.length !== 0;
  count.textContent = `显示 ${visible.length} / ${matched.length} 条规则 · 本地站点库`;
  expand.hidden = matched.length <= 8;
  expand.textContent = expanded ? '收起站点 ↑' : `展开全部 ${matched.length} 条规则 ↓`;
  expand.setAttribute('aria-expanded', String(expanded));
}

for (const button of document.querySelectorAll('.filter')) {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    expanded = false;
    for (const item of document.querySelectorAll('.filter')) {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    }
    renderSites();
  });
}
search.addEventListener('input', renderSites);
expand.addEventListener('click', () => {
  expanded = !expanded;
  renderSites();
});

fetch('assets/sites.json').then(response => {
  if (!response.ok) throw new Error('Site collection unavailable');
  return response.json();
}).then(data => {
  sites = data;
  document.querySelector('#site-total').textContent = String(sites.length);
  renderSites();
}).catch(() => {
  count.textContent = '站点库暂时未能加载，请刷新后重试。';
  expand.hidden = true;
});

const demoSwitch = document.querySelector('#demo-switch');
demoSwitch.addEventListener('click', () => {
  const enabled = demoSwitch.getAttribute('aria-checked') !== 'true';
  demoSwitch.setAttribute('aria-checked', String(enabled));
  document.querySelector('.demo-canvas').dataset.enabled = String(enabled);
  document.querySelector('#switch-label').textContent = enabled ? '已开启' : '已关闭';
  document.querySelector('#demo-address').textContent = enabled ? 'github.com' : 'link.zhihu.com/?target=…';
  document.querySelector('#demo-headline').textContent = enabled ? '链接，直接打开。' : '还需要一次「继续访问」。';
  document.querySelector('#demo-badge').textContent = enabled ? '已跳过' : '等待确认';
  document.querySelector('#middle-note').textContent = enabled ? '这一步，交给我们' : '需要手动继续访问';
  document.querySelector('#route-label').textContent = enabled ? 'SKIP THE EXTRA STEP' : 'ONE MORE CLICK';
});
