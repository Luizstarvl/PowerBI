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

// ── Helper: GET com redirecionamento (Pollinations redireciona 1x) ────────────
function httpsGetFollow(url, timeoutMs = 90_000, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Muitos redirecionamentos'));

    const req = https.get(url, (resp) => {
      // Seguir redirect 301/302/307/308
      if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
        resp.resume();
        httpsGetFollow(resp.headers.location, timeoutMs, maxRedirects - 1)
          .then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => resolve({
        ok:          resp.statusCode >= 200 && resp.statusCode < 300,
        status:      resp.statusCode,
        contentType: (resp.headers['content-type'] || 'image/jpeg').toLowerCase(),
        buf:         Buffer.concat(chunks),
      }));
      resp.on('error', reject);
    });

    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Timeout após ${timeoutMs / 1000}s`)));
    req.on('error', reject);
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
router.put('/:tipo/:ref', async (req, res) => {
  const { tipo, ref } = req.params;
  const { dados } = req.body;
  if (!dados) return res.status(400).json({ error: 'dados é obrigatório' });

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
// Gera imagem via Pollinations.ai (Flux) — gratuito, sem auth, sem DNS issues
router.post('/auto-gerar', async (req, res) => {
  const { prodcodigo, nome } = req.body;
  if (!prodcodigo || !nome) {
    return res.status(400).json({ error: 'prodcodigo e nome são obrigatórios' });
  }

  try {
    // ── 1. Gerar imagem via Pollinations.ai (Flux model) ───────────────────
    const prompt = encodeURIComponent(
      `professional commercial product photography, ${nome}, ` +
      `isolated on pure white background, studio lighting, ` +
      `high resolution, sharp focus, clean, no shadows, product advertisement`
    );

    const genUrl =
      `https://image.pollinations.ai/prompt/${prompt}` +
      `?width=1024&height=1024&nologo=true&enhance=true&model=flux&seed=${Math.floor(Math.random() * 999999)}`;

    console.log(`[auto-gerar] Gerando "${nome}" via Pollinations.ai...`);
    const genResp = await httpsGetFollow(genUrl, 90_000);

    if (!genResp.ok || !genResp.contentType.startsWith('image/')) {
      const msg = genResp.ok ? `Content-Type inesperado: ${genResp.contentType}` : `Status ${genResp.status}`;
      console.error('[auto-gerar] Pollinations falhou:', msg);
      return res.status(502).json({ error: `Geração falhou: ${msg}` });
    }

    const ext          = genResp.contentType.includes('png') ? 'png' : 'jpeg';
    const finalDataUrl = `data:image/${ext};base64,${genResp.buf.toString('base64')}`;

    if (finalDataUrl.length > 8_000_000) {
      return res.status(413).json({ error: 'Imagem gerada muito grande (> 6 MB)' });
    }

    // ── 2. Salvar no banco ──────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO starvl_imagens (img_tipo, img_ref, img_dados, img_updated)
       VALUES ('produto', $1, $2, NOW())
       ON CONFLICT (img_tipo, img_ref)
       DO UPDATE SET img_dados = EXCLUDED.img_dados, img_updated = NOW()`,
      [String(prodcodigo), finalDataUrl]
    );

    console.log(`[auto-gerar] "${nome}" salvo (${Math.round(genResp.buf.length / 1024)} KB)`);
    res.json({ ok: true, dados: finalDataUrl });
  } catch (err) {
    console.error('[auto-gerar] Erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
