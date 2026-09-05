/**
 * apiGlobal/index.js
 * =========================================================================
 * GERBANG UTAMA apiGlobal.
 *
 * Ini adalah SATU-SATUNYA file yang boleh diimpor oleh command/file lain
 * di luar folder apiGlobal. Sesuai API_ARCHITECTURE.md:
 *
 *   import { apiPlay, apiYoutubeDownload, apiOguriChat } from './apiGlobal/index.js'
 *
 * Command tidak perlu (dan tidak boleh) mengimpor langsung dari
 * apiGlobal/providers/, apiGlobal/core/, atau apiGlobal/services/**
 * — seluruhnya sudah diekspor ulang di sini.
 *
 * Setiap fungsi `api*` mengembalikan bentuk konsisten:
 *   { result: <data>, provider: <nama provider yang berhasil>, raw: <response asli> }
 * kecuali disebutkan lain di komentar masing-masing file layanan.
 *
 * Jika seluruh provider suatu layanan gagal, fungsi akan melempar
 * `AllProvidersFailedError` (lihat core/errors.js) — tangkap dengan
 * try/catch seperti biasa di command.
 * =========================================================================
 */

// ---- Downloader -----------------------------------------------------
export { apiYoutubeAudio, apiYoutubeDownload, apiYoutubeSearch } from './services/downloader/youtube.js';
export { apiPlay } from './services/downloader/play.js';
export { apiTiktokDownload } from './services/downloader/tiktok.js';
export { apiInstagramDownload } from './services/downloader/instagram.js';
export { apiFacebookDownload } from './services/downloader/facebook.js';
export { apiMediafireDownload } from './services/downloader/mediafire.js';
export { apiSpotifySearch, apiSpotifyDownload } from './services/downloader/spotify.js';

// ---- AI ---------------------------------------------------------------
export { apiAiChat4, apiAiQuick, apiAiPremiumChat, apiOguriChat } from './services/ai/ai.js';

// ---- Creator / Maker ----------------------------------------------------
export {
	apiIqcCreate,
	apiQuoteCreate,
	apiBratSticker,
	apiBratVideoFrame,
	apiWastedImage,
	apiTriggeredImage,
	apiNulisCreate
} from './services/creator/maker.js';
export { apiSkinTone } from './services/creator/skintone.js';

// ---- Tools --------------------------------------------------------------
export { apiTextToSpeech } from './services/tools/tts.js';
export { apiTranslate } from './services/tools/translate.js';
export { apiQrCodeGenerate } from './services/tools/qrcode.js';
export { apiRemini } from './services/tools/remini.js';
export { apiRecolor } from './services/tools/recolor.js';
export { apiScreenshot } from './services/tools/screenshot.js';
export { apiWeather } from './services/tools/weather.js';
export { apiEmojiMix } from './services/tools/emojimix.js';
export { apiStyleText } from './services/tools/styletext.js';
export { apiShortlink } from './services/tools/shortlink.js';

// ---- Search ---------------------------------------------------------------
export {
	apiSearchGoogle,
	apiSearchPixiv,
	apiSearchMeloboom,
	apiSearchNpm,
	apiSearchTenor
} from './services/search/search.js';
export { apiPinterestSearch } from './services/search/pinterest.js';

// ---- Random content ---------------------------------------------------
export {
	apiRandomMotivasi,
	apiRandomBijak,
	apiRandomDare,
	apiRandomQuotes,
	apiRandomTruth,
	apiRandomRenungan,
	apiRandomBucin,
	apiRandomColorBlind
} from './services/random/random.js';

// ---- Games (soal tebak-tebakan) ----------------------------------------
export {
	apiGameTekaTeki,
	apiGameTebakLirik,
	apiGameTebakKata,
	apiGameFamily100,
	apiGameSusunKata,
	apiGameTebakKimia,
	apiGameCakLontong,
	apiGameTebakNegara,
	apiGameTebakGambar,
	apiGameTebakBendera
} from './services/games/games.js';
export { apiChessBoardImage } from './services/games/chessboard.js';

// ---- Anime & Lyrics -----------------------------------------------------
export { apiWaifuRandom } from './services/anime/waifu.js';
export { apiAnimeSearch } from './services/anime/anime.js'; // NeoXR /anime — belum ada command yang memakainya di naze.js
export { apiLyricsSearch } from './services/lyrics/lyrics.js'; // placeholder, lihat AUDIT_REPORT.md

// ---- Misc (GitHub, Urban Dictionary, Coffee) ---------------------------
export { apiGithubUser } from './services/misc/github.js';
export { apiUrbanDefine } from './services/misc/urbandictionary.js';
export { apiRandomCoffee } from './services/misc/coffee.js';
export { apiAgifyPredict } from './services/misc/agify.js';

// ---- Upload -------------------------------------------------------------
export { apiUploadFile } from './services/upload/uploader.js';

// ---- Error classes (opsional, untuk instanceof di command bila perlu) --
export {
	ApiGlobalError,
	ProviderError,
	TimeoutError,
	AllProvidersFailedError,
	ValidationError,
	NotImplementedError
} from './core/errors.js';
