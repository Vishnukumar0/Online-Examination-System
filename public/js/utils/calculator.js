/* ── Interactive Scientific Calculator Tool ────────────────────── */
const ScientificCalc = (() => {
  let expr = '0';

  function open() {
    expr = '0';
    openModal(`
      <div style="max-width:360px;margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <span style="font-family:var(--font-display);font-size:1.2rem;font-weight:800">🧮 Scientific Calculator</span>
        </div>

        <!-- Calculator Display Screen -->
        <div style="background:#090d16;border:1px solid rgba(255,255,255,0.1);border-radius:var(--r-md);padding:14px;margin-bottom:14px;text-align:right">
          <div id="calc-history" style="font-family:var(--font-code);font-size:0.75rem;color:var(--ink-40);min-height:16px"></div>
          <div id="calc-display" style="font-family:var(--font-code);font-size:1.75rem;font-weight:700;color:#38bdf8;overflow-x:auto;white-space:nowrap">0</div>
        </div>

        <!-- Calculator Buttons Grid -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px" id="calc-keypad">
          <button class="calc-btn fn" onclick="ScientificCalc.input('sin(')">sin</button>
          <button class="calc-btn fn" onclick="ScientificCalc.input('cos(')">cos</button>
          <button class="calc-btn fn" onclick="ScientificCalc.input('tan(')">tan</button>
          <button class="calc-btn op" onclick="ScientificCalc.clear()">AC</button>

          <button class="calc-btn fn" onclick="ScientificCalc.input('sqrt(')">√</button>
          <button class="calc-btn fn" onclick="ScientificCalc.input('^')">xʸ</button>
          <button class="calc-btn fn" onclick="ScientificCalc.input('log(')">log</button>
          <button class="calc-btn op" onclick="ScientificCalc.backspace()">⌫</button>

          <button class="calc-btn" onclick="ScientificCalc.input('(')">(</button>
          <button class="calc-btn" onclick="ScientificCalc.input(')')">)</button>
          <button class="calc-btn fn" onclick="ScientificCalc.input('3.14159')">π</button>
          <button class="calc-btn op" onclick="ScientificCalc.input('/')">÷</button>

          <button class="calc-btn num" onclick="ScientificCalc.input('7')">7</button>
          <button class="calc-btn num" onclick="ScientificCalc.input('8')">8</button>
          <button class="calc-btn num" onclick="ScientificCalc.input('9')">9</button>
          <button class="calc-btn op" onclick="ScientificCalc.input('*')">×</button>

          <button class="calc-btn num" onclick="ScientificCalc.input('4')">4</button>
          <button class="calc-btn num" onclick="ScientificCalc.input('5')">5</button>
          <button class="calc-btn num" onclick="ScientificCalc.input('6')">6</button>
          <button class="calc-btn op" onclick="ScientificCalc.input('-')">−</button>

          <button class="calc-btn num" onclick="ScientificCalc.input('1')">1</button>
          <button class="calc-btn num" onclick="ScientificCalc.input('2')">2</button>
          <button class="calc-btn num" onclick="ScientificCalc.input('3')">3</button>
          <button class="calc-btn op" onclick="ScientificCalc.input('+')">+</button>

          <button class="calc-btn num" onclick="ScientificCalc.input('0')">0</button>
          <button class="calc-btn num" onclick="ScientificCalc.input('.')">.</button>
          <button class="calc-btn fn" onclick="ScientificCalc.input('%')">%</button>
          <button class="calc-btn eq" onclick="ScientificCalc.calculate()">=</button>
        </div>
      </div>
    `);
  }

  function updateDisplay() {
    const disp = document.getElementById('calc-display');
    if (disp) disp.textContent = expr || '0';
  }

  function input(val) {
    if (expr === '0' && !isNaN(val)) {
      expr = val;
    } else {
      expr += val;
    }
    updateDisplay();
    SoundFX.playClick();
  }

  function clear() {
    expr = '0';
    updateDisplay();
    SoundFX.playClick();
  }

  function backspace() {
    if (expr.length > 1) {
      expr = expr.slice(0, -1);
    } else {
      expr = '0';
    }
    updateDisplay();
    SoundFX.playClick();
  }

  function calculate() {
    try {
      const history = document.getElementById('calc-history');
      if (history) history.textContent = expr + ' =';

      let parsed = expr
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/\^/g, '**');

      // Safe eval of arithmetic
      const result = Function(`'use strict'; return (${parsed})`)();
      expr = String(Math.round(result * 1000000) / 1000000);
      updateDisplay();
      SoundFX.playOptionSelect();
    } catch {
      expr = 'Error';
      updateDisplay();
      SoundFX.playWrong();
    }
  }

  return { open, input, clear, backspace, calculate };
})();
