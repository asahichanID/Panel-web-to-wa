/**
 * apiGlobal/providers/uguu.provider.js
 * -----------------------------------------------------------------------
 * Provider: uguu.se — layanan upload file sementara.
 * (Sebelumnya diimplementasikan di lib/uploader.js sebagai `UguuSe()`.)
 */

import fs from 'fs';
import FormData from 'form-data';
import FileType from 'file-type';
import { request } from '../core/httpClient.js';

export function uguuUpload(filePath, timeout) {
	return {
		name: 'uguu',
		timeout,
		run: async () => {
			const form = new FormData();
			const fileType = await FileType.fromFile(filePath);
			const ext = fileType ? fileType.ext : 'bin';
			form.append('files[]', fs.createReadStream(filePath), { filename: `data.${ext}` });

			const data = await request({
				url: 'https://uguu.se/upload.php',
				method: 'POST',
				data: form,
				timeoutMs: timeout
			});

			return data?.files?.[0];
		}
	};
}

export default { uguuUpload };
