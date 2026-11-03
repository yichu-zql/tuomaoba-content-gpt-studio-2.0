(function(g){'use strict';
 const defaults=()=>({q:'',industry:'',goal:'',status:'verified'});
 const status=c=>c.verifiedService?'verified':c.custom?'custom':c.official?'official':'pending';
 const fields=c=>({q:[c.name,c.type,c.source,c.what,c.mechanism,c.borrow,c.year,c.award,c.industry,c.brand,c.account,c.goal].join(' ').toLocaleLowerCase(),industry:c.industry||'未记录行业',goal:c.goal||c.type||'未分类',status:status(c)});
 const matches=(c,f)=>Object.entries(f).every(([k,v])=>!v||(k==='q'?c.q.includes(v.trim().toLocaleLowerCase()):c[k]===v));
 g.StudioCaseFilters={defaults,status,fields,matches};
})(window);
