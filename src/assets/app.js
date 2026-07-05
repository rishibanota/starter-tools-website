(() => {
  const SITE_CONFIG = window.SITE_CONFIG || {};

  const SAMPLE_DATA = {
    "json-formatter": '{"name":"ToolMint","plan":"starter","features":["fast","private","browser-side"]}',
    "json-to-csv": '[{"name":"Asha","city":"Mumbai","score":92},{"name":"Ravi","city":"Pune","score":88}]',
    "csv-to-json": 'name,city,score\nAsha,Mumbai,92\nRavi,Pune,88',
    "base64-encoder": 'Hello from ToolMint',
    "base64-decoder": 'SGVsbG8gZnJvbSBUb29sTWludA==',
    "url-encoder": 'https://example.com/search?q=hello world&city=Mumbai',
    "url-decoder": 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%2520world%26city%3DMumbai',
    "case-converter": 'this is a sample heading for your next blog post',
    "slug-generator": 'This is a sample heading for your next blog post!',
    "sha256-generator": 'hash this text',
    "jwt-decoder": 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiVGVzdCBVc2VyIiwicm9sZSI6Im1lbWJlciIsImlhdCI6MTcxNzIwMDAwMH0.signature',
    "timestamp-converter": '1719907200'
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  async function copyText(text, trigger) {
    try {
      await navigator.clipboard.writeText(text);
      flashButton(trigger, 'Copied');
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      flashButton(trigger, 'Copied');
    }
  }

  function flashButton(button, label) {
    if (!button) return;
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = label;
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  }

  function downloadText(filename, text, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function setStatus(root, message, type = 'info') {
    const node = qs('[data-status]', root);
    if (!node) return;
    node.textContent = message;
    node.dataset.type = type;
  }

  async function withProgress(root, steps, task) {
    const progressCard = qs('[data-progress-card]', root);
    const progressBar = qs('[data-progress-bar]', root);
    const progressText = qs('[data-progress-text]', root);
    const progressHint = qs('[data-progress-hint]', root);
    const workingNote = qs('[data-working-note]', root);
    if (progressCard) progressCard.hidden = false;
    if (workingNote) workingNote.hidden = false;
    let pct = 8;
    let stepIndex = 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (progressText) progressText.textContent = steps[0] || 'Starting...';
    if (progressHint) progressHint.textContent = 'Everything is processed locally in your browser.';

    const timer = setInterval(() => {
      pct = Math.min(92, pct + Math.random() * 16);
      if (progressBar) progressBar.style.width = `${pct.toFixed(0)}%`;
      stepIndex = (stepIndex + 1) % steps.length;
      if (progressText) progressText.textContent = steps[stepIndex];
      if (progressHint) {
        progressHint.textContent = [
          'Tip: users trust tools more when you explain what is happening.',
          'Privacy note: this starter kit keeps most data on the device.',
          'UX note: a short progress state can improve perceived speed.'
        ][stepIndex % 3];
      }
    }, 280);

    const started = performance.now();
    try {
      const result = await task();
      const elapsed = performance.now() - started;
      if (elapsed < 900) await sleep(900 - elapsed);
      clearInterval(timer);
      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Finished successfully';
      if (progressHint) progressHint.textContent = 'You can copy or download the result below.';
      return result;
    } catch (error) {
      clearInterval(timer);
      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Stopped because something needs attention';
      if (progressHint) progressHint.textContent = error.message || 'Please check your input and try again.';
      throw error;
    }
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  function csvToJson(csv) {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('Please include a header row and at least one data row.');
    const headers = parseCSVLine(lines[0]).map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      return row;
    });
  }

  function flattenObject(input, prefix = '', out = {}) {
    Object.entries(input || {}).forEach(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flattenObject(value, nextKey, out);
      } else {
        out[nextKey] = Array.isArray(value) ? JSON.stringify(value) : value;
      }
    });
    return out;
  }

  function jsonToCsv(value) {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) throw new Error('Please provide a JSON array of objects.');
    const rows = parsed.map((item) => flattenObject(item));
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const escaped = (val) => {
      const raw = val == null ? '' : String(val);
      if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    };
    const lines = [headers.join(',')];
    rows.forEach((row) => {
      lines.push(headers.map((h) => escaped(row[h] ?? '')).join(','));
    });
    return lines.join('\n');
  }

  function titleCase(text) {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word ? word[0].toUpperCase() + word.slice(1) : '')
      .join(' ');
  }

  function sentenceCase(text) {
    const trimmed = text.trim().toLowerCase();
    return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed;
  }

  function slugify(text) {
    return text
      .normalize('NFKD')
      .replace(/[\u0300-\u036F]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function decodeBase64Unicode(input) {
    const bin = atob(input);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64Unicode(input) {
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }

  function decodeJwt(token) {
    const [header, payload] = token.split('.');
    if (!header || !payload) throw new Error('Please paste a valid JWT with header.payload.signature format.');
    const normalize = (part) => part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return {
      header: JSON.parse(decodeBase64Unicode(normalize(header))),
      payload: JSON.parse(decodeBase64Unicode(normalize(payload)))
    };
  }

  function formatTimestamp(value) {
    const digitsOnly = String(value).trim();
    if (!/^\d+$/.test(digitsOnly)) throw new Error('Please enter a numeric Unix timestamp.');
    const ms = digitsOnly.length >= 13 ? Number(digitsOnly) : Number(digitsOnly) * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) throw new Error('That timestamp does not look valid.');
    return {
      iso: date.toISOString(),
      local: date.toLocaleString(),
      utc: date.toUTCString(),
      milliseconds: ms,
      seconds: Math.floor(ms / 1000)
    };
  }

  function dateTimeLocalValue(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load the selected image.'));
      img.src = dataUrl;
    });
  }

  async function resizeImage(file, width, format, quality) {
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);
    const ratio = width / img.width;
    const height = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const outUrl = canvas.toDataURL(mime, format === 'png' ? undefined : quality);
    return { outUrl, width, height, originalWidth: img.width, originalHeight: img.height };
  }

  function renderSharedShell(title = 'Tool workspace') {
    return `
      <div class="workspace-head">
        <h3>${title}</h3>
        <p class="muted">Clear input, friendly actions, and small progress messages help users feel safe and in control.</p>
      </div>
      <div class="progress-card" data-progress-card hidden>
        <div class="progress-meta">
          <strong data-progress-text>Preparing...</strong>
          <span data-working-note hidden>Working locally on your device</span>
        </div>
        <div class="progress-track"><div class="progress-bar" data-progress-bar></div></div>
        <p class="muted" data-progress-hint>Your data stays in your browser.</p>
      </div>
      <p class="status-text" data-status>Ready. This tool works locally in your browser.</p>
    `;
  }

  function renderTextTool(root, tool, options) {
    root.innerHTML = `
      ${renderSharedShell(tool.title)}
      <div class="tool-workspace">
        <div class="field-group">
          <label for="tool-input">Input</label>
          <textarea id="tool-input" class="big-textarea" placeholder="Paste or type here..."></textarea>
        </div>
        ${options.extraControls || ''}
        <div class="action-row">
          <button class="btn btn-primary" data-run>${options.runLabel || 'Run tool'}</button>
          <button class="btn btn-secondary" data-sample>Load example</button>
          <button class="btn btn-secondary" data-clear>Clear</button>
        </div>
        <div class="field-group">
          <div class="output-head">
            <label for="tool-output">Output</label>
            <div class="mini-actions">
              <button class="mini-btn" data-copy>Copy</button>
              <button class="mini-btn" data-download>Download</button>
            </div>
          </div>
          <textarea id="tool-output" class="big-textarea output" placeholder="Your result will appear here..." readonly></textarea>
        </div>
      </div>
    `;

    const input = qs('#tool-input', root);
    const output = qs('#tool-output', root);
    const runBtn = qs('[data-run]', root);
    const clearBtn = qs('[data-clear]', root);
    const sampleBtn = qs('[data-sample]', root);
    const copyBtn = qs('[data-copy]', root);
    const downloadBtn = qs('[data-download]', root);

    runBtn.addEventListener('click', async () => {
      try {
        setStatus(root, 'Working on your request...', 'info');
        const result = await withProgress(root, options.steps, () => options.compute(input.value, root));
        output.value = result;
        setStatus(root, 'Done. You can copy or download the result.', 'success');
      } catch (error) {
        output.value = '';
        setStatus(root, error.message, 'error');
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      output.value = '';
      setStatus(root, 'Cleared. Ready for a new input.', 'info');
    });

    sampleBtn.addEventListener('click', () => {
      input.value = SAMPLE_DATA[tool.id] || '';
      setStatus(root, 'Loaded a quick example to help first-time users.', 'info');
    });

    copyBtn.addEventListener('click', () => copyText(output.value, copyBtn));
    downloadBtn.addEventListener('click', () => downloadText(`${tool.id}.txt`, output.value || ''));
  }

  function renderTimestampTool(root, tool) {
    root.innerHTML = `
      ${renderSharedShell(tool.title)}
      <div class="tool-workspace">
        <div class="two-col-grid">
          <div class="field-group">
            <label for="timestamp-input">Unix timestamp</label>
            <input id="timestamp-input" class="text-input" type="text" placeholder="1719907200" />
          </div>
          <div class="field-group">
            <label for="datetime-input">Date and time</label>
            <input id="datetime-input" class="text-input" type="datetime-local" />
          </div>
        </div>
        <div class="action-row">
          <button class="btn btn-primary" data-from-timestamp>Convert timestamp</button>
          <button class="btn btn-secondary" data-from-date>Convert date to timestamp</button>
          <button class="btn btn-secondary" data-sample>Load example</button>
        </div>
        <div class="field-group">
          <div class="output-head">
            <label for="tool-output">Output</label>
            <div class="mini-actions"><button class="mini-btn" data-copy>Copy</button></div>
          </div>
          <textarea id="tool-output" class="big-textarea output" readonly></textarea>
        </div>
      </div>
    `;

    const input = qs('#timestamp-input', root);
    const datetimeInput = qs('#datetime-input', root);
    const output = qs('#tool-output', root);
    datetimeInput.value = dateTimeLocalValue();

    qs('[data-sample]', root).addEventListener('click', () => {
      input.value = SAMPLE_DATA[tool.id];
      setStatus(root, 'Loaded a sample Unix timestamp.', 'info');
    });

    qs('[data-copy]', root).addEventListener('click', (e) => copyText(output.value, e.currentTarget));

    qs('[data-from-timestamp]', root).addEventListener('click', async () => {
      try {
        const data = await withProgress(root, ['Reading timestamp', 'Converting to local time', 'Preparing UTC details'], async () => formatTimestamp(input.value));
        output.value = `Local: ${data.local}\nUTC: ${data.utc}\nISO: ${data.iso}\nSeconds: ${data.seconds}\nMilliseconds: ${data.milliseconds}`;
        setStatus(root, 'Converted timestamp successfully.', 'success');
      } catch (error) {
        output.value = '';
        setStatus(root, error.message, 'error');
      }
    });

    qs('[data-from-date]', root).addEventListener('click', async () => {
      try {
        const data = await withProgress(root, ['Reading date', 'Generating Unix timestamp', 'Preparing output'], async () => {
          if (!datetimeInput.value) throw new Error('Please select a date and time first.');
          const date = new Date(datetimeInput.value);
          if (Number.isNaN(date.getTime())) throw new Error('That date/time is not valid.');
          return {
            iso: date.toISOString(),
            seconds: Math.floor(date.getTime() / 1000),
            milliseconds: date.getTime(),
            utc: date.toUTCString(),
            local: date.toLocaleString()
          };
        });
        output.value = `Seconds: ${data.seconds}\nMilliseconds: ${data.milliseconds}\nISO: ${data.iso}\nLocal: ${data.local}\nUTC: ${data.utc}`;
        setStatus(root, 'Generated a new Unix timestamp.', 'success');
      } catch (error) {
        output.value = '';
        setStatus(root, error.message, 'error');
      }
    });
  }

  function renderImageToBase64(root, tool) {
    root.innerHTML = `
      ${renderSharedShell(tool.title)}
      <div class="tool-workspace">
        <div class="field-group">
          <label for="image-file">Choose image</label>
          <input id="image-file" class="text-input" type="file" accept="image/*" />
        </div>
        <div class="action-row">
          <button class="btn btn-primary" data-run>Convert image</button>
          <button class="btn btn-secondary" data-clear>Clear</button>
        </div>
        <div class="image-preview" data-preview-wrap hidden>
          <img alt="Selected preview" data-preview />
        </div>
        <div class="field-group">
          <div class="output-head">
            <label for="tool-output">Base64 output</label>
            <div class="mini-actions">
              <button class="mini-btn" data-copy>Copy</button>
              <button class="mini-btn" data-download>Download</button>
            </div>
          </div>
          <textarea id="tool-output" class="big-textarea output" readonly></textarea>
        </div>
      </div>
    `;

    const fileInput = qs('#image-file', root);
    const output = qs('#tool-output', root);
    const previewWrap = qs('[data-preview-wrap]', root);
    const preview = qs('[data-preview]', root);

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const dataUrl = await readFileAsDataURL(file);
      preview.src = dataUrl;
      previewWrap.hidden = false;
    });

    qs('[data-run]', root).addEventListener('click', async () => {
      try {
        const file = fileInput.files?.[0];
        if (!file) throw new Error('Please choose an image first.');
        const result = await withProgress(root, ['Reading file', 'Encoding image data', 'Preparing Base64 output'], async () => readFileAsDataURL(file));
        output.value = result;
        setStatus(root, 'Image converted to Base64 successfully.', 'success');
      } catch (error) {
        setStatus(root, error.message, 'error');
      }
    });

    qs('[data-copy]', root).addEventListener('click', (e) => copyText(output.value, e.currentTarget));
    qs('[data-download]', root).addEventListener('click', () => downloadText('image-base64.txt', output.value || ''));
    qs('[data-clear]', root).addEventListener('click', () => {
      fileInput.value = '';
      output.value = '';
      preview.src = '';
      previewWrap.hidden = true;
      setStatus(root, 'Cleared. Choose another image when ready.', 'info');
    });
  }

  function renderImageResizer(root, tool) {
    root.innerHTML = `
      ${renderSharedShell(tool.title)}
      <div class="tool-workspace">
        <div class="three-col-grid">
          <div class="field-group">
            <label for="image-file">Choose image</label>
            <input id="image-file" class="text-input" type="file" accept="image/*" />
          </div>
          <div class="field-group">
            <label for="resize-width">Output width (px)</label>
            <input id="resize-width" class="text-input" type="number" min="32" value="1200" />
          </div>
          <div class="field-group">
            <label for="resize-format">Format</label>
            <select id="resize-format" class="text-input">
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
        </div>
        <div class="field-group">
          <label for="resize-quality">Quality for JPG/WebP: <span data-quality-label>0.85</span></label>
          <input id="resize-quality" type="range" min="0.4" max="1" step="0.05" value="0.85" />
        </div>
        <div class="action-row">
          <button class="btn btn-primary" data-run>Resize image</button>
          <button class="btn btn-secondary" data-clear>Clear</button>
        </div>
        <div class="preview-grid">
          <div class="image-preview" data-original-wrap hidden>
            <span class="preview-tag">Original</span>
            <img alt="Original image preview" data-original-preview />
          </div>
          <div class="image-preview" data-output-wrap hidden>
            <span class="preview-tag">Output</span>
            <img alt="Output image preview" data-output-preview />
          </div>
        </div>
        <div class="field-group">
          <div class="output-head">
            <label for="tool-output">Result details</label>
            <div class="mini-actions"><button class="mini-btn" data-download>Download image</button></div>
          </div>
          <textarea id="tool-output" class="big-textarea output" readonly></textarea>
        </div>
      </div>
    `;

    const fileInput = qs('#image-file', root);
    const widthInput = qs('#resize-width', root);
    const formatInput = qs('#resize-format', root);
    const qualityInput = qs('#resize-quality', root);
    const qualityLabel = qs('[data-quality-label]', root);
    const output = qs('#tool-output', root);
    const originalWrap = qs('[data-original-wrap]', root);
    const outputWrap = qs('[data-output-wrap]', root);
    const originalPreview = qs('[data-original-preview]', root);
    const outputPreview = qs('[data-output-preview]', root);
    let latestOutput = null;

    qualityInput.addEventListener('input', () => {
      qualityLabel.textContent = Number(qualityInput.value).toFixed(2);
    });

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      originalPreview.src = await readFileAsDataURL(file);
      originalWrap.hidden = false;
    });

    qs('[data-run]', root).addEventListener('click', async () => {
      try {
        const file = fileInput.files?.[0];
        if (!file) throw new Error('Please choose an image first.');
        const width = Number(widthInput.value);
        if (!width || width < 32) throw new Error('Please enter a sensible width above 32 pixels.');
        latestOutput = await withProgress(root, ['Reading image', 'Resizing on your device', 'Rendering the download'], async () => resizeImage(file, width, formatInput.value, Number(qualityInput.value)));
        outputPreview.src = latestOutput.outUrl;
        outputWrap.hidden = false;
        output.value = `Original size: ${latestOutput.originalWidth} × ${latestOutput.originalHeight}\nOutput size: ${latestOutput.width} × ${latestOutput.height}\nFormat: ${formatInput.value.toUpperCase()}\nQuality: ${Number(qualityInput.value).toFixed(2)}`;
        setStatus(root, 'Image resized successfully. Download is ready.', 'success');
      } catch (error) {
        setStatus(root, error.message, 'error');
      }
    });

    qs('[data-download]', root).addEventListener('click', () => {
      if (!latestOutput) return;
      const a = document.createElement('a');
      a.href = latestOutput.outUrl;
      a.download = `resized-image.${formatInput.value}`;
      a.click();
    });

    qs('[data-clear]', root).addEventListener('click', () => {
      fileInput.value = '';
      output.value = '';
      originalWrap.hidden = true;
      outputWrap.hidden = true;
      latestOutput = null;
      setStatus(root, 'Cleared. Select another image to continue.', 'info');
    });
  }

  function renderGSTCalculator(root, tool) {
    root.innerHTML = `
      ${renderSharedShell(tool.title)}
      <div class="tool-workspace">
        <div class="three-col-grid">
          <div class="field-group">
            <label for="gst-amount">Amount</label>
            <input id="gst-amount" class="text-input" type="number" min="0" step="0.01" placeholder="1000" />
          </div>
          <div class="field-group">
            <label for="gst-rate">GST rate</label>
            <select id="gst-rate" class="text-input">
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18" selected>18%</option>
              <option value="28">28%</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div class="field-group" data-custom-rate-wrap hidden>
            <label for="gst-custom-rate">Custom rate %</label>
            <input id="gst-custom-rate" class="text-input" type="number" min="0" step="0.01" value="18" />
          </div>
        </div>
        <div class="field-group">
          <label for="gst-mode">Calculation mode</label>
          <select id="gst-mode" class="text-input">
            <option value="exclusive">Add GST to base amount</option>
            <option value="inclusive">Extract GST from total amount</option>
          </select>
        </div>
        <div class="action-row">
          <button class="btn btn-primary" data-run>Calculate GST</button>
        </div>
        <div class="result-grid" data-result-grid hidden>
          <div class="result-card"><span>Base amount</span><strong data-base>₹0.00</strong></div>
          <div class="result-card"><span>GST amount</span><strong data-tax>₹0.00</strong></div>
          <div class="result-card"><span>Total</span><strong data-total>₹0.00</strong></div>
        </div>
      </div>
    `;

    const rateSelect = qs('#gst-rate', root);
    const modeSelect = qs('#gst-mode', root);
    const amountInput = qs('#gst-amount', root);
    const customWrap = qs('[data-custom-rate-wrap]', root);
    const customRate = qs('#gst-custom-rate', root);
    const resultGrid = qs('[data-result-grid]', root);

    rateSelect.addEventListener('change', () => {
      customWrap.hidden = rateSelect.value !== 'custom';
    });

    qs('[data-run]', root).addEventListener('click', async () => {
      try {
        const result = await withProgress(root, ['Reading amount', 'Applying GST formula', 'Preparing final totals'], async () => {
          const amount = Number(amountInput.value);
          const rate = Number(rateSelect.value === 'custom' ? customRate.value : rateSelect.value);
          if (!amount || amount < 0) throw new Error('Please enter a valid amount.');
          if (rate < 0) throw new Error('Please enter a valid GST rate.');
          if (modeSelect.value === 'exclusive') {
            const tax = amount * (rate / 100);
            return { base: amount, tax, total: amount + tax };
          }
          const base = amount / (1 + rate / 100);
          const tax = amount - base;
          return { base, tax, total: amount };
        });
        resultGrid.hidden = false;
        qs('[data-base]', root).textContent = `₹${result.base.toFixed(2)}`;
        qs('[data-tax]', root).textContent = `₹${result.tax.toFixed(2)}`;
        qs('[data-total]', root).textContent = `₹${result.total.toFixed(2)}`;
        setStatus(root, 'GST calculated successfully.', 'success');
      } catch (error) {
        resultGrid.hidden = true;
        setStatus(root, error.message, 'error');
      }
    });
  }

  function renderEMICalculator(root, tool) {
    root.innerHTML = `
      ${renderSharedShell(tool.title)}
      <div class="tool-workspace">
        <div class="three-col-grid">
          <div class="field-group">
            <label for="emi-principal">Loan amount</label>
            <input id="emi-principal" class="text-input" type="number" min="0" step="0.01" placeholder="500000" />
          </div>
          <div class="field-group">
            <label for="emi-rate">Annual interest %</label>
            <input id="emi-rate" class="text-input" type="number" min="0" step="0.01" placeholder="10.5" />
          </div>
          <div class="field-group">
            <label for="emi-months">Tenure in months</label>
            <input id="emi-months" class="text-input" type="number" min="1" step="1" placeholder="60" />
          </div>
        </div>
        <div class="action-row"><button class="btn btn-primary" data-run>Calculate EMI</button></div>
        <div class="result-grid" data-result-grid hidden>
          <div class="result-card"><span>Monthly EMI</span><strong data-emi>₹0.00</strong></div>
          <div class="result-card"><span>Total interest</span><strong data-interest>₹0.00</strong></div>
          <div class="result-card"><span>Total payment</span><strong data-total>₹0.00</strong></div>
        </div>
      </div>
    `;

    qs('[data-run]', root).addEventListener('click', async () => {
      try {
        const result = await withProgress(root, ['Reading loan values', 'Applying EMI formula', 'Summarizing totals'], async () => {
          const p = Number(qs('#emi-principal', root).value);
          const annualRate = Number(qs('#emi-rate', root).value);
          const months = Number(qs('#emi-months', root).value);
          if (!p || p <= 0) throw new Error('Please enter a valid loan amount.');
          if (!months || months <= 0) throw new Error('Please enter a valid tenure in months.');
          const r = annualRate / 12 / 100;
          const emi = r === 0 ? p / months : (p * r * (1 + r) ** months) / ((1 + r) ** months - 1);
          const total = emi * months;
          const interest = total - p;
          return { emi, total, interest };
        });
        qs('[data-result-grid]', root).hidden = false;
        qs('[data-emi]', root).textContent = `₹${result.emi.toFixed(2)}`;
        qs('[data-interest]', root).textContent = `₹${result.interest.toFixed(2)}`;
        qs('[data-total]', root).textContent = `₹${result.total.toFixed(2)}`;
        setStatus(root, 'EMI calculated successfully.', 'success');
      } catch (error) {
        qs('[data-result-grid]', root).hidden = true;
        setStatus(root, error.message, 'error');
      }
    });
  }

  function renderPercentageCalculator(root, tool) {
    root.innerHTML = `
      ${renderSharedShell(tool.title)}
      <div class="tool-workspace">
        <div class="field-group">
          <label for="percent-mode">Mode</label>
          <select id="percent-mode" class="text-input">
            <option value="of">What is X% of Y?</option>
            <option value="increase">Percentage increase</option>
            <option value="decrease">Percentage decrease</option>
            <option value="ratio">X is what percent of Y?</option>
          </select>
        </div>
        <div class="three-col-grid">
          <div class="field-group">
            <label for="percent-a">Value A</label>
            <input id="percent-a" class="text-input" type="number" step="0.01" />
          </div>
          <div class="field-group">
            <label for="percent-b">Value B</label>
            <input id="percent-b" class="text-input" type="number" step="0.01" />
          </div>
          <div class="field-group muted-card">
            <span>Quick examples</span>
            <small>Discounts, growth, markups, and comparisons</small>
          </div>
        </div>
        <div class="action-row"><button class="btn btn-primary" data-run>Calculate percentage</button></div>
        <div class="result-grid" data-result-grid hidden>
          <div class="result-card wide"><span>Answer</span><strong data-answer>0</strong></div>
        </div>
      </div>
    `;

    qs('[data-run]', root).addEventListener('click', async () => {
      try {
        const result = await withProgress(root, ['Reading values', 'Applying percentage math', 'Preparing answer'], async () => {
          const mode = qs('#percent-mode', root).value;
          const a = Number(qs('#percent-a', root).value);
          const b = Number(qs('#percent-b', root).value);
          if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error('Please enter both values.');
          switch (mode) {
            case 'of':
              return `${a}% of ${b} = ${(a / 100) * b}`;
            case 'increase':
              if (a === 0) throw new Error('Value A cannot be zero for percentage increase.');
              return `Increase from ${a} to ${b} = ${(((b - a) / a) * 100).toFixed(2)}%`;
            case 'decrease':
              if (a === 0) throw new Error('Value A cannot be zero for percentage decrease.');
              return `Decrease from ${a} to ${b} = ${(((a - b) / a) * 100).toFixed(2)}%`;
            default:
              if (b === 0) throw new Error('Value B cannot be zero for this mode.');
              return `${a} is ${((a / b) * 100).toFixed(2)}% of ${b}`;
          }
        });
        qs('[data-result-grid]', root).hidden = false;
        qs('[data-answer]', root).textContent = result;
        setStatus(root, 'Percentage result calculated successfully.', 'success');
      } catch (error) {
        qs('[data-result-grid]', root).hidden = true;
        setStatus(root, error.message, 'error');
      }
    });
  }

  function mountAdsense() {
    if (!SITE_CONFIG.adsense_client || !SITE_CONFIG.enable_auto_ads) {
      document.documentElement.classList.add('ads-disabled');
      return;
    }
    if (document.querySelector('script[data-adsense-script]')) return;
    const script = document.createElement('script');
    script.async = true;
    script.dataset.adsenseScript = 'true';
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(SITE_CONFIG.adsense_client)}`;
    document.head.appendChild(script);
  }

  function initSearch() {
    const input = qs('#tool-search');
    if (!input) return;
    const cards = qsa('.tool-card');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      cards.forEach((card) => {
        const hay = card.dataset.search || '';
        card.style.display = !q || hay.includes(q) ? '' : 'none';
      });
    });
  }

  function initToolPage() {
    const toolDataNode = qs('#tool-data');
    const root = qs('#tool-root');
    if (!toolDataNode || !root) return;
    const tool = JSON.parse(toolDataNode.textContent);

    switch (tool.id) {
      case 'json-formatter':
        renderTextTool(root, tool, {
          runLabel: 'Format JSON',
          steps: ['Checking JSON syntax', 'Beautifying indentation', 'Preparing clean output'],
          compute: async (input) => JSON.stringify(JSON.parse(input), null, 2)
        });
        break;
      case 'json-to-csv':
        renderTextTool(root, tool, {
          runLabel: 'Convert to CSV',
          steps: ['Reading JSON array', 'Flattening fields', 'Generating CSV rows'],
          compute: async (input) => jsonToCsv(input)
        });
        break;
      case 'csv-to-json':
        renderTextTool(root, tool, {
          runLabel: 'Convert to JSON',
          steps: ['Reading CSV rows', 'Mapping headers to fields', 'Formatting JSON output'],
          compute: async (input) => JSON.stringify(csvToJson(input), null, 2)
        });
        break;
      case 'base64-encoder':
        renderTextTool(root, tool, {
          runLabel: 'Encode to Base64',
          steps: ['Reading text', 'Encoding UTF-8 bytes', 'Preparing Base64 output'],
          compute: async (input) => encodeBase64Unicode(input)
        });
        break;
      case 'base64-decoder':
        renderTextTool(root, tool, {
          runLabel: 'Decode Base64',
          steps: ['Checking Base64 text', 'Decoding bytes', 'Preparing readable output'],
          compute: async (input) => decodeBase64Unicode(input)
        });
        break;
      case 'url-encoder':
        renderTextTool(root, tool, {
          runLabel: 'Encode URL',
          steps: ['Reading text', 'Encoding reserved characters', 'Preparing URL-safe output'],
          compute: async (input) => encodeURIComponent(input)
        });
        break;
      case 'url-decoder':
        renderTextTool(root, tool, {
          runLabel: 'Decode URL',
          steps: ['Reading encoded text', 'Decoding percent values', 'Preparing readable output'],
          compute: async (input) => decodeURIComponent(input)
        });
        break;
      case 'case-converter':
        renderTextTool(root, tool, {
          runLabel: 'Convert text case',
          steps: ['Reading text', 'Applying selected case style', 'Preparing converted output'],
          extraControls: `
            <div class="field-group">
              <label for="case-style">Case style</label>
              <select id="case-style" class="text-input">
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
                <option value="title">Title Case</option>
                <option value="sentence">Sentence case</option>
                <option value="slug">slug-case</option>
              </select>
            </div>
          `,
          compute: async (input, localRoot) => {
            const mode = qs('#case-style', localRoot).value;
            switch (mode) {
              case 'upper': return input.toUpperCase();
              case 'lower': return input.toLowerCase();
              case 'title': return titleCase(input);
              case 'sentence': return sentenceCase(input);
              default: return slugify(input);
            }
          }
        });
        break;
      case 'slug-generator':
        renderTextTool(root, tool, {
          runLabel: 'Generate slug',
          steps: ['Reading title text', 'Removing symbols', 'Building SEO-friendly slug'],
          compute: async (input) => slugify(input)
        });
        break;
      case 'sha256-generator':
        renderTextTool(root, tool, {
          runLabel: 'Generate SHA-256',
          steps: ['Reading input', 'Hashing with Web Crypto', 'Preparing final digest'],
          compute: async (input) => sha256(input)
        });
        break;
      case 'jwt-decoder':
        renderTextTool(root, tool, {
          runLabel: 'Decode JWT',
          steps: ['Reading token', 'Decoding header and payload', 'Formatting readable JSON'],
          compute: async (input) => {
            const data = decodeJwt(input.trim());
            return `Header:\n${JSON.stringify(data.header, null, 2)}\n\nPayload:\n${JSON.stringify(data.payload, null, 2)}`;
          }
        });
        break;
      case 'timestamp-converter':
        renderTimestampTool(root, tool);
        break;
      case 'image-to-base64':
        renderImageToBase64(root, tool);
        break;
      case 'image-resizer':
        renderImageResizer(root, tool);
        break;
      case 'gst-calculator':
        renderGSTCalculator(root, tool);
        break;
      case 'emi-calculator':
        renderEMICalculator(root, tool);
        break;
      case 'percentage-calculator':
        renderPercentageCalculator(root, tool);
        break;
      default:
        root.innerHTML = '<p>This tool is not configured yet.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountAdsense();
    initSearch();
    initToolPage();
  });
})();
