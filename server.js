const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if(!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify({codes:{}, attempts:{}, users:{}}));

function loadStore(){
  try{ return JSON.parse(fs.readFileSync(STORE_FILE,'utf8')) }catch(e){ return {codes:{}, attempts:{}, users:{}} }
}
function saveStore(s){ fs.writeFileSync(STORE_FILE, JSON.stringify(s,null,2)); }

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

function isPhone(v){ return /^\d{11}$/.test(v); }
function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

// send-code: 记录发送次数（24h 内 <=3），生成 6 位码，存储 10 分钟
app.post('/api/send-code', async (req, res) =>{
  const { account } = req.body || {};
  if(!account) return res.status(400).json({ ok:false, message:'缺少 account' });
  if(!isPhone(account) && !isEmail(account)) return res.status(400).json({ ok:false, message:'account 格式错误' });

  const store = loadStore();
  const now = Date.now();
  const day = 24*60*60*1000;
  store.attempts[account] = (store.attempts[account] || []).filter(ts => now - ts < day);
  if(store.attempts[account].length >= 3) return res.status(429).json({ ok:false, message:'24 小时内发送次数已达上限（3 次）' });

  const code = Math.floor(100000 + Math.random()*900000).toString();
  store.attempts[account].push(now);
  store.codes[account] = { code, ts: now, expires: now + 10*60*1000 };
  saveStore(store);

  // 如果用户配置了 Deepseek API Key，则使用 Deepseek 的 Chat Completions 生成发送内容
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
  const DEEPSEEK_BASE = process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com';
  if(DEEPSEEK_KEY){
    try{
      // 使用 Deepseek Chat Completions（与 OpenAI 兼容的格式）来生成短信/邮件正文
      const prompt = `请为目标用户生成一条简洁的通知文本，告知验证码 ${code}，提示 "此验证码10分钟内有效，切勿泄露给他人"，不要包含其他多余说明。返回纯文本短信内容。`;
      const body = {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个短信内容生成助手，输出简洁的短信文本。' },
          { role: 'user', content: prompt }
        ],
        stream: false
      };

      const resp = await fetch(`${DEEPSEEK_BASE.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      // Deepseek 返回的字段可能与 OpenAI 类似，尝试解析出文本
      let generated = null;
      try{
        if(json && json.choices && json.choices.length){ generated = json.choices[0].message && json.choices[0].message.content; }
        else if(json && json.result) generated = String(json.result);
      }catch(e){ generated = null; }

      // 返回成功并在开发模式中把生成文本回显（生产请不要回显验证码）
      return res.json({ ok:true, message:'验证码已生成（Deepseek 已生成发送文本）', demo: process.env.NODE_ENV === 'development' ? { code, generated } : undefined });
    }catch(err){
      console.error('调用 Deepseek 出错', err);
      // 继续当作本地模拟发送
    }
  }

  // 本地模拟发送：不实际发送，只返回成功，不暴露 code（除非开发模式）
  return res.json({ ok:true, message:'验证码已生成（本地模拟）', demo: process.env.NODE_ENV === 'development' ? { code } : undefined });
});

app.post('/api/verify-code', (req, res) =>{
  const { account, code } = req.body || {};
  if(!account || !code) return res.status(400).json({ ok:false, message:'缺少参数' });
  const store = loadStore();
  const rec = store.codes[account];
  if(!rec) return res.status(400).json({ ok:false, message:'未发送验证码或已过期' });
  if(Date.now() > rec.expires) return res.status(400).json({ ok:false, message:'验证码已过期' });
  if(rec.code !== String(code)) return res.status(400).json({ ok:false, message:'验证码不正确' });
  // 使用一次后删除
  delete store.codes[account];
  saveStore(store);
  return res.json({ ok:true, message:'验证通过' });
});

// 简单注册接口（示例），将用户存储到文件（密码请在客户端或服务端用 bcryptjs 加密）
const bcrypt = require('bcryptjs');
app.post('/api/register', async (req,res)=>{
  const { account, password } = req.body || {};
  if(!account || !password) return res.status(400).json({ ok:false, message:'缺少 account 或 password' });
  const store = loadStore();
  if(store.users[account]) return res.status(400).json({ ok:false, message:'该账号已存在' });
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  store.users[account] = { passwordHash: hash, createdAt: Date.now() };
  saveStore(store);
  return res.json({ ok:true, message:'注册成功（本地）' });
});

app.listen(PORT, ()=>{
  console.log(`Mock API server listening on http://localhost:${PORT}`);
  console.log('Data file:', STORE_FILE);
});
