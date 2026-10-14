/* ==========================================================================
   grading_ai_engine.js — Grading & Auto-Submit Engine
   AlmaU SDTE 2026 | Course: Microeconomics
   Group: Business Analytics & Economics (BA & ECON)
   ========================================================================== */

const GOOGLE_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbz-fH9jFhcBpC0g5DFh9mKhB9wSo4WKtYNsa1-Cqv06ND1-0GbNemCR4VH1j2uUefAY/exec";

function verifyTeacherKey() {
    toggleModal('teacher-modal', false);
    const profPanel = document.getElementById('prof-grade-panel');
    if (profPanel) {
        profPanel.classList.remove('hidden');
    }
    notify(currentLang === 'en' ? "Professor panel unlocked!" : "Панель преподавателя разблокирована!");
}

// ==========================================
// КОМПИЛЯЦИЯ И РАСЧЕТ ИТОГОВОГО БАЛЛА
// ==========================================

function compileFinalToken() {
    if (typeof currentStudentIdx === 'undefined' || currentStudentIdx === -1) {
        notify(currentLang === 'en' ? "Please select your name first!" : "Сначала выберите свое ФИО!", true);
        return;
    }

    // -------------------------------------------------------------------------
    // ЧАСТЬ 1 И ЧАСТЬ 2: ТЕСТЫ (10 вопросов x 3 балла = 30 баллов MAX)
    // -------------------------------------------------------------------------
    const p1_p2_answers = {};
    let scoreP1P2 = 0;

    document.querySelectorAll('#part1-container input:checked, #part2-container input:checked').forEach(input => {
        p1_p2_answers[input.name] = input.value;
        if (input.dataset.ans && input.value === input.dataset.ans) {
            scoreP1P2 += 3;
        }
    });

    // -------------------------------------------------------------------------
    // ЧАСТЬ 3: ЗАДАЧИ И ТАБЛИЦА (30 баллов MAX)
    // -------------------------------------------------------------------------
    const p3_answers = {};
    document.querySelectorAll('#part3-container input[type="number"], #part3-container input[type="text"]').forEach(input => {
        p3_answers[input.id] = input.value.trim();
    });

    let scoreP3 = 0;

    // Задача 3.1 — 5 баллов
    const t1Input = document.getElementById('ans-t1');
    if (t1Input && t1Input.value.trim() !== '') {
        const val1 = parseFloat(t1Input.value.replace(',', '.'));
        const exp1 = parseFloat(t1Input.dataset.expected);
        if (!isNaN(val1) && Math.abs(val1 - exp1) < 1) {
            scoreP3 += 5;
        }
    }

    // Задача 3.2 — 5 баллов
    const t2TcInput = document.getElementById('ans-t2-tc');
    const t2McInput = document.getElementById('ans-t2-mc');
    let t2TcCorrect = false, t2McCorrect = false;

    if (t2TcInput && t2TcInput.value.trim() !== '') {
        const val2Tc = parseFloat(t2TcInput.value.replace(',', '.'));
        const exp2Tc = parseFloat(t2TcInput.dataset.expected);
        if (!isNaN(val2Tc) && Math.abs(val2Tc - exp2Tc) < 1) t2TcCorrect = true;
    }
    if (t2McInput && t2McInput.value.trim() !== '') {
        const val2Mc = parseFloat(t2McInput.value.replace(',', '.'));
        const exp2Mc = parseFloat(t2McInput.dataset.expected);
        if (!isNaN(val2Mc) && Math.abs(val2Mc - exp2Mc) < 1) t2McCorrect = true;
    }
    if (t2TcCorrect && t2McCorrect) scoreP3 += 5;
    else if (t2TcCorrect || t2McCorrect) scoreP3 += 2.5;

    // Задача 3.3 — 5 баллов
    const t3Input = document.getElementById('ans-t3');
    if (t3Input && t3Input.value.trim() !== '') {
        const val3 = parseFloat(t3Input.value.replace(',', '.'));
        const exp3 = parseFloat(t3Input.dataset.expected);
        if (!isNaN(val3) && Math.abs(val3 - exp3) < 0.2) {
            scoreP3 += 5;
        }
    }

    // Задача 3.4 (Таблица + График + Q*) — 15 баллов MAX
    const tableInputs = document.querySelectorAll('#part3-container table input');
    let filledCells = 0;
    let totalCells = tableInputs.length || 1;
    tableInputs.forEach(inp => { if (inp.value.trim() !== '') filledCells++; });
    const fillRatio = filledCells / totalCells;

    // 5 баллов за заполнение таблицы
    if (fillRatio >= 0.85) scoreP3 += 5;
    else if (fillRatio >= 0.50) scoreP3 += 3;

    // 5 баллов за рендеринг графика на Chart.js
    if (typeof costChartInstance !== 'undefined' && costChartInstance !== null) {
        scoreP3 += 5;
    }

    // 5 баллов за точный отыск Q* (где P >= MC / минимум ATC)
    const t4qInput = document.getElementById('ans-t4-q');
    if (t4qInput && t4qInput.value.trim() !== '') {
        const val4 = parseInt(t4qInput.value);
        const exp4 = parseInt(t4qInput.dataset.expected);
        if (!isNaN(val4) && val4 === exp4) {
            scoreP3 += 5;
        }
    }

    // -------------------------------------------------------------------------
    // ЧАСТЬ 4: КЕЙС И ЭССЕ СЦЕНАРИЕВ (40 баллов MAX)
    // -------------------------------------------------------------------------
    const p4_essay = document.getElementById('p4-essay-input') ? document.getElementById('p4-essay-input').value.trim() : "";
    const p4_words = p4_essay ? p4_essay.split(/\s+/).length : 0;
    const lowerEssay = p4_essay.toLowerCase();

    // Проверка лимита слов
    if (p4_words < 60) {
        notify(currentLang === 'en' 
            ? `Part 4 analysis requires at least 60 words (Current: ${p4_words}).` 
            : `Анализ в Part 4 должен содержать не менее 60 слов (Сейчас: ${p4_words}).`, true);
        return;
    }

    // 1. Оценка выставления ползунка Q* (10 баллов MAX)
    let sliderScore = (typeof p4_getSliderScore === 'function') ? p4_getSliderScore() : 10;

    // 2. Смысловая оценка 3 сценариев в тексте (30 баллов MAX)
    // 10 баллов за Бум (максимизация прибыли)
    // 10 баллов за Спад (минимизация убытков, покрытие AVC)
    // 10 баллов за Кризис (правило закрытия фирмы, P < AVC)
    
    let textScore = 0;

    const boomKeywords = ["бум", "прибыль", "максимизац", "выручк", "boom", "profit", "maximize", "revenue"];
    const recessionKeywords = ["спад", "убыток", "минимизац", "покрыва", "переменн", "avc", "recession", "loss", "cover", "variable"];
    const crisisKeywords = ["кризис", "закрыти", "остановк", "прекращени", "ниже avc", "crisis", "shutdown", "close", "below avc"];

    let hasBoom = boomKeywords.some(kw => lowerEssay.includes(kw));
    let hasRecession = recessionKeywords.some(kw => lowerEssay.includes(kw));
    let hasCrisis = crisisKeywords.some(kw => lowerEssay.includes(kw));

    if (hasBoom) textScore += 10;
    if (hasRecession) textScore += 10;
    if (hasCrisis) textScore += 10;

    // Если студент написал развернутый связанный текст с цифрами, но не употребил точные термины
    if (textScore < 15 && p4_words >= 65) {
        textScore = 18;
    }

    let scoreP4 = Math.min(40, sliderScore + textScore);

    // Итоговый балл (MAX 100)
    let calculatedScore = Math.min(100, Math.round(scoreP1P2 + scoreP3 + scoreP4));

    const payload = {
        studentIdx: currentStudentIdx,
        studentName: STUDENTS_LIST[currentStudentIdx],
        timestamp: new Date().toLocaleString(),
        p1_p2: p1_p2_answers,
        p3: p3_answers,
        p4: p4_essay,
        score: calculatedScore
    };

    const jsonStr = JSON.stringify(payload);
    const internalToken = "BA15102026-" + btoa(encodeURIComponent(jsonStr));

    const pStudent = document.getElementById('p-student');
    const pVariant = document.getElementById('p-variant');
    const pTime = document.getElementById('p-time');

    if (pStudent) pStudent.innerText = payload.studentName;
    if (pVariant) pVariant.innerText = `Variant #${currentStudentIdx + 1}`;
    if (pTime) pTime.innerText = payload.timestamp;

    const tokenDisplay = document.getElementById('p-token');
    if (tokenDisplay) tokenDisplay.innerText = internalToken;

    const passportBlock = document.getElementById('passport-block');
    if (passportBlock) passportBlock.classList.remove('hidden');

    sendDirectToGoogleSheet(payload, internalToken);
}

function sendDirectToGoogleSheet(payload, token) {
    if (!GOOGLE_SHEET_WEBAPP_URL) {
        notify(currentLang === 'en' ? "Session completed successfully!" : "Работа успешно завершена!");
        return;
    }

    fetch(GOOGLE_SHEET_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            timestamp: payload.timestamp,
            studentName: payload.studentName,
            variant: payload.studentIdx + 1,
            score: payload.score,
            essay: payload.p4,
            rawToken: token
        })
    }).then(() => {
        notify(currentLang === 'en' ? "Exam recorded in Professor's Gradebook!" : "Работа записана в журнал!");
    }).catch(err => {
        console.error("Sync Error:", err);
    });
}

// ==========================================
// РАСШИФРОВКА И ПРОВЕРКА В ПАНЕЛИ
// ==========================================

function decryptAndScoreToken() {
    const rawToken = document.getElementById('prof-token-input').value.trim();
    if (!rawToken.startsWith("BA15102026-") && !rawToken.startsWith("PE12092026-")) {
        notify(currentLang === 'en' ? "Invalid token format!" : "Неверный формат токена!", true);
        return;
    }

    try {
        const base64Data = rawToken.replace(/^(BA15102026|PE12092026)-/, "");
        const jsonStr = decodeURIComponent(atob(base64Data));
        const data = JSON.parse(jsonStr);

        const decStudent = document.getElementById('dec-student');
        const decVariant = document.getElementById('dec-variant');
        const decScore = document.getElementById('dec-score');
        const decBrief = document.getElementById('dec-brief');

        if (decStudent) decStudent.innerText = data.studentName;
        if (decVariant) decVariant.innerText = `Variant #${data.studentIdx + 1}`;
        if (decScore) decScore.innerText = `${data.score} / 100`;
        if (decBrief) decBrief.innerText = `"${data.p4}"`;

        const gradePanelOutput = document.getElementById('grade-panel-output');
        if (gradePanelOutput) gradePanelOutput.classList.remove('hidden');
        notify(currentLang === 'en' ? "Session decrypted successfully!" : "Данные сессии успешно расшифрованы!");
    } catch (e) {
        notify(currentLang === 'en' ? "Failed to parse session!" : "Ошибка чтения данных!", true);
    }
}
