import yaml from 'yaml'

export function parseYaml<T = unknown>(content: string): T {
  const processedContent = content.replace(/(short-id:\s*)([^"\s\n]+)/g, '$1"$2"')

  const result =
    yaml.parse(processedContent, {
      merge: true
    }) || {}
  return result as T
}

export function stringifyYaml(data: unknown): string {
  return yaml.stringify(data)
}
