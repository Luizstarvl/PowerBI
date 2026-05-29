/**
 * AVISO: Esta é a página de preview de login (starvl-login/).
 * O login real da aplicação é feito dentro do React App (starvl-app/src/App.jsx).
 * Esta página não conecta à API e existe apenas como referência visual/mockup.
 */
document.addEventListener('DOMContentLoaded', function () {
    var tg = document.getElementById('tg'), s = document.getElementById('s');
    var e1 = document.getElementById('e1'), e2 = document.getElementById('e2');

    if (tg && s && e1 && e2) {
        tg.addEventListener('click', function () {
            var p = s.type === 'password';
            s.type = p ? 'text' : 'password';
            e1.style.display = p ? 'none' : 'block';
            e2.style.display = p ? 'block' : 'none';
        });
    }

    var form = document.getElementById('frm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var u = document.getElementById('u') ? document.getElementById('u').value.trim() : '';
        var p = s ? s.value.trim() : '';
        if (!u || !p) {
            if (!u) hl('wu');
            if (!p) hl('ws');
            return;
        }

        // Esta é uma página de preview — não conecta à API real.
        // O login real está em starvl-app (React App).
        var b = form.querySelector('.btn');
        if (b) {
            b.textContent = 'Esta é uma página de preview';
            b.disabled = true;
            b.style.opacity = '0.6';
            setTimeout(function () {
                b.textContent = 'Entrar';
                b.disabled = false;
                b.style.opacity = '1';
            }, 3000);
        }
    });

    function hl(id) {
        var w = document.getElementById(id);
        if (!w) return;
        w.style.borderColor = '#e01b22';
        w.style.boxShadow = '0 0 0 3px rgba(224,27,34,0.12)';
        var input = w.querySelector('input');
        if (input) input.focus();
        setTimeout(function () {
            w.style.borderColor = '';
            w.style.boxShadow = '';
        }, 2000);
    }
});
