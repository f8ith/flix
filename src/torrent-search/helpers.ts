import { get, Response } from 'superagent'

import * as cheerio from 'cheerio'

import { Provider, ProviderError } from './providers'
import { CheerioAPI } from 'cheerio'

export function formatMagnet(
  infoHash: string,
  name: string,
  trackers: string[]
) {
  const trackersQueryString = trackers.length
    ? `&tr=${trackers.map(encodeURIComponent).join('&tr=')}`
    : ''
  return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(
    name
  )}${trackersQueryString}`
}

const defaultHeaders = {
  'User-Agent': `flix (+https://github.com/f8ith/flix)`,
}

export async function loadPage(url: string): Promise<Response> {
  const response = get(url)
    .set(
      'User-Agent',
      'torrent-stream-server (+https://github.com/KiraLT/torrent-stream-server)'
    )
    .send()

  if (!response.ok) {
    throw new Error('Failed to load results')
  }

  return response
}

export async function loadJson<T>(url: string): Promise<T> {
  return loadPage(url).then((v) => JSON.parse(v.text))
}

export async function crawlPage(url: string): Promise<{ $: CheerioAPI }> {
  const response = await loadPage(url)

  return {
    $: cheerio.load(response.text),
  }
}

export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export async function executeProviders<T>(
  providers: Provider[],
  callback: (provider: Provider) => T | Promise<T>
): Promise<{ items: T[]; errors: ProviderError[] }> {
  const responses = await Promise.all(
    providers.map((v) =>
      Promise.resolve(callback(v)).catch((err) => ({
        error: parseErrorMessage(err),
        provider: v.providerName,
      }))
    )
  )

  return {
    items: responses.filter((v): v is any => !('error' in v)),
    errors: responses.filter((v): v is ProviderError => 'error' in v),
  }
}
