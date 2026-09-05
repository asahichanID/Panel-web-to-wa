/**
 * apiGlobal/core/httpClient.js
 * -----------------------------------------------------------------------
 * Lapisan paling bawah untuk melakukan request HTTP sesungguhnya.
 *
 * File ini SENGAJA dibuat independen (tidak mengimpor apa pun dari luar
 * folder apiGlobal) supaya seluruh folder apiGlobal bisa berdiri sendiri
 * sesuai "Prinsip Dependency" di Part 2 API_ARCHITECTURE.md.
 *
 * Hanya file di dalam apiGlobal/providers/*.provider.js yang boleh
 * memanggil httpClient ini secara langsung. Service files (mis.
 * services/downloader/youtube.js) tidak boleh memanggil httpClient
 * secara langsung — mereka hanya boleh memanggil provider.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';

// Agent khusus: tidak menolak sertifikat SSL yang tidak valid (banyak API
// gratis/pihak ketiga memakai sertifikat yang kadang bermasalah). Perilaku
// ini SAMA dengan agent yang sudah dipakai project sebelumnya (lib/function.js)
// supaya tidak ada regresi kompatibilitas saat migrasi.
const relaxedAgent = new https.Agent({ rejectUnauthorized: false });

const DEFAULT_HEADERS = {
	'user-agent': 'Mozilla/5.0 (Linux; Android 15) apiGlobal/1.0'
};

function resolveTempDir() {
	const dir = path.join(process.cwd(), 'database', 'temp');
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	return dir;
}

function guessExtension(res, fallback = 'tmp') {
	const contentDisp = res.headers?.['content-disposition'];
	const contentType = res.headers?.['content-type'];

	if (contentDisp?.includes('filename=')) {
		const match = contentDisp.match(/filename="?([^"]+)"?/);
		if (match?.[1]) return match[1].split('.').pop();
	}

	if (contentType) {
		let ext = contentType.split('/')[1]?.split(';')[0];
		if (ext === 'jpeg') ext = 'jpg';
		if (ext) return ext;
	}

	return fallback;
}

/**
 * Simpan response stream ke file sementara di database/temp dan
 * kembalikan path-nya. Dipakai untuk hasil biner besar (audio/video/gambar)
 * supaya tidak membengkak di memori.
 */
async function streamToTempFile(res, { destination, extensionHint } = {}) {
	const ext = extensionHint || guessExtension(res);
	const filePath = destination || path.join(resolveTempDir(), `apiglobal-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`);
	const writer = fs.createWriteStream(filePath);

	await new Promise((resolve, reject) => {
		res.data.pipe(writer);
		writer.on('finish', resolve);
		writer.on('error', reject);
	});

	return filePath;
}

/**
 * Eksekusi satu request HTTP.
 *
 * @param {Object} opts
 * @param {string} opts.url - URL lengkap tujuan.
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [opts.method='GET']
 * @param {Object} [opts.params] - Query string (untuk GET) atau body (non-GET, non-form).
 * @param {Object|import('form-data')} [opts.data] - Body mentah (form-data / object JSON).
 * @param {Object} [opts.headers]
 * @param {number} [opts.timeoutMs=15000]
 * @param {'json'|'buffer'|'stream'|'text'} [opts.responseType='json']
 * @param {string} [opts.streamTo] - Path tujuan file jika responseType='stream'.
 * @param {string} [opts.extensionHint] - Ekstensi file jika responseType='stream'.
 */
export async function request(opts) {
	const {
		url,
		method = 'GET',
		params,
		data,
		headers = {},
		timeoutMs = 15000,
		responseType = 'json',
		streamTo,
		extensionHint
	} = opts;

	const isForm = data && typeof data.getHeaders === 'function';

	const axiosConfig = {
		method,
		url,
		httpsAgent: relaxedAgent,
		timeout: timeoutMs,
		headers: {
			...DEFAULT_HEADERS,
			...headers,
			...(isForm ? data.getHeaders() : {})
		},
		responseType:
			responseType === 'buffer' ? 'arraybuffer'
			: responseType === 'stream' ? 'stream'
			: responseType === 'text' ? 'text'
			: 'json'
	};

	if (method.toUpperCase() === 'GET') {
		axiosConfig.params = { ...params, ...(data && !isForm ? data : {}) };
	} else {
		axiosConfig.data = isForm ? data : (data ?? params);
	}

	const res = await axios(axiosConfig);

	if (responseType === 'stream') {
		return streamToTempFile(res, { destination: streamTo, extensionHint });
	}

	if (responseType === 'buffer') {
		return Buffer.from(res.data);
	}

	return res.data;
}

export default { request };
