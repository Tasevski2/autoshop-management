const ONES = [
  '', 'еден', 'два', 'три', 'четири', 'пет', 'шест', 'седум', 'осум', 'девет',
  'десет', 'единаесет', 'дванаесет', 'тринаесет', 'четиринаесет', 'петнаесет',
  'шеснаесет', 'седумнаесет', 'осумнаесет', 'деветнаесет',
]

const TENS = [
  '', '', 'дваесет', 'триесет', 'четириесет', 'педесет',
  'шеесет', 'седумдесет', 'осумдесет', 'деведесет',
]

const HUNDREDS = [
  '', 'сто', 'двесте', 'триста', 'четиристо', 'петсто',
  'шестсто', 'седумсто', 'осумсто', 'деветсто',
]

function chunkToWords(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ONES[n]
  if (n < 100) {
    const t = Math.floor(n / 10)
    const o = n % 10
    return TENS[t] + (o ? 'и' + ONES[o] : '')
  }
  const h = Math.floor(n / 100)
  const rest = n % 100
  return HUNDREDS[h] + (rest ? (rest < 20 ? 'и' : 'и') + chunkToWords(rest) : '')
}

/**
 * Converts a number to Macedonian words.
 * E.g. 2500 → "двеилјадиипетстотини"
 * Supports up to 999,999.
 */
export function numberToWordsMk(num: number): string {
  if (num === 0) return 'нула'

  const n = Math.floor(Math.abs(num))

  if (n < 1000) {
    return chunkToWords(n).toUpperCase() + 'ДЕНАРИ'
  }

  const thousands = Math.floor(n / 1000)
  const remainder = n % 1000

  let result: string

  if (thousands === 1) {
    result = 'илјада'
  } else if (thousands === 2) {
    result = 'двеилјади'
  } else {
    result = chunkToWords(thousands) + 'илјади'
  }

  if (remainder > 0) {
    result += 'и' + chunkToWords(remainder)
  }

  return result.toUpperCase() + 'ДЕНАРИ'
}
