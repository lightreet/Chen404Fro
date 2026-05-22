const CITY_NAME_ALIASES: Record<string, string[]> = {
  北京: ['北京市'],
  上海: ['上海市'],
  天津: ['天津市'],
  重庆: ['重庆市'],
  香港: ['香港特别行政区'],
  澳门: ['澳门特别行政区'],
  深圳: ['深圳市'],
  广州: ['广州市'],
  厦门: ['厦门市'],
  西安: ['西安市'],
  恩施: ['恩施土家族苗族自治州'],
  湘西: ['湘西土家族苗族自治州'],
  延边: ['延边朝鲜族自治州'],
  大理: ['大理白族自治州'],
  德宏: ['德宏傣族景颇族自治州'],
  西双版纳: ['西双版纳傣族自治州'],
  伊犁: ['伊犁哈萨克自治州'],
}

const CITY_SUFFIXES = [
  '特别行政区',
  '土家族苗族自治州',
  '哈萨克自治州',
  '朝鲜族自治州',
  '傣族景颇族自治州',
  '傣族自治州',
  '白族自治州',
  '藏族自治州',
  '蒙古自治州',
  '回族自治州',
  '自治州',
  '地区',
  '盟',
  '市',
  '州',
]

function cleanCityName(value?: string | null) {
  return (value ?? '').trim().replace(/\s+/g, '')
}

export function normalizeCityName(value?: string | null) {
  let name = cleanCityName(value)
  if (!name) return ''

  for (const suffix of CITY_SUFFIXES) {
    if (name.length > suffix.length + 1 && name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length)
      break
    }
  }

  return name
}

export function getCityNameCandidates(...values: Array<string | null | undefined>) {
  const candidates = new Set<string>()

  values.forEach((value) => {
    const original = cleanCityName(value)
    const normalized = normalizeCityName(original)
    const seedNames = [original, normalized].filter(Boolean)

    seedNames.forEach((name) => {
      candidates.add(name)
      CITY_NAME_ALIASES[name]?.forEach((alias) => {
        candidates.add(alias)
        candidates.add(normalizeCityName(alias))
      })
    })
  })

  return candidates
}

export function hasCityNameIntersection(
  left: Set<string>,
  right: Set<string>,
) {
  for (const value of left) {
    if (right.has(value)) {
      return true
    }
  }
  return false
}
