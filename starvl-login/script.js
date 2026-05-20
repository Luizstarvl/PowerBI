document.addEventListener('DOMContentLoaded',function(){
    var tg=document.getElementById('tg'),s=document.getElementById('s');
    var e1=document.getElementById('e1'),e2=document.getElementById('e2');
    tg.addEventListener('click',function(){
        var p=s.type==='password';
        s.type=p?'text':'password';
        e1.style.display=p?'none':'block';
        e2.style.display=p?'block':'none';
    });
    document.getElementById('frm').addEventListener('submit',function(e){
        e.preventDefault();
        var u=document.getElementById('u').value.trim(),p=s.value.trim();
        if(!u||!p){
            if(!u)hl('wu');
            if(!p)hl('ws');
            return;
        }
        // ==== Conecte sua API aqui ====
        console.log({usuario:u,senha:p});
        var b=this.querySelector('.btn');
        b.textContent='Entrando...';b.disabled=true;b.style.opacity='0.7';
        setTimeout(function(){
            b.textContent='Entrar';b.disabled=false;b.style.opacity='1';
        },2000);
    });
    function hl(id){
        var w=document.getElementById(id);
        w.style.borderColor='#e01b22';
        w.style.boxShadow='0 0 0 3px rgba(224,27,34,0.12)';
        w.querySelector('input').focus();
        setTimeout(function(){w.style.borderColor='';w.style.boxShadow='';},2000);
    }
});