// 前端交互脚本：校验账号（手机号/邮箱）、密码强度、显示/隐藏密码、发送验证码（倒计时）、图形验证码刷新
(function(){
    // 跳转目标配置：优先使用 URL query 参数 ?redirect=，其次使用 localStorage 中的 'redirect_url'，最后降级为示例占位
    const REDIRECT_URL = (function(){
        try{
            const q = new URLSearchParams(window.location.search).get('redirect');
            if(q) return q;
            const stored = localStorage.getItem('redirect_url');
            if(stored) return stored;
        }catch(e){}
        return '../index1.0.3.html';
    })();

    const account = document.getElementById('account');
    const accountError = document.getElementById('accountError');
    const password = document.getElementById('password');
    const pwdError = document.getElementById('pwdError');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const togglePwd = document.getElementById('togglePwd');
    const sendCode = document.getElementById('sendCode');
    const code = document.getElementById('code');
    const codeError = document.getElementById('codeError');
    const captchaImg = document.getElementById('captchaImg');
    const refreshCaptcha = document.getElementById('refreshCaptcha');
    const form = document.getElementById('authForm');

    // 简单校验器
    function isPhone(v){return /^\d{11}$/.test(v.trim());}
    function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());}

    function validateAccount(){
        const v = account.value.trim();
        if(!v){ accountError.textContent = '账号不能为空'; return false; }
        if(isPhone(v) || isEmail(v)){ accountError.textContent = ''; return true; }
        accountError.textContent = '请输入有效的 11 位手机号或包含 @ 的邮箱';
        return false;
    }

    function calcStrength(pwd){
        let score = 0;
        if(pwd.length >= 8) score += 1;
        if(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
        if(/\d/.test(pwd)) score += 1;
        if(/[^A-Za-z0-9]/.test(pwd)) score += 1;
        return Math.min(score,4);
    }

    function updateStrength(){
        const v = password.value || '';
        const s = calcStrength(v);
        const percent = (s/4)*100;
        strengthBar.style.setProperty('--width', percent + '%');
        strengthBar.querySelector('::after');
        // 直接操作伪元素宽度
        strengthBar.style.setProperty('--strength-percent', percent + '%');
        // 退而求其次，通过修改 style of ::after 不能直接，这里改用 width style on a child element
        // 使用内联伪元素替代：直接设置 transform via custom background-size
        strengthBar.style.background = '#eee';
        strengthBar.querySelector('::after');
        // 通过把 after 的宽度模拟：创建/更新内子元素
        let inner = strengthBar.querySelector('.inner');
        if(!inner){ inner = document.createElement('div'); inner.className = 'inner'; inner.style.height='100%'; inner.style.borderRadius='6px'; inner.style.transition='width .25s'; strengthBar.appendChild(inner); }
        inner.style.width = percent + '%';
        if(s<=1){ inner.style.background = '#f87171'; strengthText.textContent='弱'; }
        else if(s===2){ inner.style.background = '#f59e0b'; strengthText.textContent='中'; }
        else if(s>=3){ inner.style.background = '#10b981'; strengthText.textContent='强'; }
        if(!v) strengthText.textContent='-';

        // 密码规则提示
        if(v && (v.length < 8 || v.length > 20)){
            pwdError.textContent = '密码长度应为 8-20 位';
            return false;
        }
        pwdError.textContent = '';
        return true;
    }

    // 切换显示/隐藏密码
    togglePwd.addEventListener('click', ()=>{
        const t = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', t);
        togglePwd.innerHTML = t === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    account.addEventListener('input', validateAccount);
    password.addEventListener('input', updateStrength);

    // 发送验证码：优先调用本地 /api/send-code；若失败则回退到前端模拟
    function startCountdown(button, seconds){
        let s = seconds;
        button.disabled = true;
        const original = button.textContent;
        button.textContent = `${s}s 后重发`;
        const timer = setInterval(()=>{
            s -= 1;
            if(s<=0){ clearInterval(timer); button.disabled = false; button.textContent = original; }
            else button.textContent = `${s}s 后重发`;
        },1000);
    }

    async function trySendCodeToServer(acc){
        try{
            const resp = await fetch('/api/send-code', {
                method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ account: acc })
            });
            const data = await resp.json();
            if(resp.ok && data.ok){
                // 如果服务器在开发模式返回 demo 字段，展示给开发者（仅用于本地调试）
                if(data.demo) console.log('服务器返回模拟码（开发模式）：', data.demo);
                return { ok:true, message: data.message };
            }
            return { ok:false, message: data && data.message ? data.message : '发送失败' };
        }catch(err){
            return { ok:false, message: '无法连接到本地 API，已使用前端模拟' };
        }
    }

    sendCode.addEventListener('click', async ()=>{
        const acc = account.value.trim();
        if(!acc){ accountError.textContent='请先输入手机号或邮箱'; account.focus(); return; }
        if(!isPhone(acc) && !isEmail(acc)){ accountError.textContent='请输入有效的 11 位手机号或邮箱'; account.focus(); return; }
        accountError.textContent = '';
        codeError.textContent = '';

        // 优先调用本地后端
        const result = await trySendCodeToServer(acc);
        if(result.ok){
            startCountdown(sendCode, 60);
            codeError.textContent = result.message || '验证码已发送';
            // 不在前端存真实验证码（安全）；若服务器不可用，会回退下面的模拟逻辑
            return;
        }

        // 回退：前端模拟（离线模式）
        const simulated = Math.floor(100000 + Math.random()*900000).toString();
        sessionStorage.setItem('sim_code_for_'+acc, JSON.stringify({code: simulated, ts: Date.now()}));
        console.log('前端模拟发送验证码给', acc, '码为', simulated);
        startCountdown(sendCode, 60);
        codeError.textContent = '验证码已发送（前端模拟）';
    });

    // 刷新图形验证码（仅替换 URL）
    refreshCaptcha.addEventListener('click', ()=>{
        const src = captchaImg.src.split('?')[0];
        captchaImg.src = src + '?t=' + Date.now();
    });

    // 表单提交：优先调用后端 /api/verify-code，再可选调用 /api/register
    // 简化行为：无后端时直接跳转到可视化页面（满足“点击登录/注册按钮直接跳转”的需求）
    form.addEventListener('submit', (e)=>{
        e.preventDefault();
        // 直接导航到配置的重定向地址（优先 query 或 localStorage），不进行阻塞性校验
        window.location.href = REDIRECT_URL;
    });

    // 初始化：确保 strength inner 元素存在（以便样式生效）
    document.addEventListener('DOMContentLoaded', ()=>{ updateStrength(); });

})();
