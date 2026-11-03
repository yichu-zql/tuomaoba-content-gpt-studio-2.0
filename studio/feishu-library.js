(function(g){'use strict';
const text=v=>typeof v==='string'?v:'',url=v=>{try{const u=new URL(v);return u.protocol==='https:'&&/(^|\.)feishu\.cn$/.test(u.hostname)?u.href:'';}catch{return '';}};
function normalize(pack,restricted=()=>false){
 if(pack?.format!=='tmb-feishu-library'||pack.version!==1||!Array.isArray(pack.folders)||!Array.isArray(pack.assets)||!Number.isFinite(Date.parse(pack.readAt)))throw Error('不是有效的飞书素材导入包');
 const seen=new Set(),folders=[],assets=[];let excluded=0;
 for(const row of pack.folders){if(restricted(row.path||row.name||'')){excluded++;continue;}if(!row.token||!url(row.url))throw Error('目录缺少有效来源');if(seen.has(row.token))continue;seen.add(row.token);folders.push({token:text(row.token),name:text(row.name),path:text(row.path),url:url(row.url)});}
 const tokens=new Set();for(const row of pack.assets){if(restricted([row.name,row.path].join(' '))){excluded++;continue;}if(!row.token||!url(row.sourceUrl)||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(row.data||''))throw Error('图片缺少有效来源或图片数据');if(tokens.has(row.token))continue;tokens.add(row.token);assets.push({id:'feishu-'+row.token,token:text(row.token),name:text(row.name),path:text(row.path),sourceUrl:url(row.sourceUrl),data:row.data,source:'feishu',createdAt:pack.readAt});}
 return {format:pack.format,version:1,readAt:pack.readAt,rootUrl:url(pack.rootUrl),folders,assets,excluded,skipped:Array.isArray(pack.skipped)?pack.skipped.map(x=>({path:text(x.path),reason:text(x.reason)})):[],note:text(pack.note)};
}
g.StudioFeishuLibrary={normalize};
})(window);
