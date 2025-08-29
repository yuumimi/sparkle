import yaml from 'yaml'

export function parseYaml<T = unknown>(content: string): T {
  const processedContent = content.replace(
    /^(\s*short-id:\s*)([^"\s\n}{]+)/gm,
    (match, prefix, value) => {
      const nullValues = ['null', 'Null', 'NULL', '~']
      return nullValues.includes(value) ? match : `${prefix}"${value}"`
    }
  )

  const result =
    yaml.parse(processedContent, {
      merge: true
    }) || {}
  return result as T
}

export function stringifyYaml(data: unknown): string {
  return yaml.stringify(data)
}
