/* 创意生成器
   - 本地规则引擎：任何地方都能用（包括 GitHub Pages），按“想法 + 形式 + 卖点 + 档期”拼出完整创意
   - 在 claude.ai 里打开时，可以改用 Claude 生成（window.claude 的 sample 能力），失败自动退回本地引擎 */
(function () {
  'use strict';

  function pick(arr, seed, off) { return arr[(seed + (off || 0)) % arr.length]; }
  function clip(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) : s; }

  var SCENES = [
    { re: /午休|中午|午饭/, name: '午休', who: '在附近上班、午休有空的人' },
    { re: /下班|加班|通勤/, name: '下班路上', who: '下班会路过{商场}的上班族' },
    { re: /逛街|商场|购物|看电影|吃饭/, name: '逛街', who: '周末来{商场}逛街吃饭的人' },
    { re: /宿舍|开学|学校|大学|学生|下课|校园/, name: '下课后', who: '附近学校的学生' },
    { re: /健身|瑜伽|运动|游泳|跑步/, name: '健身前后', who: '有健身、游泳习惯的人' },
    { re: /约会|见面|男朋友|女朋友|对象/, name: '约会前', who: '有约会、见面计划的人' },
    { re: /旅行|旅游|度假|海边|出游/, name: '旅行前', who: '计划出去玩、要穿短袖的人' },
    { re: /过年|回家|春节|年货/, name: '过年回家前', who: '年前想收拾一下自己的人' },
    { re: /闺蜜|朋友|同事|室友|姐妹/, name: '和朋友逛街', who: '喜欢和朋友结伴的女生' },
    { re: /夏天|短袖|露/, name: '夏天前', who: '每年夏天才想起脱毛的人' },
    { re: /冬天|冬季|长袖/, name: '冬天', who: '想趁冬天开始脱毛的人' }
  ];
  var DEFAULT_SCENE = { name: '逛街', who: '门店周边 3–5 公里、会路过{商场}的人' };

  var POINTS = {
    '价格反差': {
      hooks: ['一次到店体验多少钱？先把价格和服务范围说清楚', '想了解自助脱毛，先看单次服务价格', '不用猜总价：把本店单次价格列给你看'],
      lines: ['本店腋下+手臂单次体验 {新人价} 元，具体服务范围和价格以当前门店页面为准', '按次体验，流程、服务范围和费用在到店前说清楚'],
      cover: ['单次体验\n{新人价} 元', '服务范围\n和价格说清楚'], slots: ['S9', 'S5']
    },
    '没人推销': {
      hooks: ['全程没人跟你推销的脱毛店', '不用和人尬聊的脱毛店', '一个人进去、一个人做完'],
      lines: ['无人值守，独立隔间，门能锁，扫码开机有语音指引', '自己扫码、自己操作，做完就走，没人劝你办卡'],
      cover: ['没人推销的\n脱毛店', '一个人的\n脱毛隔间'], slots: ['S5', 'S7']
    },
    '顺路就做': {
      hooks: ['{scene}顺路就把毛脱了', '{scene}多走几步，去脱个毛', '不用预约，{scene}路过就进'],
      lines: ['店就在{商场}{位置}，{scene}顺路就能做', '不用预约，到店扫码就开始'],
      cover: ['{scene}\n顺路脱个毛', '不用预约\n路过就进'], slots: ['S1', 'S3']
    },
    '看得见的干净': {
      hooks: ['无人店干不干净？把隔间拍给你看', '进门先把台面擦一遍', '一人一间的脱毛隔间长这样'],
      lines: ['隔间里备有消毒用品，台面、座椅、设备用前都能自己再擦一遍', '独立隔间，一人一间，门能锁'],
      cover: ['干不干净\n拍给你看', '隔间\n长这样'], slots: ['S8', 'S5']
    },
    '自助流程': {
      hooks: ['扫码之后怎么开始？按现场顺序走一遍', '第一次到店，从进门到结束有哪些步骤？', '不讲空话，镜头跟着操作流程走'],
      lines: ['扫码后跟着设备语音提示操作；具体步骤以现场设备和门店说明为准', '从入店、扫码到结束，按现场实际流程拍清楚'],
      cover: ['自助流程\n实走一遍', '扫码后\n怎么开始'], slots: ['S5', 'S7']
    },
    '服务价格透明': {
      hooks: ['一次到店体验多少钱？先把价格和服务范围说清楚', '想了解自助脱毛，先看单次服务价格', '不用猜总价：把本店单次价格列给你看'],
      lines: ['本店腋下+手臂单次体验 {新人价} 元，具体服务范围和价格以当前门店页面为准', '按次体验，流程、服务范围和费用在到店前说清楚'],
      cover: ['单次体验\n{新人价} 元', '服务范围\n和价格说清楚'], slots: ['S9', 'S5']
    }
  };
  var THEME_POINTS = {
    '门店体验': ['没人推销', '顺路就做'], '活动介绍': ['价格反差'], '真实反馈和打卡': ['没人推销'],
    '项目背书': ['顺路就做', '看得见的干净'], '门店指引和点位': ['顺路就做'], '科普答疑': ['没人推销', '价格反差'], '福利与拉新': ['价格反差']
  };

  var OCC = {
    '常规': { period: '常规', line: '新人腋下+手臂 {新人价} 元一次', short: '新人 {新人价} 一次', when: '即日起', refs: [] },
    '冬日打卡季 · 28 天打卡': { period: '冬日打卡季', activity: '打卡', line: '第一次到店核销后自动开启 28 天光滑打卡，4 周 8 次，周周有礼，第 4 周毕业抽奖', short: '28 天打卡 周周有礼', dead: '冬日打卡季到 {打卡季截止}', when: '11/14 打卡上线后', refs: ['打卡_01_新人未开启', '打卡_02_打卡进行中', '打卡_04_周礼包晒小红书'] },
    '冬季 20 次卡': { period: '冬日打卡季', line: '冬季 20 次卡：腋下+手臂 {冬季20次} 元，大腿+小腿 {冬季20次腿} 元', short: '{冬季20次} 元 20 次', dead: '冬日打卡季到 {打卡季截止}', when: '即日起至 {打卡季截止}', refs: [] },
    '邀好友到店': { period: '冬日打卡季', activity: '邀友', line: '好友第一次到店，你抽 1 次奖，人人有奖；好友得一张面部单次券；满 3 位加送芦荟胶，满 5 位加送 8 次脱毛卡', short: '好友到店 双方有礼', when: '11/28 邀友上线后', refs: ['邀友_02_邀好友到店页', '邀友_03_好友打开邀请卡', '邀友_04_好友到店抽奖'] },
    '视频号集赞': { period: '冬日打卡季', activity: '集赞', line: '给官方视频号点赞、转发朋友圈，集满 5 个赞上传截图就能抽奖，人人有奖', short: '集 5 个赞 人人有奖', when: '12/19 集赞上线后', refs: ['集赞_01_首页入口', '集赞_02_集赞任务页', '集赞_03_抽奖结果'] },
    '双12 / 跨年 · 双人卡': { period: '双12 / 跨年', line: '闺蜜双人卡 {双人卡} 元，两个人各用一个隔间', short: '闺蜜双人卡 {双人卡}', when: '12 月', refs: [] },
    '年货节': { period: '年货节', line: '年货节新人全身单次体验 {全身新人价} 元，具体规则以门店页面为准', short: '新人全身单次 {全身新人价}', dead: '活动 1/4–2/5', when: '1/4–2/5', refs: [] },
    '情人节': { period: '情人节', line: '情人节双人卡，约上闺蜜或另一半一起来，价格看店铺页', short: '情人节 双人卡', when: '2/14 前', refs: [] },
    '女神节': { period: '女神节', line: '女神节专享 6 次全身卡，价格看店铺页', short: '女神节专享', dead: '活动 3/1–3/10', when: '3/1–3/10', refs: [] }
  };

  /* 问答合集用：像店员本人在答，说具体细节，不用统一标准答案 */
  var QA = [
    ['疼不疼？', '说实话看部位。手臂基本就是热一下，腋下敏感的会有点刺，档位自己调，第一次先开低档。'],
    ['要做几次？', '一次是试感觉的。想看变化就跟着小程序的 28 天打卡来，4 周 8 次，每个人情况不一样。'],
    ['两次隔多久？', '至少隔 2 天。小程序会提醒你哪天该来，不用自己记。'],
    ['要准备什么？', '来之前把毛刮干净（这步别偷懒），带上手机就行，其他店里都有。'],
    ['卫生吗？', '一人一间，台面上有消毒湿巾。我自己去也是先擦一遍再用，一两分钟的事。'],
    ['店里怎么使用？', '扫码后跟着设备语音提示操作，具体步骤以现场设备和门店说明为准。']
  ];
  /* 朋友圈结尾别每条都一样，像群发 */
  var PYQ_CTA = ['想试的点卡片，或者找我拿本店优惠码', '附近的可以点卡片看看，有问题直接问我', '要本店优惠码的私我一声', '想去之前有啥想问的，评论或私聊都行'];
  function cta(p, acct, spoken, seed) {
    if (p === 'sph') return '点下方链接，看离你最近的门店👇';
    if (p === 'pyq') return acct === '老客' ? '想去的私我，我发你邀请卡' : PYQ_CTA[(seed || 0) % PYQ_CTA.length];
    if (acct === '门店号') return spoken ? '{商场}{位置}，搜 Ulike脱毛吧 就能找到' : '📍{商场}{位置}｜搜「Ulike脱毛吧 {商场}」';
    return spoken ? '搜 Ulike脱毛吧，看离你最近的店' : '搜「Ulike脱毛吧＋商圈名」看离你最近的店～';
  }

  /* 评论区回复：按卖点挑问题，从回复库轮换说法；门店号用店主口吻 */
  function replies(acct, seed, pts) {
    var who = acct === '门店号' ? 'dian' : 'guan', keys = ['where', 'pain', 'price'];
    if (pts && pts.indexOf('看得见的干净') >= 0) keys[1] = 'clean';
    if (pts && pts.indexOf('没人推销') >= 0) keys[2] = 'sell';
    return keys.map(function (k, j) { return RP(k, seed + j, who); }).join('\n\n');
  }

  function slotsFor(form, pts, theme) {
    var s = [];
    pts.forEach(function (k) { (POINTS[k].slots || []).forEach(function (x) { s.push(x); }); });
    if (/路线|指引|门店合集/.test(form) || theme === '门店指引和点位') s = ['S10', 'S2', 'S3', 'S1'].concat(s);
    if (/九宫格/.test(form)) s = ['S1', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S2', 'S10'];
    if (/vlog|探店|第一视角/.test(form)) s = s.concat(['S1', 'S5', 'S7']);
    return s.filter(function (x, i) { return s.indexOf(x) === i; }).slice(0, 9);
  }

  function scriptFor(form, c) {
    return scriptRaw(form, c).map(function (r) { return r.map(function (x) { return x.replace(/\{sceneName\}/g, c.sceneName); }); });
  }
  function scriptRaw(form, c) {
    var R = function (a, b, d) { return [a, b, d]; };
    switch (form) {
      case '剧情':
        return [R('0–3s', 'A 拉住 B（{sceneName}，商场里）', 'A：' + c.hook), R('3–9s', '两人边走边聊，看导视找店', 'B：自助的？没人推销吧？ A：没有，自己扫码'), R('9–16s', '两个隔间门先后关上', '字幕：' + c.line1), R('16–22s', '出门后 A 看手机', 'A：' + c.occShort), R('22–28s', '两人在门头前', '字幕：' + c.cta)];
      case '价格字卡':
        return [R('0–3s', '门店实景 + 单次服务价格', '字幕：' + c.hook), R('3–9s', '服务范围与当前价目', '口播：价格和服务范围以当前门店页面为准'), R('9–16s', '扫码开机、设备语音指引', '口播：' + c.line1), R('16–22s', '独立隔间与操作流程', '字幕：' + c.occLine), R('22–26s', '门头与位置', '口播：' + c.cta)];
      case '对比测评':
        return [R('0–3s', '两种服务流程并列卡片', '字幕：' + c.hook), R('3–10s', '预约 / 到店流程说明', '口播：只列已核实的服务方式和预约要求'), R('10–16s', '当前公开价目与服务范围', '口播：价格按相同部位、次数和有效期核对；没有可靠来源就不做金额对比'), R('16–23s', '独立隔间、扫码与语音指引', '口播：' + c.line1), R('23–28s', '总结字卡', '口播：按自己的需求选服务方式。' + c.cta)];
      case '路线实拍':
        return [R('0–3s', '{商场}外立面或大门', '字幕：' + c.hook), R('3–7s', '进门、导视牌', '字幕：{位置}'), R('7–11s', '走到店门口，门头', '口播：就是这家 Ulike脱毛吧'), R('11–15s', '推门进隔间、扫码开机', '字幕：' + c.cta)];
      case '口播讲解':
        return [R('0–3s', '出镜人半身，背景是门头', '口播：' + c.hook), R('3–10s', '插入隔间空镜', '口播：' + c.line1), R('10–17s', '插入扫码开机画面', '口播：' + c.line2), R('17–23s', '字卡', '字幕：' + c.occLine), R('23–27s', '门头', '口播：' + c.cta)];
      case '门店合集':
        return [R('0–3s', '{城市}门店地图卡', '字幕：' + c.hook), R('3–15s', '各门店门头快切，每家 2 秒', '字幕：门店名 + 位置'), R('15–20s', '小程序自动定位画面', '口播：点链接，自动找到离你最近的店'), R('20–24s', '价格字卡', '字幕：' + c.occShort)];
      case '活动讲解':
        return [R('0–3s', '活动主视觉 / 小程序活动页', '字幕：' + c.hook), R('3–10s', '小程序录屏', '口播：' + c.occLine), R('10–17s', '门店隔间空镜', '口播：' + c.line1), R('17–23s', '礼品、积分画面', '字幕：' + (c.occDead || c.occShort)), R('23–27s', '门店空镜', '字幕：' + c.cta)];
      default: /* 第一视角 vlog / 逛店 vlog */
        return [R('0–3s', '{sceneName}出发，镜头跟着走进{商场}', '字幕：' + c.hook), R('3–8s', '走到店门口，推门', '口播：' + c.line1), R('8–15s', '扫码开机，设备放在小臂上（只拍手臂）', '口播：' + c.line2), R('15–21s', '隔间全景 + 字卡', '字幕：' + c.occShort), R('21–26s', '出门继续逛，门头', '口播：' + c.cta)];
    }
  }

  function xhsBody(form, c, theme, acct) {
    var lines;
    if (form === '晒单模板') {
      return '【写一句你为什么来】\n店在{商场}{位置}，' + c.line1 + '。\n我的感受：【写你自己的真实感受】\n' + (c.occ.activity === '打卡' ? '已打卡【N】/8 次，下周继续～' : '下次还来～');
    }
    if (form === '问答合集') {
      return c.hook + '，评论区问得多的统一回答👇\n\n' + QA.slice(0, 5).map(function (q, i) { return (i + 1) + '️⃣ ' + q[0] + '\n' + q[1]; }).join('\n\n') + '\n\n💰 ' + c.occLine + '\n📍 ' + c.cta;
    }
    if (form === '对比图') {
      return c.hook + '👇\n\n先按服务方式看：\n① 自助体验：扫码后跟随设备提示操作，独立隔间；\n② 人工服务：按机构公开的预约流程和服务范围了解；\n③ 价格：只列各自当前公开、同部位同次数的价格，范围或条件不一致就不做金额对比。\n\n不比较效果，也不替你选，按自己更在意的流程和服务方式决定。\n\n本店信息：' + c.line1 + '。\n\n' + c.cta;
    }
    if (form === '清单合集') {
      lines = c.allLines.map(function (l, i) { return ['①', '②', '③', '④', '⑤'][i] + ' ' + l; });
      return c.hook + '，适合这几种人👇\n\n' + lines.join('\n') + '\n\n' + c.occLine + (c.occDead ? '，' + c.occDead : '') + '。\n\n' + c.cta;
    }
    if (form === '图文攻略') {
      return c.hook + '，第一次去的照着做👇\n\n1️⃣ 找店：{商场}{位置}\n2️⃣ 开机：打开 Ulike 小程序扫码，跟着语音提示做\n3️⃣ 准备：来之前把毛发刮干净\n4️⃣ 价格：' + c.occLine + '\n\n' + c.line1 + '。\n\n' + c.cta;
    }
    /* 探店笔记 */
    return c.hook + '👇\n\n🚪 店里长啥样\n' + c.line1 + '。\n\n📱 第一次怎么用\n下单新人体验 → 到店打开 Ulike 小程序扫码开机 → 跟着语音做。\n\n💰 ' + c.occLine + (c.occDead ? '，' + c.occDead : '') + '\n\n' + (acct === '门店号' ? '🍜 做完顺路：{周边}\n\n' : '') + c.cta;
  }

  function pyqTexts(form, c, acct) {
    var place = '{商场}';
    switch (form) {
      case '九宫格': return { v1: place + '{位置}的 Ulike自助脱毛吧，' + c.line1 + '。' + c.occShort + '，路过可以进来看看～', v2: c.hook + '。店在' + place + '，' + c.cta, pics: '九宫格：门头 / 店门口 / 隔间全景 / 设备上手 / 扫码开机 / 清洁消毒 / 门口立牌 / 导视 / 周边地标；评论区补本店小程序卡片' };
      case '转发视频号': return { v1: c.hook + '，' + place + '就有。' + c.occShort + '👇', v2: c.line1 + '，想试的点视频下面的链接看看。', v3: (c.occDead ? c.occDead + '，' : '') + '店在' + place + '{位置}。', pics: '转发官号当周视频号视频；评论区补本店小程序卡片' };
      case '群公告': return { v1: '【' + place + '·自助脱毛】' + c.occLine + '。位置：' + place + '{位置}。' + (c.occDead ? c.occDead + '。' : '') + '想试的私我拿本店优惠码～', v2: '有在' + place + '附近的姐妹吗？' + c.hook + '，' + c.occShort + '。', pics: '可附 1 张门头照或本店小程序卡片；先征得群主同意，每周不超过 2 次' };
      case '群聊天': return { v1: '（有人聊到脱毛时接一句）' + c.line1 + '，就在' + place + '。', v2: c.occShort + '，我这有本店优惠码，要的说一声。', pics: '等有人提到再接话，配 1 张门头照' };
      case '私聊话术': return { v1: acct === '老客' ? '闺蜜版：' + c.hook + '，我常去的，你第一次去还有礼物，陪我呗' : '熟人版：' + place + '有家自助脱毛，' + c.line1 + '。' + c.occShort + '，要的话我发你本店卡片。', v2: acct === '老客' ? '同事版：楼下' + place + '有家自助脱毛，午休就能去，我发你个邀请卡。' : '问价版：' + c.occLine + '，到店用小程序扫码就能用。', pics: acct === '老客' ? '发小程序邀请卡' : '发本店小程序卡片' };
      default: return { v1: c.hook + '。' + c.occShort + (c.occDead ? '，' + c.occDead : '') + '，' + cta('pyq', acct), v2: c.line1 + '，店在' + place + '{位置}。', pics: '配 1–3 张门店图，附本店小程序卡片' };
    }
  }

  /* 本地引擎主函数 */
  function generateLocal(input, seed) {
    seed = seed || 0;
    var P = window.TMB_PLATFORMS[input.p];
    var idea = String(input.idea || '').trim();
    var scene = DEFAULT_SCENE;
    for (var i = 0; i < SCENES.length; i++) if (SCENES[i].re.test(idea)) { scene = SCENES[i]; break; }
    var pts = (input.points && input.points.length ? input.points : THEME_POINTS[input.theme] || ['没人推销']).slice(0, 3);
    var occ = OCC[input.occasion] || OCC['常规'];
    var acct = input.acct || P.accts[0];
    var form = input.form || P.forms[0];
    var sub = function (s) { return String(s).replace(/\{scene\}/g, scene.name); };
    var p0 = POINTS[pts[0]], p1 = POINTS[pts[1] || pts[0]];
    var hook = sub(pick(p0.hooks, seed));
    if (input.theme === '科普答疑') hook = pick(['无人脱毛店的几个问题，一次说清', '第一次去自助脱毛前，先看这几条', '疼不疼、几次、怎么用，都在这'], seed);
    if (input.theme === '项目背书') hook = pick(['做家用脱毛仪的 Ulike，开了线下自助店', '店里用的就是 Ulike 的设备', 'Ulike 的自助脱毛店长这样'], seed);
    if (input.theme === '门店指引和点位') hook = pick(['15 秒找到{商场}这家自助脱毛店', '{商场}的自助脱毛店在{位置}', '按图走，不会找不到店'], seed);
    if (input.theme === '福利与拉新' && occ.activity !== '集赞') hook = pick(['带朋友去，两个人都有礼', '约闺蜜一起，一人一个隔间', '好友到店 1 位，你抽 1 次'], seed);
    if (occ.activity === '打卡' && input.theme === '真实反馈和打卡') hook = pick(['28 天光滑打卡，第 N 次', '打卡第 2 周，记录一下', '坚持打卡的第 14 天'], seed);
    var line1 = sub(pick(p0.lines, seed)), line2 = sub(pick(p1.lines, seed, 1));
    if (line2 === line1) line2 = '从进门、扫码到做完，全程自己来';
    var allLines = pts.map(function (k, j) { return sub(POINTS[k].lines[(seed + j) % POINTS[k].lines.length]); });
    var c = { hook: hook, line1: line1, line2: line2, allLines: allLines, occ: occ, occLine: occ.line, occShort: occ.short, occDead: occ.dead, cta: cta(input.p, acct, true, seed), sceneName: scene.name };
    var styles = ['red', 'navy', 'cream', 'mint', 'blue'];
    var coverMain = input.theme === '活动介绍' || input.theme === '福利与拉新' ? occ.short.replace(' ', '\n') : sub(pick(p0.cover, seed));
    var item = {
      id: 'my' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      custom: true, p: input.p, acct: acct, type: input.theme, form: form,
      act: input.p === 'sph' ? (occ.activity === '集赞' ? 'C' : 'B') : input.p === 'pyq' ? (acct === '老客' ? 'C' : 'B') : (form === '晒单模板' || acct === '打卡用户' || acct === '星推官' ? 'C' : 'A'),
      period: occ.period, activity: occ.activity, when: occ.when, freq: '按需',
      title: clip(hook, 26),
      angle: idea ? '你的想法：' + clip(idea, 80) : '按“' + pts.join('、') + '”生成',
      cover: { main: coverMain, sub: clip(occ.short === coverMain.replace('\n', ' ') ? scene.name + '顺路就做' : occ.short, 16), style: styles[seed % styles.length] },
      brief: {
        who: input.who || scene.who,
        hook: hook,
        msg: allLines.join('；') + '；' + occ.line,
        must: input.p === 'douyin' || input.p === 'xhs' ? '带门店地点或 POI；正文不写“美团”；结尾引导搜店名' : input.p === 'sph' ? '挂小程序卡片 + 公众号文章' : '附本店小程序卡片或优惠码；像本人说话',
        shoot: /vlog|第一视角|探店/.test(form) ? '第一视角竖拍，只拍手和小臂；门头、隔间、扫码开机各 1 段' : /剧情/.test(form) ? '两位员工出镜演剧情；隔间只拍关门' : /字卡|对比/.test(form) ? '字卡为主，插入隔间空镜' : /路线|指引/.test(form) ? '按路线拍，每个转弯处 1 段，每段 3 秒' : '用门店图位里的照片',
        kpi: input.p === 'sph' ? '小程序访问、视频号转发' : input.p === 'pyq' ? '咨询数、本店渠道码核销' : '店名搜索、门店页访问'
      },
      f: {},
      slots: slotsFor(form, pts, input.theme),
      refs: (occ.refs || []).slice()
    };
    var dead = occ.dead ? '，' + occ.dead : '';
    if (input.p === 'douyin') {
      item.f.post = hook + '\n' + line1 + '。\n' + occ.line + dead + '。\n' + cta('douyin', acct);
      item.f.script = scriptFor(form, c);
      item.f.tags = '#自助脱毛 #脱毛 #Ulike脱毛吧 #{城市}探店 #' + scene.name.replace(/\s/g, '');
      if (acct === '门店号') item.f.pin = '📍{商场}{位置}｜营业时间 {营业时间}｜搜「Ulike脱毛吧 {商场}」';
      else { item.f.pinA = '某团搜「Ulike脱毛吧」，' + occ.short + dead + '👇'; item.f.pinB = PIN_B; }
      item.f.replies = replies(acct, seed, pts);
    } else if (input.p === 'xhs') {
      item.f.title = form === '晒单模板' ? '可选标题（三选一）：\n' + hook + '\n{商场}的自助脱毛店\n' + pick(['一个人的脱毛隔间', '打卡记录', '没人推销的脱毛店'], seed) : clip(hook, 20);
      item.f.body = xhsBody(form, c, input.theme, acct);
      item.f.tags = '#自助脱毛 #脱毛 #Ulike脱毛吧 #{城市}探店 #{区域}' + (occ.activity === '打卡' ? ' #28天光滑打卡' : '');
      if (acct === '门店号') item.f.pin = '📍{商场}{位置}｜营业时间 {营业时间}｜搜「Ulike脱毛吧 {商场}」';
      else if (acct === '官号') { item.f.pinA = '某团搜「Ulike脱毛吧」，' + occ.short + dead; item.f.pinB = PIN_B; }
      item.f.replies = form === '晒单模板' ? '晒单页提示：带门店地点和 #Ulike自助脱毛吧，发布后回到小程序晒单页提交。' : replies(acct, seed, pts);
    } else if (input.p === 'sph') {
      if (acct === '公众号' || form === '公众号文章') {
        item.acct = '公众号'; item.form = '公众号文章';
        item.f.title = clip(hook, 22) + '｜{城市}门店和新人优惠码';
        item.f.summary = line1 + '。' + occ.short + '，每家店的位置和优惠码都在文章里。';
        item.f.body = '【开头】' + hook + '。\n\n【为什么值得去】\n' + allLines.map(function (l) { return '· ' + l; }).join('\n') + '\n\n【活动】\n' + occ.line + dead + '。\n\n【{城市}门店】\n门店名｜位置｜新人优惠码\n{简称}｜{商场}{位置}｜【填本店优惠码】\n\n【怎么用】\n① 点下方小程序卡片，自动定位最近门店\n② 点“去美团买新人价”，用本店优惠码下单\n③ 到店用小程序“美团码核销”开机';
        item.f.mount = '文章内插入：小程序卡片「Ulike脱毛吧｜看离你最近的门店」';
      } else {
        item.f.post = hook + '\n' + line1 + '。' + occ.line + dead + '。\n' + cta('sph', acct);
        item.f.script = scriptFor(form, c);
        item.f.mount = '小程序卡片：Ulike脱毛吧｜看离你最近的门店';
        item.f.article = '公众号文章：《' + clip(occ.short, 14) + '｜{城市}门店和新人优惠码》';
        item.f.tags = '#自助脱毛 #Ulike脱毛吧 #{城市}';
        if (occ.activity === '集赞') item.f.forward = '给转发用户的朋友圈文案：\n① ' + hook + '，附近的姐妹可以去试试～\n② 逛街顺路做了个脱毛，没人推销，做完继续逛。\n③ 这家在{商场}，冬天开始做，夏天不着急。';
      }
    } else {
      var t = pyqTexts(form, c, acct);
      item.f.v1 = t.v1; item.f.v2 = t.v2; if (t.v3) item.f.v3 = t.v3; item.f.pics = t.pics;
      item.f.timing = form === '群公告' ? '工作日中午或晚饭后，每周不超过 2 次' : '周二、周四、周六晚 8 点前后';
      item.slots = form === '九宫格' ? item.slots : item.slots.slice(0, 3);
    }
    return item;
  }

  /* ---------- 快速生成：根据输入重新组稿，参考库仅用于启发与避重 ---------- */
  var POINT_KW = {
    '价格反差': /价格|多少钱|单次|费用|服务范围|价目|透明/g,
    '服务价格透明': /价格|多少钱|单次|费用|服务范围|价目|透明/g,
    '没人推销': /推销|尴尬|尬聊|社恐|无人|没人|一个人/g,
    '顺路就做': /顺路|午休|下班|逛街|路过|楼下|通勤|预约/g,
    '看得见的干净': /干净|卫生|消毒|清洁/g,
    '自助流程': /自助流程|扫码|语音指引|操作步骤|入店|进门/g,
  };
  function kwCount(k, t) { var m = String(t).match(POINT_KW[k]); return m ? m.length : 0; }
  function kwHit(k, t) { return kwCount(k, t) > 0; }
  var OCC_KW = [
    [/20 ?次|冬季卡|次卡/, '冬季 20 次卡'],
    [/打卡|28 ?天|毕业|周礼包|晒单/, '冬日打卡季 · 28 天打卡'],
    [/邀请|邀友|拉人|带朋友|好友到店|朋友第一次到店|面部券/, '邀好友到店'],
    [/集赞|点赞|转发抽奖/, '视频号集赞'],
    [/双\s?12|跨年|双人卡/, '双12 / 跨年 · 双人卡'],
    [/年货|过年|春节/, '年货节'],
    [/情人节|520|七夕/, '情人节'],
    [/女神节|妇女节|三八/, '女神节']
  ];
  /* 合规改写用 compliance.js 的同一份词表 */
  function fixText(s) { return window.TMB_RULES.fix(s).replace(/和朋友逛街约闺蜜/g, '约闺蜜逛街'); }
  function fixItem(it) {
    it.title = fixText(it.title);
    it.cover.main = fixText(it.cover.main); it.cover.sub = fixText(it.cover.sub);
    Object.keys(it.f).forEach(function (k) { var v = it.f[k]; it.f[k] = Array.isArray(v) ? v.map(function (r) { return r.map(fixText); }) : fixText(v); });
    (it.frames || []).forEach(function (f) { f.main = fixText(f.main); f.sub = fixText(f.sub); f.note = fixText(f.note); });
    return it;
  }
  function grams(s) { s = String(s || '').replace(/\{[^}]*\}|[\s，。、！？“”「」：；（）,.!?:;()#\-—|·]/g, ''); var g = {}; for (var i = 0; i < s.length - 1; i++) g[s.substr(i, 2)] = 1; return g; }
  function overlap(a, b) { var n = 0; for (var k in a) if (b[k]) n++; return n; }
  function docText(t) { return [t.title, t.angle, t.form, t.cover.main, t.cover.sub, t.brief.hook, t.brief.msg, t.f.post || t.f.body || t.f.v1 || ''].join(' '); }

  /* 按想法找参考：同主题优先，再看账号、形式、档期、卖点和文字相似度 */
  /* 节点档期按月份算（大概范围，够用来排除明显过季的模板） */
  var SEASON = { '双12 / 跨年': [12, 1], '年货节': [1, 2], '情人节': [2], '女神节': [2, 3], '冬日打卡季': [11, 12, 1, 2] };
  function inSeason(period, d) { var m = (d || new Date()).getMonth() + 1, r = SEASON[period]; return !r || r.indexOf(m) >= 0; }
  function rank(input, pool) {
    var ig = grams(input.idea), occ = OCC[input.occasion] || OCC['常规'];
    pool = pool.filter(function(t) { return !window.TMB_RULES.hasRestrictedPurchase(JSON.stringify(t)) && t.p === input.p && t.acct === input.acct && (t.industryCase || (t.acct === '公众号' ? !!t.f.body : t.p === 'sph' ? !!t.f.script : true)); });
    var same = pool.filter(function (t) { return t.type === input.theme || t.industryCase; });
    if (same.length < 2) same = pool.filter(function (t) { return t.p === input.p; });
    return same.map(function (t) {
      var s = overlap(ig, grams(docText(t))) * 1.5;
      if (t.acct === input.acct) s += 4;
      if (t.form === input.form) s += 5;
      /* 档期要对得上：选了活动就优先同档期；没选就少用节日专属的模板 */
      if (input.occasion !== '常规') { if (t.period === occ.period || (occ.activity && t.activity === occ.activity)) s += 8; else if (t.period !== '常规') s -= 6; }
      else if (['年货节', '情人节', '女神节', '双12 / 跨年'].indexOf(t.period) >= 0) s -= inSeason(t.period) ? 4 : 20; /* 十月底不该拿女神节的模板当骨架 */
      /* 没选活动时，不拿打卡 / 邀友 / 集赞这类活动专属模板当骨架，否则正文会讲一个没选的活动 */
      if (input.occasion === '常规' && t.activity) s -= 10;
      (input.points || []).forEach(function (k, j) { if (POINT_KW[k]) s += Math.min(3, kwCount(k, docText(t))) * (j ? 1 : 2); });
      if (t.edited) s += 1.5;
      /* 自己生成、还没改过的创意参考权重低一些；内容太短的不拿来做骨架 */
      if (t.custom && !t.edited) s -= 3;
      if ((t.f.script && t.f.script.length < 3) || String(t.f.post || t.f.body || t.f.v1 || '').length < 20) s -= 12;
      return { t: t, s: s };
    }).sort(function (a, b) { return b.s - a.s; });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function quoted(idea) { var m = String(idea || '').match(/[“"「『]([^”"」』]{2,34})[”"」』]/); return m ? m[1].trim() : ''; }
  function industryCaseRefs(input) {
    if(input.goal&&window.TMB_SERVICE)return window.TMB_SERVICE.search(input).map(function(c){return {id:c.id,p:input.p,acct:input.acct,type:input.theme,title:c.name,angle:c.borrow,form:c.industry,cover:{main:c.name,sub:''},brief:{hook:c.mechanism,msg:c.what},f:{post:c.what},industryCase:true,source:{name:c.name,url:c.url,type:c.industry}};});
    var books = window.TMB_PLAYBOOK || {}, out = [], seen = {};
    Object.keys(books).forEach(function (p) { Object.keys(books[p] || {}).forEach(function (theme) {
      (books[p][theme].cases || []).forEach(function (c, i) {
        var key = c.url || c.name; if (!key || seen[key]) return; seen[key] = true;
        var body = [c.what, c.why, c.borrow].filter(Boolean).join('；');
        out.push({ id: 'industry-' + p + '-' + theme + '-' + i, p: input.p, acct: input.acct, type: theme, title: c.name, angle: c.borrow || c.why || c.what, form: c.type || '行业案例', cover: { main: c.name, sub: '' }, brief: { hook: c.what || '', msg: c.why || '' }, f: { post: body }, industryCase: true, source: { name: c.source || '', url: c.url || '', type: c.type || '' } });
      });
    }); });
    (window.TMB_INDUSTRY_CASES || []).forEach(function (c, i) {
      var key = c.url || c.id || c.name; if (!key || seen[key]) return; seen[key] = true;
      var body = [c.what, c.borrow].filter(Boolean).join('；');
      out.push({ id: c.id || 'industry-extra-' + i, p: input.p, acct: input.acct, type: '行业案例', title: c.name, angle: c.borrow || c.what, form: c.industry || c.type || '行业案例', cover: { main: c.name, sub: '' }, brief: { hook: c.what || '', msg: c.why || '' }, f: { post: body }, industryCase: true, source: { name: c.source || '行业案例', url: c.url || '', type: c.industry || c.type || '' } });
    });
    return out;
  }
  function creativeDirections(input) {
    var topic = String(input.idea || '').trim().replace(/[“"「」『』]/g, '');
    topic = topic ? clip(topic, 20) : input.theme;
    var defs = [
      ['流程实走', '记录从提出疑问到完成一次流程，步骤按门店实际情况填写。', '第一次了解「' + topic + '」，这次按实际流程走一遍。', '这次不先下结论，按实际流程走一遍，看到哪一步就说到哪一步。'],
      ['单问单答', '选一个第一次接触时的具体问题，按问题、已核实回答、信息边界展开。', '关于「' + topic + '」，先回答第一次接触时最该问的一个问题。', '问题先摆出来，回答只留门店能确认的信息。'],
      ['决策清单', '列出三项判断条件，每项配可查看的信息，让读者自己决定。', '想判断「' + topic + '」适不适合自己？先核对这三项。', '先看这三项条件，再决定要不要继续了解。'],
      ['先讲边界', '说清需要先确认的适用条件，不给所有人都适用的结论。', '先不急着介绍「' + topic + '」，把需要提前确认的情况讲清楚。', '哪些情况要提前确认，我先把能核实的信息摆出来。'],
      ['细节观察', '镜头只跟一个现场细节，说明它是什么、怎样核实，避免空泛评价。', '不讲大结论，只记录「' + topic + '」里一个现场看得到的细节。', '我只拍一个现场细节，顺手把它怎么确认说清楚。'],
      ['三步拆解', '把主题拆成三个动作，每一步配实际画面与一句说明。', '把「' + topic + '」拆成三步，每一步都用实际画面对应。', '步骤分成三段，每段只讲一件事，照着实际情况来。'],
      ['幕后任务', '记录门店准备的一件真实小事，保留过程细节，不模拟顾客评价。', '从门店准备「' + topic + '」的一件小事开始，记录前后过程。', '从店里开始准备时的一件小事拍起，不演顾客。'],
      ['选择对照', '比较两个选择的条件和取舍，只用已核实信息，不替观众下结论。', '面对「' + topic + '」，把两个选择的条件摆出来再比较。', '把两个选择的条件放一起看，最后让大家自己判断。'],
      ['现场验证', '提出一个能现场核对的问题，呈现核对过程与有限结论。', '用一个现场问题验证「' + topic + '」：提出、核对、再说明结论。', '挑一个能现场核对的问题，从提出到核对过程拍完整。']
    ];
    return defs.map(function (d, i) { return { id: i, label: d[0], point: d[1], hook: d[2], line: d[3] }; });
  }

  function generateSmart(input, seed, pool) {
    seed = seed || 0;
    input = clone(input);
    var idea = String(input.idea || '').trim();
    /* 想法里提到的卖点和活动，没选也自动带上 */
    if (!input.points || !input.points.length) input.points = Object.keys(POINT_KW).filter(function (k) { return kwHit(k, idea); }).slice(0, 3);
    if (!input.occasion || input.occasion === '常规') for (var i = 0; i < OCC_KW.length; i++) if (OCC_KW[i][0].test(idea)) { input.occasion = OCC_KW[i][1]; break; }
    var caseRefs = industryCaseRefs(input), fullPool = (pool || []).concat(caseRefs).filter(function (t) { return !window.TMB_RULES.hasRestrictedPurchase(JSON.stringify(t)); }), ranked = rank(input, fullPool);
    /* 不再克隆最相似创意：从平台适配的本地规则重新生成若干候选，选与参考库重合度最低的一条。 */
    var refsPool = fullPool;
    var candidates = [];
    for (var ci = 0; ci < 4; ci++) candidates.push(generateLocal(input, seed + ci));
    var best = candidates[0], bestScore = Infinity;
    candidates.forEach(function (candidate) {
      var text = docText(candidate), gramsCandidate = grams(text), score = 0;
      refsPool.forEach(function (ref) {
        if (ref.p !== input.p) return;
        var refGrams = grams(docText(ref)), total = Object.keys(gramsCandidate).length || 1;
        score = Math.max(score, overlap(gramsCandidate, refGrams) / total);
      });
      if (score < bestScore) { best = candidate; bestScore = score; }
    });
    var rule = best;
    if (!ranked.length) return fixItem(rule);
    var refs = ranked.slice(0, 3).map(function (r) { return r.t; });
    var it = rule, occ = OCC[input.occasion] || OCC['常规'];
    var sceneFor = function () { for (var k = 0; k < SCENES.length; k++) if (SCENES[k].re.test(idea)) return SCENES[k]; return DEFAULT_SCENE; };
    var q = quoted(idea);
    var direction = input.direction || null;
    var hook = direction && direction.hook || q || '';
    var PBt = (window.TMB_PLAYBOOK || {})[input.p] && window.TMB_PLAYBOOK[input.p][input.theme];
    var pbTitle = '';
    if (!hook && PBt && PBt.gen && PBt.gen.hooks && PBt.gen.hooks.length) {
      /* 没有现成钩子：用本模块爆款公式里的开头和标题模板 */
      var sc0 = sceneFor();
      hook = pick(PBt.gen.hooks, seed).replace(/\{scene\}/g, sc0.name);
      if (PBt.gen.titles && PBt.gen.titles.length) pbTitle = pick(PBt.gen.titles, seed).replace(/\{scene\}/g, sc0.name);
    }
    if (!hook) {
      /* 没有现成钩子：根据用户输入和本地规则起标题，不复用参考创意的表达。 */
      var tTxt = idea;
      var kp = input.points.filter(function (k) { return kwHit(k, tTxt); })[0] || Object.keys(POINT_KW).sort(function (x, y) { return kwCount(y, tTxt) - kwCount(x, tTxt); }).filter(function (k) { return kwHit(k, tTxt); })[0];
      var sc = sceneFor();
      hook = kp && ['活动介绍', '门店体验'].indexOf(input.theme) >= 0 ? pick(POINTS[kp].hooks, seed).replace(/\{scene\}/g, sc.name) : rule.title;
    }
    var occ0 = OCC[input.occasion] || OCC['常规'];
    var pointLine = direction ? direction.line : input.occasion !== '常规' && input.points[0] === '价格反差' ? occ0.line : rule.brief.msg.split('；')[0];

    var originalForm = it.form;
    it.id = rule.id; it.custom = true; it.edited = false; delete it.ai; delete it.input; delete it.seed;
    it.acct = input.acct || it.acct; it.form = input.form || it.form; it.type = input.theme;
    it.act = rule.act; it.freq = '按需';
    if (input.occasion !== '常规') { it.period = occ.period; it.activity = occ.activity; it.when = occ.when; }
    it.title = clip(direction ? direction.label + ' · ' + input.theme : pbTitle || hook, 26);
    it.formula = (PBt && PBt.content && PBt.content.formula) || '平台规则与用户输入组合';
    it.angle = (idea ? '你的想法：' + clip(idea, 70) : '按“' + (input.points.join('、') || input.theme) + '”生成') + '。创意点：' + (direction ? direction.point : '按平台表达规则重新组织') + (refs.length ? refs[0].industryCase ? '；参考行业案例的方法结构，不沿用原切口与表达' : '；参考其“' + refs[0].form + '”呈现方式，不沿用原切口与表达' : '') + '。';
    it.basedOn = refs.filter(function (r) { return !r.industryCase; }).map(function (r) { return r.id; }).slice(0, 3);
    it.caseReferences = refs.filter(function (r) { return r.industryCase && r.source.url; }).map(function (r) { return { name: r.source.name || r.title, url: r.source.url, type: r.source.type }; }).slice(0, 3);
    it.cover.main = q && q.length <= 12 ? q.replace(/[，,]/, '\n') : direction ? clip(direction.label, 12) : (input.occasion !== '常规' || seed % 2 ? rule.cover.main : it.cover.main);
    it.cover.sub = rule.cover.sub;
    it.cover.style = ['red', 'navy', 'cream', 'mint', 'blue'][seed % 5];
    it.brief.who = input.who || it.brief.who;
    it.brief.hook = hook;
    var needOcc = input.occasion !== '常规' && JSON.stringify(it.f).indexOf(occ.short.split(' ')[0]) < 0;
    var occTxt = occ.line + (occ.dead ? '，' + occ.dead : '');
    /* 模板已经讲到这个卖点，就不再重复插入 */
    var topTxt = JSON.stringify(it.f) + it.title;
    var needPoint = !!direction || input.points.length && !(POINT_KW[input.points[0]] && kwHit(input.points[0], topTxt)) && topTxt.indexOf(pointLine.slice(0, 6)) < 0;
    if (needPoint) it.brief.msg = pointLine + '；' + it.brief.msg;
    var f = it.f, p = input.p;

    var formChanged = !!(f.script && originalForm !== input.form);
    if (f.script) {
      if (formChanged) f.script = rule.f.script;
      else {
        f.script[0][2] = '字幕：' + hook;
        if (needPoint && f.script.length > 2) f.script[1][2] = '口播：' + pointLine;
        if (needOcc && f.script.length > 3) f.script[f.script.length - 2][2] = '字幕：' + occ.short;
      }
    }
    if (f.post) {
      var pl = f.post.split('\n'); pl[0] = hook;
      if (needPoint) pl.splice(1, 0, pointLine + '。');
      if (needOcc) pl.splice(pl.length - 1, 0, occTxt + '。');
      f.post = pl.join('\n');
    }
    if (p === 'xhs' && f.body) {
      if (!/^可选标题/.test(f.title || '')) f.title = clip(hook, 20);
      else f.title = '可选标题（三选一）：\n' + clip(hook, 20) + '\n' + f.title.split('\n').slice(1, 3).join('\n');
      var paras = f.body.split('\n\n');
      if (!/【/.test(paras[0])) paras[0] = hook + '👇';
      if (needPoint) paras.splice(1, 0, '💡 ' + pointLine + '。');
      if (needOcc) paras.splice(paras.length - 1, 0, '🎁 ' + occTxt + '。');
      f.body = paras.join('\n\n');
    }
    if (p === 'sph' && it.acct === '公众号' && f.body) {
      f.title = clip(hook, 22) + (f.title && f.title.indexOf('｜') > 0 ? '｜' + f.title.split('｜').slice(1).join('｜') : '');
      if (needOcc) f.body = f.body.replace(/(【[^】]*活动[^】]*】\n?)/, '$1' + occTxt + '。\n');
    }
    if (p === 'pyq') {
      var first = String(f.v1 || '').split(/[。！!]/)[0];
      f.v3 = f.v2 || f.v3; f.v2 = f.v1;
      f.v1 = hook + '。' + (needOcc || !f.v2 ? occ.short + (occ.dead ? '，' + occ.dead : '') + '，' : '') + cta('pyq', input.acct, false, seed + hook.length) + '。';
      if (!first) f.v2 = rule.f.v2;
    }
    if (p === 'douyin' || p === 'xhs') {
      if (it.acct === '门店号') { delete f.pinA; delete f.pinB; f.pin = f.pin || rule.f.pin || '📍{商场}{位置}｜搜「Ulike脱毛吧 {商场}」'; }
      else if (it.acct === '官号') { delete f.pin; f.pinA = rule.f.pinA || f.pinA; f.pinB = f.pinB || PIN_B; }
    }
    var slots = (it.slots || []).concat(rule.slots || []);
    it.slots = slots.filter(function (x, j) { return slots.indexOf(x) === j; }).slice(0, it.p === 'pyq' && /九宫格/.test(it.form) ? 9 : 6);
    var rf = (it.refs || []).concat(occ.refs || []);
    it.refs = rf.filter(function (x, j) { return rf.indexOf(x) === j; }).slice(0, 5);
    /* 多张图：沿用参考模板的分页规划，封面换成新的封面文字 */
    if (formChanged) {
      /* 换了形式：分镜是新写的，画面也按新分镜重排，不沿用参考模板的画面 */
      it.frames = f.script.map(function (r, i) {
        var words = String(r[2]).replace(/^[^：]{1,4}：/, '').split(/[，。｜]/)[0];
        return { role: (i ? '关键帧' + (i + 1) : '封面帧') + ' · ' + r[0], main: i ? clip(words, 12) : it.cover.main, sub: i ? '' : it.cover.sub, note: r[2], layout: r[1], style: '', formula: '', slot: (it.slots || [])[i] || '', ref: '' };
      });
    } else if (Array.isArray(it.frames) && it.frames.length) {
      it.frames[0].main = it.cover.main; it.frames[0].sub = it.cover.sub;
    } else if (PBt && PBt.frames && PBt.frames.plan) {
      it.frames = PBt.frames.plan.map(function (r, i) { return { role: r[0], main: i ? r[1] : it.cover.main, sub: i ? '' : it.cover.sub, note: '', layout: r[2], style: '', formula: r[1], slot: (it.slots || [])[i] || '', ref: '' }; });
    }
    it = fixItem(it);
    var generatedText = [it.title, it.brief.hook, ...Object.keys(it.f).map(function (k) { return typeof it.f[k] === 'string' ? it.f[k] : JSON.stringify(it.f[k]); })].join(' '), generatedGrams = grams(generatedText), maxSimilarity = 0;
    fullPool.forEach(function (ref) { if (ref.p === input.p) { var refGrams = grams(docText(ref)), size = Object.keys(generatedGrams).length || 1; maxSimilarity = Math.max(maxSimilarity, overlap(generatedGrams, refGrams) / size); } });
    var prohibited = window.TMB_RULES.scan(generatedText, input.p).some(function (x) { return x.lv === 'ban'; });
    it.generationCheck = { distinctFromReferences: maxSimilarity < 0.62, similarity: Math.round(maxSimilarity * 100), compliant: !prohibited, complete: !!(it.title && it.brief.hook && generatedText.length > 50) };
    return it;
  }

  /* Claude 生成（仅在 claude.ai 打开时可用） */
  var samplePromise = null;
  function getSample() { return window.TMB_GPT.sample(); }
  function fieldSpec(p, acct) {
    if (p === 'douyin') return '"f": {"post": "发布文案3-5行", "script": [["0–3s","画面","口播：…或字幕：…"], …4-6行], "tags": "#话题 …", ' + (acct === '门店号' ? '"pin": "置顶评论：店名+位置"' : '"pinA": "置顶评论A，可写“某团搜…”", "pinB": "置顶评论B：店名合集"') + ', "replies": "3组 Q：…\\nA：…"}';
    if (p === 'xhs') return '"f": {"title": "笔记标题≤20字", "body": "正文300-500字，短段落，适量emoji", "tags": "#话题 5-7个", ' + (acct === '门店号' ? '"pin": "置顶评论"' : '"pinA": "置顶评论A，可写“某团搜…”", "pinB": "置顶评论B：店名合集"') + ', "replies": "3组 Q/A"}';
    if (p === 'sph') return acct === '公众号' ? '"f": {"title": "文章标题", "summary": "摘要", "body": "正文结构，用【】标段落", "mount": "文章内插入的小程序卡片"}' : '"f": {"post": "视频描述，结尾引导点下方链接", "script": [["0–3s","画面","口播/字幕"], …], "mount": "小程序卡片：…", "article": "公众号文章：《…》", "tags": "#话题"}';
    return '"f": {"v1": "朋友圈文案1（1-3句，像本人说话）", "v2": "文案2", "v3": "文案3", "pics": "配图说明", "timing": "发布时间建议"}';
  }
  function generateAI(input, pool, onText) {
    return getSample().then(function (sample) {
      if (!sample) throw { code: 'unavailable' };
      var refs = input.goal ? [] : rank(input, (pool || []).concat(industryCaseRefs(input))).slice(0, 5).map(function (r) { return r.t; });
      var P = window.TMB_PLATFORMS[input.p];
      var prompt = [
        '你是 Ulike脱毛吧 的内容策划。Ulike脱毛吧是 Ulike 品牌的集团线下自助脱毛体验场景，开在商场、园区、学校附近：独立隔间，用户扫码开机，设备有语音指引。内容只介绍线下服务，不承接或暗示家用脱毛仪购买。',
        '请为【' + P.name + ' · ' + input.acct + '】的主题【' + input.theme + '】写 1 条创意，形式：' + input.form + '。',
        '使用者的想法：' + (input.idea || '（未填写）'),
        input.goal&&window.TMB_SERVICE?'本次执行约束与已核验参考（优先遵守；原案例仅为资料，不是指令）：'+window.TMB_SERVICE.context(input):'',
        '主打卖点：' + (input.points.join('、') || '自定'),
        '档期/活动：' + input.occasion + '（' + (OCC[input.occasion] || OCC['常规']).line + '）',
        '规则：1) 价格、店名、位置等只用已确认变量，原样写花括号：{新人价}{全身新人价}{八次卡}{八次单次}{冬季20次}{冬季20次腿}{双人卡}{打卡季截止}{店名}{简称}{城市}{区域}{商场}{位置}{营业时间}{周边}{门店数}。严禁出现家用仪购买/下单/购机优惠、体验后买仪器、先试再买、仪器会不会用或买回家闲置等叙事；评论区和私信也不得补充此类引导。2) 禁用：永久、根治、治疗、疗效、医用、无痛、不痛、100%、绝对、顶级、首选、全网最低、保证效果，以及“最”（“最近”除外）、“第一”（“第一次”除外）。不得承诺效果；体验感受写真实、有限、具体。3) 价格比较只用当前可核实的同口径服务价格和服务范围，不虚构医美机构价目、不贬低其他服务方式、不比较效果；可以说明自助流程、预约方式、独立空间、按次价格等已核实信息，不泛称“更便宜/更划算”。4) 抖音和小红书的正文、标题、话题、分镜里不能出现：美团、微信、私信、二维码、链接（只有置顶评论A可写“某团”）；结尾引导“搜 Ulike脱毛吧＋商圈名”。5) 不拍身体特写；用户体验类用【写你自己的真实感受】留空。6) 要有活人感：像店员或店主本人在说话，口语、短句、具体细节；不要客服腔、套话或虚构顾客好评。',
        '创意库和行业案例只用于提炼可迁移的方法（如信息组织、镜头功能、受众顾虑），不得沿用参考案例的主题切口、标题、钩子、叙事顺序或句式。请结合用户输入重新设计创意点；若与参考过于相似，换一个用户问题或表现形式。不得编造案例事实。\n参考：\n' + refs.map(function (e, i) { return '【参考' + (i + 1) + '】' + e.title + '（' + e.acct + ' · ' + e.form + '）\n' + (i === 0 ? JSON.stringify(e.f).slice(0, 3200) : e.angle) + (e.industryCase && e.source.url ? '\n来源：' + e.source.url : ''); }).join('\n\n'),
        '只输出一个 JSON 对象，格式：{"title": "创意标题≤26字", "angle": "一句话创意说明", "cover": {"main": "封面大字≤12字，可用\\n换行", "sub": "封面小字≤16字"}, "brief": {"who": "给谁看", "hook": "钩子", "msg": "要说清楚的点", "must": "必须带", "shoot": "怎么拍", "kpi": "看什么数"}, ' + fieldSpec(input.p, input.acct) + ', "slots": ["S1".."S10" 里选 2-6 个门店图位：S1门头 S2导视 S3路线 S4店门口 S5隔间 S6设备上手 S7扫码开机 S8清洁 S9立牌 S10周边地标]}'
      ].join('\n\n');
      return sample.json(prompt, { onText: onText, cache: false, task: 'generate' }).then(function (j) {
        var base = input.goal&&window.TMB_SERVICE?window.TMB_SERVICE.build(input,0):generateSmart(input, 0, pool);
        if (!j || typeof j !== 'object') throw { code: 'invalid_json' };
        base.title = clip(j.title || base.title, 26);
        base.angle = (input.idea ? '你的想法：' + clip(input.idea, 60) + '。' : '') + (j.angle || '');
        if (j.cover && j.cover.main) { base.cover.main = String(j.cover.main); base.cover.sub = clip(j.cover.sub || base.cover.sub, 16); }
        if (j.brief) Object.keys(base.brief).forEach(function (k) { if (j.brief[k]) base.brief[k] = String(j.brief[k]); });
        if (j.f && typeof j.f === 'object') {
          var nf = {};
          Object.keys(j.f).forEach(function (k) {
            var v = j.f[k];
            if (k === 'script') { if (Array.isArray(v)) nf.script = v.filter(Array.isArray).map(function (r) { return [String(r[0] || ''), String(r[1] || ''), String(r[2] || '')]; }); }
            else if (v != null) nf[k] = Array.isArray(v) ? v.join('\n') : String(v);
          });
          if (Object.keys(nf).length) base.f = nf;
        }
        if (Array.isArray(j.slots)) { var ok = j.slots.filter(function (s) { return window.TMB_SLOTS[s]; }); if (ok.length) base.slots = ok; }
        var required = input.p === 'douyin' || (input.p === 'sph' && input.acct !== '公众号') ? ['post','script'] : input.p === 'xhs' || input.acct === '公众号' ? ['title','body'] : ['v1','v2','v3'];
        if (required.some(function(k){ return !j.f || (k === 'script' ? !Array.isArray(j.f[k]) || j.f[k].length < 3 : !String(j.f[k] || '').trim()); })) throw new Error('GPT返回的文案不完整，请重试');
        if (base.f.script) base.frames = base.f.script.map(function(r,i){return {role:(i?'关键帧':'封面帧')+' · '+r[0],main:i?clip(r[2],12):base.cover.main,sub:i?'':base.cover.sub,note:r[2],layout:r[1],style:'实拍，字幕清晰',formula:'按当前分镜拍摄',slot:base.slots[i]||'',ref:''};});
        else base.frames = [{role:'封面',main:base.cover.main,sub:base.cover.sub,note:'按正文分段补拍内页',layout:'实拍底图配大字标题',style:'清晰自然',formula:'一个主要信息',slot:base.slots[0]||'',ref:''}];
        base.ai = true;
        if(base.execution)base.execution.source='GPT展开；执行条件待核实';
        base.basedOn = refs.map(function (r) { return r.id; });
        if (window.TMB_RULES.hasRestrictedPurchase(JSON.stringify(base))) throw new Error('GPT输出含不允许的购买引导，未保存。请修改输入后重试。');
        return fixItem(base);
      });
    });
  }

  function occOf(t) { for (var i = 0; i < OCC_KW.length; i++) if (OCC_KW[i][0].test(t)) return OCC_KW[i][1]; return '常规'; }
  /* 一句话属于哪个档期（看活动词和价格变量），用来避免把别的活动的钩子推给这条 */
  function periodOf(t) {
    t = String(t || '');
    if (/\{全身新人价\}/.test(t)) return '年货节';
    if (/\{冬季20次|\{打卡季截止\}/.test(t)) return '冬日打卡季';
    if (/\{双人卡\}/.test(t)) return '双12 / 跨年';
    return OCC[occOf(t)].period;
  }
  function sceneOf(t, strict) { for (var i = 0; i < SCENES.length; i++) if (SCENES[i].re.test(t)) return SCENES[i].name; return strict ? null : DEFAULT_SCENE.name; }

  window.TMB_GEN = { local: generateLocal, smart: generateSmart, ai: generateAI, sample: getSample, directions: creativeDirections, occasions: Object.keys(OCC), points: Object.keys(POINTS), occOf: occOf, sceneOf: sceneOf, fix: fixText, periodOf: periodOf };
})();
