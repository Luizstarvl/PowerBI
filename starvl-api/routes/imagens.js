const express = require('express');
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

module.exports = router;
