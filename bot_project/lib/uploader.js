/**
 * ⚠️ DEPRECATED — TIDAK DIPAKAI LAGI DI PROJECT INI.
 * Sudah digantikan oleh apiGlobal (lihat apiGlobal/services/upload/uploader.js
 * dan panggil lewat `apiUploadFile()` dari apiGlobal/index.js). File ini
 * sengaja tidak dihapus demi kompatibilitas ke belakang.
 */
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import FileType from 'file-type';

async function UguuSe(filePath) {
	return new Promise(async (resolve, reject) => {
		try {
			const form = new FormData();
			const fileType = await FileType.fromFile(filePath);
			const ext = fileType ? fileType.ext : 'bin';
			form.append('files[]', fs.createReadStream(filePath), { filename: 'data.' + ext });
			const data = await axios.post('https://uguu.se/upload.php', form, {
				headers: {
					...form.getHeaders()
				}
			})
			resolve(data.data.files[0])
		} catch (e) {
			reject(e)
		}
	})
}

export { UguuSe }