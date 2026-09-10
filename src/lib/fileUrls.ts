import { getSignedUrl } from '@/lib/minio'

export type FileUrlStrategy = 'signed' | 'stream' | 'preview'

export interface BuildFileUrlOptions {
	strategy?: FileUrlStrategy
	expiresInSeconds?: number
	fileName?: string
	applicantId?: string
	headcountId?: string
}

const DEFAULT_EXPIRES = 60 * 60 // 1 hour

export async function buildServerFileUrl(filePath: string, opts: BuildFileUrlOptions = {}): Promise<string> {
	// 🔒 SECURITY: Default to stream URLs (web application) instead of direct MinIO URLs
	// This ensures all files are served through the application's authentication layer
	const strategy = opts.strategy || 'stream'
	
	if (strategy === 'signed') {
		const expires = typeof opts.expiresInSeconds === 'number' ? opts.expiresInSeconds : DEFAULT_EXPIRES
		return await getSignedUrl(filePath, expires)
	}
	
	if (strategy === 'preview') {
		// preview URL for iframe and img elements that need authentication
		const params = new URLSearchParams({ filePath })
		if (opts.fileName) params.set('fileName', opts.fileName)
		if (opts.applicantId) params.set('applicantId', opts.applicantId)
		if (opts.headcountId) params.set('headcountId', opts.headcountId)
		return `/api/secure-file/preview?${params.toString()}`
	}
	
	// stream URL for server contexts (e.g., include in internal payloads where receiver can call back with auth)
	const params = new URLSearchParams({ filePath })
	if (opts.fileName) params.set('fileName', opts.fileName)
	if (opts.applicantId) params.set('applicantId', opts.applicantId)
	if (opts.headcountId) params.set('headcountId', opts.headcountId)
	return `/api/secure-file/stream?${params.toString()}`
}

export function buildClientStreamUrl(filePath: string, opts: Omit<BuildFileUrlOptions, 'strategy'> = {}): string {
	const params = new URLSearchParams({ filePath })
	if (opts.fileName) params.set('fileName', opts.fileName)
	if (opts.applicantId) params.set('applicantId', opts.applicantId)
	if (opts.headcountId) params.set('headcountId', opts.headcountId)
	return `/api/secure-file/stream?${params.toString()}`
}
