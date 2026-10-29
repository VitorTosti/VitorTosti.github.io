// Carrega e valida alternativas.json no build. Se o arquivo estiver inválido, o build falha em vez de
// mostrar números errados.
import raw from './alternativas.json';
import { parseAlternativas } from '../lib/tokenize';

export const alternativas = parseAlternativas(raw);
