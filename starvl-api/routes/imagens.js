const express = require('express');
const https   = require('https');
const router  = express.Router();
const pool    = require('../db/pool');

// Cria tabela na primeira execução (idempotente)
pool.query(`
  CREATE TABLE IF NOT EXISTS starvl_imagens (
    img_tipo    VARCHAR(20)  NOT NULL,
    img_ref     VARCHAR(100) NOT NULL,
    img_dados   TEXT         NOT NULL,
    img_updated TIMESTAMPTZ  DEFAULT NOW(),
    PRIMARY KEY (img_tipo, img_ref)
  )
`).catch(err => console.error('[imagens] ensureTable:', err.message));

// ── Helper: POST via https nativo (evita problemas com fetch global no Render) ──
function httpsPost(url, { headers = {}, body } = {}, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = Buffer.isBuffer(body) ? body : Buffer.from(body);

    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: { ...headers, 'Content-Length': bodyBuf.length },
      },
      (resp) => {
        const chunks = [];
        resp.on('data', c => chunks.push(c));
        resp.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({
            ok:          resp.statusCode >= 200 && resp.statusCode < 300,
            status:      resp.statusCode,
            contentType: (resp.headers['content-type'] || '').toLowerCase(),
            buf,
            text:        () => buf.toString('utf-8'),
          });
        });
      }
    );

    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout após ${timeoutMs / 1000}s`)));
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

// GET /api/imagens/:tipo
// Retorna { "<ref>": "<dataUrl>", ... } para todos do tipo
router.get('/:tipo', async (req, res) => {
  const { tipo } = req.params;
  try {
    const result = await pool.query(
      `SELECT img_ref AS ref, img_dados AS dados
       FROM starvl_imagens
       WHERE img_tipo = $1
       ORDER BY img_updated DESC`,
      [tipo]
    );
    const map = {};
    result.rows.forEach(r => { map[r.ref] = r.dados; });
    res.json(map);
  } catch (err) {
    console.error('GET /imagens:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/imagens/:tipo/:ref
// Body: { dados: "<base64 dataUrl>" }
// Cria ou atualiza
router.put('/:tipo/:ref', async (req, res) => {
  const { tipo, ref } = req.params;
  const { dados } = req.body;
  if (!dados) return res.status(400).json({ error: 'dados é obrigatório' });

  // Limite ~8 MB (base64 — o frontend comprime para << 1 MB, mas mantemos margem)
  if (dados.length > 8_000_000) {
    return res.status(413).json({ error: 'Imagem muito grande (máx ~6 MB)' });
  }

  try {
    await pool.query(
      `INSERT INTO starvl_imagens (img_tipo, img_ref, img_dados, img_updated)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (img_tipo, img_ref)
       DO UPDATE SET img_dados = EXCLUDED.img_dados,
                     img_updated = NOW()`,
      [tipo, ref, dados]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /imagens:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/imagens/:tipo/:ref
router.delete('/:tipo/:ref', async (req, res) => {
  const { tipo, ref } = req.params;
  try {
    await pool.query(
      `DELETE FROM starvl_imagens WHERE img_tipo = $1 AND img_ref = $2`,
      [tipo, ref]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /imagens:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/imagens/auto-gerar
// Body: { prodcodigo, nome }
// Gera imagem de produto com FLUX.1-schnell (HuggingFace) e remove o fundo com RMBG-2.0
// Requer HF_TOKEN no .env
router.post('/auto-gerar', async (req, res) => {
  const { prodcodigo, nome } = req.body;
  if (!prodcodigo || !nome) {
    return res.status(400).json({ error: 'prodcodigo e nome são obrigatórios' });
  }

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    return res.status(503).json({
      error: 'HF_TOKEN não configurada. Acesse huggingface.co → Settings → Access Tokens → New token (read) e adicione ao .env do servidor.',
    });
  }

  try {
    // ── 1. Gerar imagem com FLUX.1-schnell ─────────────────────────────────
    const prompt =
      `professional commercial product photography, ${nome}, ` +
      `isolated on pure white background, studio lighting, ` +
      `high resolution, 4k, sharp focus, clean, no shadows, product advertisement`;

    const genResp = await httpsPost(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        headers: {
          Authorization:   `Bearer ${hfToken}`,
          'Content-Type':  'application/json',
          'X-Use-Cache':   'false',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { num_inference_steps: 4, guidance_scale: 3.5 },
        }),
      },
      120_000 // 2 min timeout
    );

    if (!genResp.ok) {
      const txt = genResp.text();
      console.error(`[auto-gerar] FLUX ${genResp.status}:`, txt.slice(0, 300));
      if (genResp.status === 503) {
        return res.status(503).json({ error: 'Modelo ainda carregando. Tente novamente em 30 segundos.' });
      }
      return res.status(genResp.status).json({
        error: `Geração falhou (${genResp.status}): ${txt.slice(0, 300)}`,
      });
    }

    const genBuf         = genResp.buf;
    const genContentType = genResp.contentType || 'image/jpeg';

    // ── 2. Remover fundo com RMBG-2.0 ──────────────────────────────────────
    let finalDataUrl;
    try {
      const rmResp = await httpsPost(
        'https://api-inference.huggingface.co/models/briaai/RMBG-2.0',
        {
          headers: {
            Authorization:  `Bearer ${hfToken}`,
            'Content-Type': genContentType,
          },
          body: genBuf,
        },
        60_000 // 1 min timeout
      );

      if (rmResp.ok && rmResp.contentType.startsWith('image/')) {
        const ext = rmResp.contentType.includes('png') ? 'png' : 'jpeg';
        finalDataUrl = `data:image/${ext};base64,${rmResp.buf.toString('base64')}`;
      } else {
        // RMBG falhou ou retornou JSON — usa imagem gerada sem remoção de fundo
        console.warn('[auto-gerar] RMBG fallback, status:', rmResp.status);
        const ext = genContentType.includes('png') ? 'png' : 'jpeg';
        finalDataUrl = `data:image/${ext};base64,${genBuf.toString('base64')}`;
      }
    } catch (rmErr) {
      // Timeout ou erro de rede no RMBG — usa imagem original
      console.warn('[auto-gerar] RMBG erro/timeout:', rmErr.message);
      const ext = genContentType.includes('png') ? 'png' : 'jpeg';
      finalDataUrl = `data:image/${ext};base64,${genBuf.toString('base64')}`;
    }

    if (finalDataUrl.length > 8_000_000) {
      return res.status(413).json({ error: 'Imagem gerada muito grande (> 6 MB)' });
    }

    // ── 3. Salvar no banco ──────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO starvl_imagens (img_tipo, img_ref, img_dados, img_updated)
       VALUES ('produto', $1, $2, NOW())
       ON CONFLICT (img_tipo, img_ref)
       DO UPDATE SET img_dados = EXCLUDED.img_dados, img_updated = NOW()`,
      [String(prodcodigo), finalDataUrl]
    );

    res.json({ ok: true, dados: finalDataUrl });
  } catch (err) {
    const cause = err.cause ? ` (causa: ${err.cause.code || err.cause.message || err.cause})` : '';
    console.error('[auto-gerar] Erro:', err.message + cause);
    res.status(500).json({ error: err.message + cause });
  }
});

module.exports = router;
