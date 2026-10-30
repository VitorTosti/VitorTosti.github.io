// O botão do currículo só aparece quando o PDF existe em public/curriculo.pdf (checado no build).
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const CURRICULO = '/curriculo.pdf';
export const temCurriculo = existsSync(join(process.cwd(), 'public', 'curriculo.pdf'));
