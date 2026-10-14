/* ==========================================
   MIDTERM CONTROL 1 • MODULE FOR PART 4
   Interactive Case Analysis & Market Dynamics
   AlmaU SDTE 2026 • Business Analytics & Economics (BA & ECON)
   Market Structure: Perfect Competition (Sole Scope)
   ========================================== */

let p4Chart1Inst = null;
let p4Chart2Inst = null;

// Базовые профили издержек, масштабируемые под диапазон \$50 / \$35 / \$27
const p4_pcArchetypes = [
    // Архетип 0: Базовый шаг MC ≈ +8..9\$
    [
        { q: 0, tvc: 0,   tc: 80,  mc: null, avc: null, atc: null },
        { q: 1, tvc: 25,  tc: 105, mc: 25,   avc: 25,   atc: 105 },
        { q: 2, tvc: 48,  tc: 128, mc: 23,   avc: 24,   atc: 64 },
        { q: 3, tvc: 78,  tc: 158, mc: 30,   avc: 26,   atc: 53 },
        { q: 4, tvc: 116, tc: 196, mc: 38,   avc: 29,   atc: 49 },
        { q: 5, tvc: 163, tc: 243, mc: 47,   avc: 33,   atc: 49 },
        { q: 6, tvc: 219, tc: 299, mc: 56,   avc: 37,   atc: 50 },
        { q: 7, tvc: 284, tc: 364, mc: 65,   avc: 41,   atc: 52 },
        { q: 8, tvc: 359, tc: 439, mc: 75,   avc: 45,   atc: 55 },
        { q: 9, tvc: 444, tc: 524, mc: 85,   avc: 49,   atc: 58 },
        { q: 10, tvc: 539, tc: 619, mc: 95,   avc: 54,   atc: 62 }
    ],
    // Архетип 1: Сдвинутый минимум AVC
    [
        { q: 0, tvc: 0,   tc: 95,  mc: null, avc: null, atc: null },
        { q: 1, tvc: 28,  tc: 123, mc: 28,   avc: 28,   atc: 123 },
        { q: 2, tvc: 52,  tc: 147, mc: 24,   avc: 26,   atc: 74 },
        { q: 3, tvc: 84,  tc: 179, mc: 32,   avc: 28,   atc: 60 },
        { q: 4, tvc: 124, tc: 219, mc: 40,   avc: 31,   atc: 55 },
        { q: 5, tvc: 173, tc: 268, mc: 49,   avc: 35,   atc: 54 },
        { q: 6, tvc: 231, tc: 326, mc: 58,   avc: 39,   atc: 54 },
        { q: 7, tvc: 298, tc: 393, mc: 67,   avc: 43,   atc: 56 },
        { q: 8, tvc: 374, tc: 469, mc: 76,   avc: 47,   atc: 59 },
        { q: 9, tvc: 460, tc: 555, mc: 86,   avc: 51,   atc: 62 },
        { q: 10, tvc: 556, tc: 651, mc: 96,   avc: 56,   atc: 65 }
    ],
    // Архетип 2: Альтернативный шаг издержек
    [
        { q: 0, tvc: 0,   tc: 70,  mc: null, avc: null, atc: null },
        { q: 1, tvc: 22,  tc: 92,  mc: 22,   avc: 22,   atc: 92 },
        { q: 2, tvc: 43,  tc: 113, mc: 21,   avc: 22,   atc: 57 },
        { q: 3, tvc: 72,  tc: 142, mc: 29,   avc: 24,   atc: 47 },
        { q: 4, tvc: 109, tc: 179, mc: 37,   avc: 27,   atc: 45 },
        { q: 5, tvc: 154, tc: 224, mc: 45,   avc: 31,   atc: 45 },
        { q: 6, tvc: 208, tc: 278, mc: 54,   avc: 35,   atc: 46 },
        { q: 7, tvc: 271, tc: 341, mc: 63,   avc: 39,   atc: 49 },
        { q: 8, tvc: 343, tc: 413, mc: 72,   avc: 43,   atc: 52 },
        { q: 9, tvc: 424, tc: 494, mc: 81,   avc: 47,   atc: 55 },
        { q: 10, tvc: 515, tc: 585, mc: 91,   avc: 52,   atc: 59 }
    ]
];

let p4_pcTableData = [];
let activeMult = 1.0;
let p4_pcCurrentPrice = 0;
let p4_targetBoomQ = 6;
let p4_targetRecessionQ = 4;

function roundInt(val) {
    return val !== null && val !== undefined ? Math.round(val) : null;
}

// ==========================================
// RENDER CASE PART 4
// ==========================================

function renderCaseP4(studentIdx, lang) {
    const container = document.getElementById('part4-container');
    if (!container) return;

    if (p4Chart1Inst) { p4Chart1Inst.destroy(); p4Chart1Inst = null; }
    if (p4Chart2Inst) { p4Chart2Inst.destroy(); p4Chart2Inst = null; }

    const archetypeIdx = studentIdx % 3;
    const baseTable = p4_pcArchetypes[archetypeIdx];
    
    // Распределение оптимальных объемов по студентам (Q* = 6..9 для Бума, Q* = 4..6 для Спада)
    p4_targetBoomQ = 6 + (studentIdx % 4);
    p4_targetRecessionQ = 4 + ((studentIdx + 1) % 3);

    // Вариативные сдвиги: генерируют индивидуальные цены около \$50 / \$35 / \$27
    const priceOffset = (studentIdx * 8) % 9; // Добавляет 0..8 к базовой цене
    const variantShift = (studentIdx * 3) % 7; 
    activeMult = 0.96 + ((studentIdx * 2) % 5) * 0.03;

    p4_pcTableData = baseTable.map(d => ({
        q: d.q,
        tvc: roundInt((d.tvc + variantShift) * activeMult),
        tc: roundInt((d.tc + variantShift) * activeMult),
        mc: roundInt((d.mc ? d.mc + variantShift * 0.1 : null) * activeMult),
        avc: roundInt((d.avc ? d.avc + variantShift * 0.1 : null) * activeMult),
        atc: roundInt((d.atc ? d.atc + variantShift * 0.1 : null) * activeMult)
    }));

    // Автоматическая подгонка цены Бума к диапазону ~\$50-\$58, Спада к ~\$32-\$40, Кризиса к ~\$22-\$29
    const baseBoomMc = p4_pcTableData[p4_targetBoomQ].mc || 50;
    const baseRecMc = p4_pcTableData[p4_targetRecessionQ].mc || 35;

    const pBoomInt = roundInt(baseBoomMc + (priceOffset % 4)); 
    const pRecInt = roundInt(baseRecMc + (priceOffset % 3));  
    
    // Порог закрытия: цена ниже минимального AVC на \$8..10
    let minAvc = 999;
    p4_pcTableData.forEach(d => { if (d.avc && d.avc < minAvc) minAvc = d.avc; });
    const pCrisInt = Math.max(18, roundInt(minAvc - 8 - (priceOffset % 3)));

    const caseTitle = {
        en: "Case Strategy: Agro-Industrial Exporter & Market Volatility (Perfect Competition)",
        ru: "Кейс-анализ: Стратегия агроэкспортера и ценовые шоки (Совершенная конкуренция)"
    };

    const instructions = {
        en: `<b>EXECUTIVE TASK (Perfect Competition):</b><br>
            1. Test 3 market price scenarios: <b>Boom</b> (P = $${pBoomInt}), <b>Recession</b> (P = $${pRecInt}), and <b>Crisis</b> (P = $${pCrisInt}).<br>
            2. Examine the cost curves on the charts to select the profit-maximizing or loss-minimizing output <b>Q</b> where <b>MR = MC</b>.<br>
            3. In your essay below, justify your output decisions for all 3 scenarios, calculate economic profit/loss, and explicitly identify the <b>Shutdown Rule</b> threshold.`,
            
        ru: `<b>ЗАДАНИЕ КЕЙСА (Совершенная конкуренция):</b><br>
            1. Протестируйте 3 рыночных сценария цен: <b>Бум</b> (P = $${pBoomInt}), <b>Спад</b> (P = $${pRecInt}) и <b>Кризис</b> (P = $${pCrisInt}).<br>
            2. Анализируйте кривые издержек на графиках, чтобы определить оптимальный объем <b>Q</b> по правилу <b>MR = MC</b>.<br>
            3. В эссе ниже подробно обоснуйте выбор объемов для каждого сценария, рассчитайте экономическую прибыль/убыток и укажите применение <b>Правила закрытия фирмы</b>.`
    };

    const essayHTML = `
        <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 mt-4">
            <div class="flex justify-between items-center">
                <label class="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fas fa-pen-nib text-indigo-400"></i>
                    ${lang === 'en' ? 'Executive Strategy Justification (Min 60 Words)' : 'Стратегическое обоснование (Минимум 60 слов)'}
                </label>
                <span id="p4-word-counter" class="text-[10px] font-mono font-bold text-rose-400">0 / 60 ${lang === 'en' ? 'words' : 'слов'}</span>
            </div>
            
            <textarea id="p4-essay-input" 
                class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 h-44 focus:ring-2 focus:ring-indigo-500 outline-none resize-none custom-scrollbar" 
                placeholder="${lang === 'en' ? 'Write your analysis based on chart curves (MR=MC, ATC, AVC comparison)...' : 'Напишите подробный анализ на основе графиков: укажите пересечение MR=MC для каждого сценария, сравните P с ATC и AVC, рассчитайте прибыль/убытки и примените правило закрытия...'}"
                onpaste="notify('${lang === 'en' ? 'Pasting is disabled. Type manually.' : 'Вставка заблокирована. Введите текст вручную.'}', true); return false;"
                oninput="p4_checkWordCount()"></textarea>
            
            <p class="text-[9px] text-slate-500 leading-tight">
                ${lang === 'en' ? 'Direct copy-paste is disabled. Minimum 60 words required.' : 'Защита от вставки активирована. Для отправки требуется минимум 60 слов.'}
            </p>
        </div>
    `;

    let html = `
    <div class="card p-6 space-y-6 bg-slate-900/90 border border-slate-800">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
            <div>
                <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    ${lang === 'en' ? 'Business Analytics Case • Perfect Competition' : 'Аналитический кейс-симулятор • Совершенная конкуренция'}
                </span>
                <h3 class="text-xl font-black text-white mt-1">${caseTitle[lang]}</h3>
            </div>
            <div class="bg-indigo-950/60 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs text-indigo-300 font-mono font-bold">
                ${lang === 'en' ? 'Student Variant Scale Factor: ' : 'Индивидуальный коэффициент варианта: '}${activeMult.toFixed(2)}x
            </div>
        </div>

        <!-- Task Instructions Box -->
        <div class="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl text-xs text-slate-200 leading-relaxed space-y-1">
            ${instructions[lang]}
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div class="xl:col-span-5 space-y-4">
                <div class="flex flex-wrap gap-2 mb-2">
                    <button onclick="p4_setPcScenario(${pBoomInt})" id="p4-pc-btn-boom" class="scenario-btn bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md">P = $${pBoomInt} (${lang==='en'?'Boom':'Бум'})</button>
                    <button onclick="p4_setPcScenario(${pRecInt})" id="p4-pc-btn-rec" class="scenario-btn bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md">P = $${pRecInt} (${lang==='en'?'Recession':'Спад'})</button>
                    <button onclick="p4_setPcScenario(${pCrisInt})" id="p4-pc-btn-cris" class="scenario-btn bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md">P = $${pCrisInt} (${lang==='en'?'Crisis':'Кризис'})</button>
                </div>

                <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div class="flex justify-between items-center">
                        <label class="text-xs font-bold text-slate-300 uppercase">${lang==='en'?'Production Volume (Q)':'Объем производства (Q)'}</label>
                        <span id="p4-pc-val-q" class="text-lg font-black text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded">0 units</span>
                    </div>
                    <input type="range" id="p4-pc-slider-q" min="0" max="10" value="0" step="1" class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" oninput="p4_updatePcDashboard()">
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800"><span class="text-slate-500 block text-[9px] uppercase">TR</span><span id="p4-pc-val-tr" class="text-white font-bold text-base">$0</span></div>
                    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800"><span class="text-slate-500 block text-[9px] uppercase">TC</span><span id="p4-pc-val-tc" class="text-white font-bold text-base">$0</span></div>
                    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800"><span class="text-slate-500 block text-[9px] uppercase">Price (MR)</span><span id="p4-pc-val-mr" class="text-emerald-400 font-bold text-base">$0</span></div>
                    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800"><span class="text-slate-500 block text-[9px] uppercase">MC</span><span id="p4-pc-val-mc" class="text-amber-400 font-bold text-base">$0</span></div>
                    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800"><span class="text-slate-500 block text-[9px] uppercase">ATC</span><span id="p4-pc-val-atc" class="text-purple-400 font-bold text-base">$0</span></div>
                    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800"><span class="text-slate-500 block text-[9px] uppercase">AVC</span><span id="p4-pc-val-avc" class="text-sky-400 font-bold text-base">$0</span></div>
                </div>

                ${essayHTML}
            </div>

            <div class="xl:col-span-7 space-y-4">
                <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl h-[360px] relative">
                    <canvas id="p4Chart1Canvas"></canvas>
                </div>
                <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl h-[360px] relative">
                    <canvas id="p4Chart2Canvas"></canvas>
                </div>
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;

    setTimeout(() => {
        p4_initPcModule(pBoomInt);
    }, 50);
}

// ==========================================
// LOGIC & CHART CONTROLLERS
// ==========================================

function p4_checkWordCount() {
    const txt = document.getElementById('p4-essay-input').value.trim();
    const words = txt ? txt.split(/\s+/).length : 0;
    const counter = document.getElementById('p4-word-counter');
    if (counter) {
        counter.innerText = `${words} / 60 ${typeof currentLang !== 'undefined' && currentLang === 'en' ? 'words' : 'слов'}`;
        counter.className = words >= 60 ? "text-[10px] font-mono font-bold text-emerald-400" : "text-[10px] font-mono font-bold text-rose-400";
    }
}

function p4_initPcModule(defaultBoomPrice) {
    const ctx1 = document.getElementById('p4Chart1Canvas').getContext('2d');
    p4Chart1Inst = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: p4_pcTableData.map(d => d.q),
            datasets: [
                { label: 'TR (Total Revenue)', data: [], borderColor: '#3b82f6', borderWidth: 3 },
                { label: 'TC (Total Cost)', data: p4_pcTableData.map(d => d.tc), borderColor: '#f43f5e', borderWidth: 3 }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { title: { display: true, text: 'Valuation & Dynamic Cost Curves (TR / TC)', color: '#fff' } }, 
            scales: { y: { grid: { color: '#1e293b' } }, x: { grid: { color: '#1e293b' } } } 
        }
    });

    const ctx2 = document.getElementById('p4Chart2Canvas').getContext('2d');
    p4Chart2Inst = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: p4_pcTableData.map(d => d.q),
            datasets: [
                { label: 'Market Price (P = MR)', data: [], borderColor: '#10b981', borderDash: [5, 5], borderWidth: 3 },
                { label: 'MC (Marginal Cost)', data: p4_pcTableData.map(d => d.mc), borderColor: '#f59e0b', borderWidth: 3 },
                { label: 'ATC (Average Total Cost)', data: p4_pcTableData.map(d => d.atc), borderColor: '#a855f7', borderWidth: 2 },
                { label: 'AVC (Average Variable Cost)', data: p4_pcTableData.map(d => d.avc), borderColor: '#38bdf8', borderWidth: 2 }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { title: { display: true, text: 'Marginal & Average Unit Costs (P / MC / ATC / AVC)', color: '#fff' } }, 
            scales: { y: { grid: { color: '#1e293b' } }, x: { grid: { color: '#1e293b' } } } 
        }
    });

    p4_setPcScenario(defaultBoomPrice);
}

function p4_setPcScenario(price) {
    p4_pcCurrentPrice = price;

    p4Chart1Inst.data.datasets[0].data = p4_pcTableData.map(d => roundInt(d.q * price));
    p4Chart1Inst.update();
    p4Chart2Inst.data.datasets[0].data = p4_pcTableData.map(d => price);
    p4Chart2Inst.update();

    p4_updatePcDashboard();
}

function p4_updatePcDashboard() {
    const q = parseInt(document.getElementById('p4-pc-slider-q').value);
    const data = p4_pcTableData[q];
    const tr = roundInt(q * p4_pcCurrentPrice);

    document.getElementById('p4-pc-val-q').innerText = `${q} units`;
    document.getElementById('p4-pc-val-tr').innerText = `$${tr}`;
    document.getElementById('p4-pc-val-tc').innerText = `$${data.tc}`;
    document.getElementById('p4-pc-val-mr').innerText = `$${p4_pcCurrentPrice}`;
    document.getElementById('p4-pc-val-mc').innerText = data.mc ? `$${data.mc}` : '-';
    document.getElementById('p4-pc-val-atc').innerText = data.atc ? `$${data.atc}` : '-';
    document.getElementById('p4-pc-val-avc').innerText = data.avc ? `$${data.avc}` : '-';
}

// ==========================================
// AUTOMATED SLIDER SCORING FOR PART 4
// ==========================================

function p4_getSliderScore() {
    if (typeof currentStudentIdx === 'undefined' || currentStudentIdx === -1) return 0;
    
    const q = parseInt(document.getElementById('p4-pc-slider-q')?.value || 0);
    const mcBoom = p4_pcTableData[p4_targetBoomQ].mc;
    const mcRecession = p4_pcTableData[p4_targetRecessionQ].mc;

    if (Math.abs(p4_pcCurrentPrice - mcBoom) < 3) {
        return q === p4_targetBoomQ ? 10 : (Math.abs(q - p4_targetBoomQ) === 1 ? 5 : 0);
    } 
    else if (Math.abs(p4_pcCurrentPrice - mcRecession) < 3) {
        return q === p4_targetRecessionQ ? 10 : (Math.abs(q - p4_targetRecessionQ) === 1 ? 5 : 0);
    } 
    else {
        return q === 0 ? 10 : 0;
    }
}
