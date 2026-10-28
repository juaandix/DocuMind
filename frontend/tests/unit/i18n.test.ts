import { describe, it, expect } from 'vitest'
import { i18n } from '@/i18n'
import en from '@/i18n/en'
import es from '@/i18n/es'

type Tree = { [key: string]: string | Tree }

function leafKeys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : leafKeys(v, `${prefix}${k}.`),
  )
}

const params = { n: 2, name: 'Ana', score: '0.91', date: 'Oct 1', size: '1 MB', plan: 'PRO', tag: 'x', workspace: 'Acme', inviter: 'Ana' }

describe('i18n messages', () => {
  it('Spanish has exactly the English keys', () => {
    expect(leafKeys(es as Tree).sort()).toEqual(leafKeys(en as Tree).sort())
  })

  for (const locale of ['en', 'es'] as const) {
    it(`every ${locale} message compiles and resolves`, () => {
      i18n.global.locale.value = locale
      for (const key of leafKeys(en as Tree)) {
        // A message that fails to compile (e.g. an unescaped "@") throws here.
        const out = i18n.global.t(key, params, 2)
        expect(out, key).not.toBe(key)
        expect(out, key).not.toMatch(/\{[a-z]+\}/)
      }
    })
  }
})
