(function(){
const nav=document.createElement('nav');nav.className='studio-nav';nav.setAttribute('aria-label','主要页面');nav.innerHTML='<a class="active" href="materials.html">创意素材台</a><a href="index.html#drafts">我的创作</a><a href="index.html#library">资料库</a>';
document.querySelector('.top .top-row').after(nav);
const style=document.createElement('style');style.textContent='.studio-nav{max-width:1440px;margin:auto;padding:0 20px 12px;display:flex;flex-wrap:wrap;gap:8px}.studio-nav a{color:var(--muted);text-decoration:none;padding:7px 12px;border-radius:5px;font-size:14px}.studio-nav a.active{color:var(--accent);background:var(--accent-soft)}.studio-nav a.studio-new{margin-left:auto}.top .brand small{display:none}.top{position:sticky;top:0;z-index:30}@media(max-width:600px){.studio-nav{padding-inline:12px}.studio-nav a{padding:7px 9px}.studio-nav a.studio-new{display:none}}';document.head.append(style);
const id=new URLSearchParams(location.search).get('open');if(id&&(window.TMB_ITEMS||[]).some(i=>i.id===id))location.hash=id;
})();

(()=>{const v=document.querySelector('#ver');if(v)v.textContent='v2.8.5';const p=document.createElement('link');p.rel='prefetch';p.href='index.html';document.head.append(p);})();

(()=>{const id=new URLSearchParams(location.search).get('tool');if(['gptSettings','btnBreak','btnStore','btnPhotos','btnBackup'].includes(id)){document.querySelector('#'+id)?.click();history.replaceState(null,'','materials.html'+location.hash);}})();
