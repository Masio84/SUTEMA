/** Remove accents/diacritics for fuzzy matching */
export const removeAccents = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/** Converts "JUAN PABLO" or "juan pablo" to "Juan Pablo" */
export const toTitleCase = (str: string): string =>
    str
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()

/** Normalize sexo: handles abbreviations, typos, incomplete words */
export const normalizeSexo = (raw: string): 'Masculino' | 'Femenino' | 'Otro' => {
    if (!raw) return 'Masculino'
    const s = removeAccents(raw.toLowerCase().trim())
    if (/^(m|masc|masculine|hombre|h|masculino)/.test(s)) return 'Masculino'
    if (/^(f|fem|femenino|feme|mujer|w|woman)/.test(s)) return 'Femenino'
    return 'Otro'
}

/**
 * Normalize estado_civil: handles abbreviations, typos, incomplete words
 * DB enum: 'Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión Libre'
 */
export const normalizeEstadoCivil = (raw: string): string => {
    if (!raw) return 'Soltero/a'
    const s = removeAccents(raw.toLowerCase().trim())
    if (/^(sol|solt|solter|soltero|soltera)/.test(s)) return 'Soltero/a'
    if (/^(cas|casad|casado|casada)/.test(s)) return 'Casado/a'
    if (/^(div|divorc|divorciad|divorciado|divorciada)/.test(s)) return 'Divorciado/a'
    if (/^(viu|viud|viudo|viuda)/.test(s)) return 'Viudo/a'
    if (/^(uni|union libre|unio|uli|u\.l\.|ul)/.test(s)) return 'Unión Libre'
    return 'Soltero/a' // safe default
}

/**
 * Normalize estatus
 */
export const normalizeEstatus = (raw: string | null | undefined): string => {
    if (!raw) return 'activo'
    const s = removeAccents(raw.toLowerCase().trim())
    if (/jubil/.test(s)) return 'jubilado'
    if (/baja/.test(s)) return 'baja'
    if (/inact/.test(s)) return 'inactivo'
    return 'activo'
}

/** Smart matcher using highly distinctive keywords/regex to catch typos */
export const getOfficialAdscripcionName = (rawInput: string): string | null => {
    if (!rawInput) return null

    const normalized = removeAccents(rawInput.toLowerCase().trim())

    if (normalized.includes('pabell') || normalized.includes('arteaga')) return 'Hospital General de Pabellón de Arteaga'
    if (normalized.includes('rincon') || normalized.includes('romo')) return 'Hospital General de Rincón de Romo'
    if (normalized.includes('calvill')) return 'Hospital General de Calvillo'
    if (normalized.includes('tercer milenio') || normalized.includes('3er milenio') || normalized.includes('tercer m')) return 'Hospital General Tercer Milenio'
    if (normalized.includes('mujer')) return 'Hospital de la Mujer'

    if (normalized.includes('oficina') || normalized.match(/^o\.?c\.?\b/)) return 'Oficinas Centrales'

    if (normalized.includes('distrito sanitario 1') || normalized.match(/\bds\s*1\b/) || normalized.match(/\bdistrito\s*1\b/) || normalized.includes('sanitario 1')) return 'Distrito Sanitario 1'
    if (normalized.includes('distrito sanitario 2') || normalized.match(/\bds\s*2\b/) || normalized.match(/\bdistrito\s*2\b/) || normalized.includes('sanitario 2')) return 'Distrito Sanitario 2'
    if (normalized.includes('distrito sanitario 3') || normalized.match(/\bds\s*3\b/) || normalized.match(/\bdistrito\s*3\b/) || normalized.includes('sanitario 3')) return 'Distrito Sanitario 3'

    if (normalized.includes('lesp') || normalized.includes('estatal de salud publica')) return 'LESP'
    if (normalized.includes('cets') || normalized.includes('transfusion sanguinea')) return 'CETS'
    if (normalized.includes('vih') || normalized.includes('capacits')) return 'VIH'
    if (normalized.includes('uneme')) return 'UNEME'
    if (normalized.includes('seem') || normalized.includes('emergencias medicas')) return 'SEEM'
    if (normalized.includes('regulacion sanitaria')) return 'Regulación Sanitaria'
    if (normalized.includes('agua clara') || normalized.includes('salud mental')) return 'Agua Clara'
    if (normalized.includes('cereso')) return 'CERESO'
    if (normalized.includes('issea')) return 'OTRO'

    return null // Return null instead of verbatim for easier detection of "unidentified"
}
