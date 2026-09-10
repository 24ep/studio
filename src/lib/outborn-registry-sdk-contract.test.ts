import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function readJson(path: string): Record<string, any> {
  return JSON.parse(readFileSync(join(root, path), 'utf8')) as Record<string, any>
}

describe('Outborn Registry SDK dependency contract', () => {
  it('uses canonical Outborn package names and pinned Registry releases', () => {
    const manifest = readJson('package.json')
    const dependencies = manifest.dependencies ?? {}

    expect(dependencies['@alphayard/appkit']).toBeUndefined()
    expect(dependencies['@outborn/appkit-sdk']).toBe('2.1.2')
    expect(dependencies['@outborn/account-directory']).toBe('0.1.4')
  })

  it('resolves AppKit and Account Directory only through registry.outborn.co', () => {
    const lock = readJson('package-lock.json')
    const packages = lock.packages ?? {}
    const appkit = packages['node_modules/@outborn/appkit-sdk']
    const accountDirectory = packages['node_modules/@outborn/account-directory']

    expect(appkit?.version).toBe('2.1.2')
    expect(appkit?.resolved).toMatch(/^https:\/\/registry\.outborn\.co\/@outborn\/appkit-sdk\//)
    expect(accountDirectory?.version).toBe('0.1.4')
    expect(accountDirectory?.resolved).toMatch(/^https:\/\/registry\.outborn\.co\/@outborn\/account-directory\//)

    const serializedLock = JSON.stringify(lock)
    expect(serializedLock).not.toContain('@alphayard/appkit')
    expect(serializedLock).not.toContain('appkit-sdk-release-production.up.railway.app')
    expect(serializedLock).not.toContain('account-directory-sdk-release-production.up.railway.app')
  })

  it('keeps the Outborn npm scope canonical and Docker builds free of release-service fallbacks', () => {
    const npmrc = readFileSync(join(root, '.npmrc'), 'utf8')
    const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8')

    expect(npmrc).toContain('@outborn:registry=https://registry.outborn.co')
    expect(dockerfile).not.toContain('appkit-sdk-release-production.up.railway.app')
    expect(dockerfile).not.toContain('account-directory-sdk-release-production.up.railway.app')
  })
})
