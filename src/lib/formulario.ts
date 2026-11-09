// Formulário de contato. Com PUBLIC_FORM_ENDPOINT (Formspree, Web3Forms etc.) envia por fetch;
// sem ele, monta um mailto: com o que a pessoa escreveu, então nada se perde.
export function iniciarFormulario(form: HTMLFormElement, lang: 'pt' | 'en' = 'pt') {
  const t = lang === 'en'
    ? { enviando: 'Sending…', ok: 'Message sent. Thank you, I will reply soon.', erro: 'Could not send. Please email me directly.', mail: 'Opening your email app…', assunto: 'Contact via portfolio' }
    : { enviando: 'Enviando…', ok: 'Mensagem enviada. Obrigado, respondo em breve.', erro: 'Não consegui enviar. Escreva direto para o meu e-mail.', mail: 'Abrindo seu app de e-mail…', assunto: 'Contato pelo portfólio' };
  const status = form.querySelector<HTMLElement>('.form-s')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    if (d.get('_gotcha')) return;
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      status.textContent = t.enviando;
      try {
        const r = await fetch(endpoint, { method: 'POST', body: d, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(String(r.status));
        form.reset();
        status.textContent = t.ok;
      } catch {
        status.textContent = t.erro;
      }
      return;
    }
    const corpo = `${d.get('mensagem')}\n\n— ${d.get('nome')} (${d.get('email')})`;
    status.textContent = t.mail;
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(t.assunto)}&body=${encodeURIComponent(corpo)}`;
  });
}
