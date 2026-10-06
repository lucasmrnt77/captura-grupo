/**
 * Normalização e parsing de dados do formulário histórico.
 *
 * Sem 'server-only': são funções puras, sem credencial nem I/O. Podem
 * ser reaproveitadas no navegador se algum dia o formulário precisar
 * normalizar antes de gravar — e vão precisar, porque a chave de
 * matching tem que ser idêntica dos dois lados.
 */

/* ══════════════════════════════════════════════════════════
   E-mail
   ══════════════════════════════════════════════════════════ */

const DOMINIOS_GMAIL = new Set(['gmail.com', 'googlemail.com']);

/**
 * Chave canônica de e-mail para matching.
 *
 * Para todos os domínios: trim e lowercase.
 * Para Gmail e Googlemail também: remove +tag, remove pontos da parte
 * local, e googlemail.com passa a valer como gmail.com.
 *
 * A remoção de pontos é restrita ao Gmail de propósito. Em outros
 * provedores `joao.silva@` e `joaosilva@` podem ser pessoas diferentes,
 * e juntar as duas criaria um falso positivo de matching — pior que
 * não casar, porque associa dinheiro à pessoa errada.
 *
 * Devolve string vazia quando a entrada não é um e-mail utilizável.
 */
export function normalizarEmail(valor: string | null | undefined): string {
  const limpo = String(valor ?? '').trim().toLowerCase();
  if (!limpo) return '';

  const at = limpo.lastIndexOf('@');
  if (at < 1 || at === limpo.length - 1) return '';

  let local = limpo.slice(0, at);
  let dominio = limpo.slice(at + 1);

  if (DOMINIOS_GMAIL.has(dominio)) {
    const mais = local.indexOf('+');
    if (mais > 0) local = local.slice(0, mais);
    local = local.replace(/\./g, '');
    dominio = 'gmail.com';
  }

  if (!local) return '';
  return `${local}@${dominio}`;
}

/* ══════════════════════════════════════════════════════════
   WhatsApp
   ══════════════════════════════════════════════════════════ */

/**
 * Mantém apenas dígitos.
 *
 * Não tenta deduzir código de país: um número sem DDI fica sem DDI.
 * Inventar um prefixo transformaria um dado incompleto num dado errado,
 * e o errado é mais difícil de detectar depois.
 */
export function normalizarWhatsapp(valor: string | null | undefined): string {
  return String(valor ?? '').replace(/\D/g, '');
}

/* ══════════════════════════════════════════════════════════
   WhatsApp com código de país
   ══════════════════════════════════════════════════════════ */

/**
 * Normaliza o telefone usando o país que a pessoa já informou.
 *
 * O formulário deixa de pedir o código do país. A pessoa escreve o
 * número como escreve para qualquer um, e nós montamos o resto — a
 * responsabilidade de acertar o formato sai de quem se inscreve.
 *
 * ── As regras, exatamente como o Emiliano definiu ──────────
 *
 *   Argentina  o 54 sempre; o 9 depois dele só se ainda não estiver
 *                54 9 …   → não toca
 *                54 …     → insere o 9: 549 …
 *                9 …      → prefixa só o 54: 54 9 …
 *                …        → prefixa 549
 *   Uruguay    598 → deixa
 *              começa com 0 → tira o 0 e prefixa 598
 *              senão → prefixa 598
 *   EEUU       1 → deixa · senão prefixa 1
 *   demais     só os dígitos, sem prefixo
 *
 * ── Duas coisas que NÃO são esquecimento ───────────────────
 *
 * O `0` inicial e o `15` da Argentina não recebem tratamento. Foi
 * decisão do Emiliano depois de olhar cerca de 200 registros reais: o
 * `0` nunca apareceu, e o `15` fica. Sem esta nota, a primeira pessoa
 * que ler vai "corrigir" e quebrar números que hoje funcionam.
 *
 * Colombia, Panamá, Costa Rica e "Otro" caem no caso geral e ficam
 * sem código de país. É o que a regra dele previa. Se um dia esses
 * números precisarem abrir no WhatsApp, faltam três prefixos — mas
 * inventá-los agora seria decidir por ele.
 */
/**
 * O código de cada país.
 *
 * ── Por que uma tabela ─────────────────────────────────────
 *
 * Antes eram três `if`. Com vinte países viraria uma escada ilegível,
 * e a regra é a mesma para todos: pôr o código se não estiver lá.
 *
 * Só Argentina e México saem da tabela, porque têm um dígito a mais
 * entre o código e o número.
 *
 * ── Os nomes ───────────────────────────────────────────────
 *
 * Sem acento e em minúscula — a comparação normaliza antes. Cada país
 * aparece com as grafias que chegam de verdade: o formulário manda
 * "Panamá", o importador histórico mandava "PANAMA", e alguém digita
 * "Brasil" ou "Brazil".
 */
const CODIGO_PAIS: Record<string, string> = {
  // Cone Sul
  'uruguay': '598',
  'uruguai': '598',
  'chile': '56',
  'paraguay': '595',
  'paraguai': '595',
  'bolivia': '591',
  'brasil': '55',
  'brazil': '55',

  // Andes e Caribe continental
  'colombia': '57',
  'peru': '51',
  'ecuador': '593',
  'equador': '593',
  'venezuela': '58',

  // América Central
  'panama': '507',
  'costa rica': '506',
  'guatemala': '502',
  'honduras': '504',
  'el salvador': '503',
  'salvador': '503',
  'nicaragua': '505',
  'belice': '501',
  'belize': '501',

  // Caribe
  'republica dominicana': '1',
  'cuba': '53',
  'puerto rico': '1',

  // América do Norte
  'estados unidos': '1',
  'eeuu': '1',
  'usa': '1',
  'canada': '1',
  'mexico': '52',   // tratado à parte, listado para referência

  // Europa, onde há alunos
  'espana': '34',
  'espanha': '34',
  'italia': '39',
  'portugal': '351',
};

export function normalizarWhatsappPorPais(
  valor: string | null | undefined,
  pais: string | null | undefined,
): string {
  const digitos = String(valor ?? '').replace(/\D/g, '');
  if (!digitos) return '';

  // ── O nome do país, como ele chega ────────────────────
  //
  // Sem acento e sem caixa: o formulário manda "Panamá" e o
  // importador histórico mandava "PANAMA".
  //
  // E sem o prefixo "Otro: ". O formulário oferece sete países; quem
  // é de fora escreve o seu, e chega como "Otro: Chile". Sem tirar
  // isso, todo chileno ficaria sem código de país — e são vários no
  // lançamento atual.
  const p = String(pais ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^\s*(otro|outro|other)\s*[:\-]\s*/i, '')
    .trim().toLowerCase();

  // ── Argentina, que é a exceção ────────────────────────
  //
  // O WhatsApp argentino exige um `9` depois do código de país, que
  // não aparece quando se disca dentro do país. Sem ele a mensagem
  // não chega. É o único caso em que acrescentamos um dígito além do
  // código.
  //
  // ── Desmontar e remontar ──────────────────────────────
  //
  // Em vez de decidir o que acrescentar ao que veio, tiramos tudo o
  // que é prefixo — 54, o 9 do celular e o 0 da discagem interna — e
  // remontamos sempre como `549` + número nacional.
  //
  // A versão anterior só acrescentava, e por isso `0264002350` virava
  // 549 0264002350: o zero ficava no meio e a mensagem não chegava.
  // O mesmo valia para quem escrevia +54 0…, que é o erro comum de
  // quem copia o número do jeito que disca em casa.
  //
  // A ordem importa. O zero pode vir antes do 9 (`0 9 264…`) ou
  // depois (`9 0 264…`), então tiramos zeros, tiramos o 9 e tiramos
  // zeros de novo.
  //
  // Reconhecer o 9 é seguro: nenhum código de área argentino começa
  // com 9 — são todos 1, 2 ou 3 —, então um 9 nessa posição só pode
  // ser o do celular. É o que impede "9 11 1234 5678" de virar
  // 54 9 9 11…, que foi um bug real.
  if (p === 'argentina') {
    let nacional = digitos.startsWith('54') ? digitos.slice(2) : digitos;

    nacional = nacional.replace(/^0+/, '');
    if (nacional.startsWith('9')) nacional = nacional.slice(1);
    nacional = nacional.replace(/^0+/, '');

    // Só prefixo e nada de número: não há o que normalizar. Vazio faz
    // a coluna ficar nula, que é honesto — um "549" sozinho pareceria
    // um telefone.
    if (!nacional) return '';

    return '549' + nacional;
  }

  // ── México, a outra exceção ───────────────────────────
  //
  // Teve o mesmo `1` depois do 52 até 2019. Hoje não precisa, mas
  // números antigos ainda circulam com ele — e funcionam. Deixamos
  // passar quem já tem, sem acrescentar a quem não tem.
  if (p === 'mexico') {
    if (digitos.startsWith('52')) return digitos;
    return '52' + tirarZero(digitos);
  }

  // ── O resto: só o código do país ──────────────────────
  //
  // A regra é a mesma para todos, e por isso vive numa tabela em vez
  // de num `if` por país: se já começa com o código, fica; se não,
  // acrescenta — tirando o zero do formato nacional, que existe em
  // quase toda a região e nunca faz parte do número internacional.
  const codigo = CODIGO_PAIS[p];
  if (codigo) {
    if (digitos.startsWith(codigo)) return digitos;
    return codigo + tirarZero(digitos);
  }

  // País desconhecido ou "Otro": devolve como veio. Um código
  // adivinhado mandaria a mensagem para o lugar errado, e é melhor um
  // número que alguém precisa corrigir do que um que parece certo.
  return digitos;
}

/**
 * O zero inicial do formato nacional.
 *
 * `099...` no Uruguai, `0351...` na Argentina, `09...` no Equador. É
 * o prefisso de discagem interna e não existe no número
 * internacional.
 */
function tirarZero(digitos: string): string {
  return digitos.startsWith('0') ? digitos.replace(/^0+/, '') : digitos;
}

/* ══════════════════════════════════════════════════════════
   Valores monetários
   ══════════════════════════════════════════════════════════ */

/**
 * Converte texto de valor em número.
 *
 * Formatos vistos na planilha: `$1,008.63`, `$894.77`, `962.195122`.
 *
 * Quando vírgula e ponto aparecem juntos, o que vem por último é o
 * separador decimal — isso cobre tanto `1,008.63` quanto `1.008,63`.
 * Com só vírgula, três dígitos depois indicam separador de milhar;
 * qualquer outra quantidade indica decimal.
 *
 * Devolve null quando não há número reconhecível.
 */
export function parseValorUsd(valor: string | null | undefined): number | null {
  const bruto = String(valor ?? '').trim();
  if (!bruto) return null;

  // Fora tudo que não é dígito, separador ou sinal.
  let s = bruto.replace(/[^\d,.\-]/g, '');
  if (!s || !/\d/.test(s)) return null;

  const negativo = s.startsWith('-');
  s = s.replace(/-/g, '');

  const ultimaVirgula = s.lastIndexOf(',');
  const ultimoPonto = s.lastIndexOf('.');

  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    if (ultimaVirgula > ultimoPonto) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (ultimaVirgula >= 0) {
    const depois = s.length - ultimaVirgula - 1;
    s = depois === 3 ? s.replace(/,/g, '') : s.replace(',', '.');
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

/* ══════════════════════════════════════════════════════════
   Booleanos
   ══════════════════════════════════════════════════════════ */

const VERDADEIROS = new Set([
  'si', 'sí', 'sim', 's', 'yes', 'y', 'true', 'verdadero', 'verdadeiro',
  '1', 'x', 'ok', 'excepcion', 'excepción', 'tpp',
]);

/**
 * Leitura tolerante de booleano.
 *
 * Vazio, ausente ou qualquer coisa não reconhecida vira false. Numa
 * planilha preenchida à mão, a marcação é o sinal — a ausência dela
 * significa "não", não "não sei".
 */
export function parseBooleano(valor: string | null | undefined): boolean {
  const s = String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!s) return false;
  return VERDADEIROS.has(s) || VERDADEIROS.has(s.normalize('NFC'));
}

/* ══════════════════════════════════════════════════════════
   Datas
   ══════════════════════════════════════════════════════════ */

/** Ano de corte para dois dígitos: 26 → 2026, 99 → 1999. */
const CORTE_SECULO = 70;

/**
 * Fuso da planilha histórica. O lançamento foi Argentina/Uruguai, e os
 * horários registrados são locais dessa região.
 */
const OFFSET_HORAS = -3;

const dois = (n: number) => String(n).padStart(2, '0');

/**
 * Parser explícito de dia/mês/ano.
 *
 * Formatos vistos: `14/5/2026 21:36:00` e `15/5/26`.
 *
 * `new Date(string)` não serve aqui: em `5/6/2026` ele assume mês/dia
 * por vir de origem americana, e a planilha é dia/mês. O erro é
 * silencioso e só aparece em datas onde os dois números são válidos
 * como mês — ou seja, na maioria delas.
 *
 * O horário é interpretado como UTC-3, o fuso do lançamento. A saída
 * carrega o deslocamento explícito (`-03:00`) em vez de ser convertida
 * para Z: o Postgres armazena o instante correto em `timestamptz` de
 * qualquer forma, e a string preserva a leitura original da planilha,
 * o que torna qualquer conferência posterior direta.
 *
 * Devolve ISO 8601 com offset, ou null.
 */
export function parseDataBR(valor: string | null | undefined): string | null {
  const bruto = String(valor ?? '').trim();
  if (!bruto) return null;

  const m = bruto.match(
    /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (!m) return null;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  let ano = Number(m[3]);
  const hora = Number(m[4] ?? 0);
  const min = Number(m[5] ?? 0);
  const seg = Number(m[6] ?? 0);

  if (m[3].length <= 2) ano += ano < CORTE_SECULO ? 2000 : 1900;

  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > 31) return null;
  if (hora > 23 || min > 59 || seg > 59) return null;

  // Valida o calendário: rejeita datas que "transbordam",
  // como 31/02 virando 03/03.
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    d.getUTCFullYear() !== ano ||
    d.getUTCMonth() !== mes - 1 ||
    d.getUTCDate() !== dia
  ) {
    return null;
  }

  const sinal = OFFSET_HORAS < 0 ? '-' : '+';
  const off = `${sinal}${dois(Math.abs(OFFSET_HORAS))}:00`;

  return `${ano}-${dois(mes)}-${dois(dia)}T${dois(hora)}:${dois(min)}:${dois(seg)}${off}`;
}

/* ══════════════════════════════════════════════════════════
   Cabeçalhos
   ══════════════════════════════════════════════════════════ */

/**
 * Chave estável para comparar cabeçalhos.
 *
 * Remove acentos, pontuação final, espaços repetidos e caixa. Serve
 * para que `Qué edad tenes?` e `Que edad tenes` encontrem a mesma
 * coluna — planilhas editadas à mão acumulam essas diferenças.
 */
export function chaveCabecalho(texto: string): string {
  return String(texto ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[?¿!¡.:;]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
