import '../settings.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import FileType from 'file-type';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import PhoneNumber from 'awesome-phonenumber';

import { checkStatus } from './database.js';
import { acquireCommandSlot } from '../musume/absoluteGuard.js';
import { createSticker } from '../musume/sticker/sticker.js';
import { imageToWebp, videoToWebp, writeExif, gifToWebp } from '../lib/exif.js';
import { getBuffer, getSizeMedia, fetchJson, sleep, axiosss, fixBytes } from '../lib/function.js';
import { jidNormalizedUser, proto, getBinaryNodeChildren, getBinaryNodeChildString, getBinaryNodeChild, generateMessageIDV2, jidEncode, encodeSignedDeviceIdentity, generateWAMessageContent, generateForwardMessageContent, prepareWAMessageMedia, delay, areJidsSameUser, extractMessageContent, generateMessageID, downloadContentFromMessage, generateWAMessageFromContent, jidDecode, generateWAMessage, toBuffer, getContentType, getDevice } from 'baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nazePath = fileURLToPath(new URL('../naze.js', import.meta.url));

let nazeHandler = null;
const botStartTime = Date.now();
const groupMetadataTimers = {};

/*
	* Create By Naze
	* Follow https://github.com/nazedev
	* Whatsapp : https://whatsapp.com/channel/0029VaWOkNm7DAWtkvkJBK43
*/

const reloadHandler = async () => {
	try {
		nazeHandler = (await import(`../naze.js?update=${Date.now()}`)).default;
	} catch (err) {
		console.error(chalk.redBright(`[ERROR] ${err}`));
	}
};

reloadHandler();

// ============================================================
// 🧵 QUEUE (audit): SELURUH command wajib lewat absoluteGuard.js
// ============================================================
// Titik masuk TUNGGAL untuk semua pesan/command. Dengan menaruh
// queue di sini (bukan menyalin-ulang ke setiap file command),
// otomatis SELURUH command (.play, .tiktok, .ai, .menu, dst)
// ikut ter-queue tanpa perlu mengedit satu-satu.
//
// - Command dari sender+chat yang SAMA di-antrikan (tidak boleh
//   berjalan bersamaan / anti race condition kalau user spam).
// - Command dari user/chat LAIN tidak terpengaruh sama sekali.
// - Error di dalam handler ditangkap di sini (tidak lagi jadi
//   unhandled rejection yang berisiko menjatuhkan bot).
async function dispatchNazeHandler(naze, m, msg, store) {
	const slot = await acquireCommandSlot(m.sender, m.chat);
	try {
		await nazeHandler(naze, m, msg, store);
	} catch (err) {
		console.error(chalk.redBright(`[HANDLER ERROR] ${err?.stack || err}`));
	} finally {
		slot.release();
	}
}

async function GroupUpdate(naze, m, store) {
	function clearParse(parse) {
		try {
			return JSON.parse(parse);
		} catch {
			return parse;
		}
	}
	if (!m.messageStubType || !m.isGroup) return
	if (global.db?.groups?.[m.chat] && store?.groupMetadata?.[m.chat]) {
		const admin = `@${m.sender.split('@')[0]}`
		const metadata = store.groupMetadata[m.chat];
		const normalizedTarget = clearParse(m.messageStubParameters[0]);
		const type = m.messageStubType;
		const messages = {
			1: 'mereset link grup!',
			21: `mengubah Subject Grup menjadi :\n*${normalizedTarget}*`,
			22: 'telah mengubah icon grup.',
			23: 'mereset link grup!',
			24: `mengubah deskripsi grup.\n\n${normalizedTarget}`,
			25: `telah mengatur agar *${normalizedTarget == 'on' ? 'hanya admin' : 'semua peserta'}* yang dapat mengedit info grup.`,
			26: `telah *${normalizedTarget == 'on' ? 'menutup' : 'membuka'}* grup!\nSekarang ${normalizedTarget == 'on' ? 'hanya admin yang' : 'semua peserta'} dapat mengirim pesan.`,
			29: `telah menjadikan @${normalizedTarget?.id?.split('@')?.[0]} sebagai admin.`,
			30: `telah memberhentikan @${normalizedTarget?.id?.split('@')?.[0]} dari admin.`,
			72: `mengubah durasi pesan sementara menjadi *@${normalizedTarget}*`,
			123: 'menonaktifkan pesan sementara.',
			132: 'mereset link grup!',
			172: `@${normalizedTarget?.pn?.split('@')?.[0]} meminta bergabung`,
		}
		if (naze.public && global.db?.groups?.[m.chat]?.setinfo && messages[type]) {
			await naze.sendMessage(m.chat, { text: `${admin} ${messages[type]}`, mentions: [m.sender, ...((normalizedTarget?.id || normalizedTarget)?.includes('@') ? [`${normalizedTarget.id || normalizedTarget}`] : [])].filter(Boolean)}, { ephemeralExpiration: m.expiration || m?.metadata?.ephemeralDuration || store?.messages[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 })
		}
		if (type === 20) {
			clearTimeout(groupMetadataTimers[m.chat])
			groupMetadataTimers[m.chat] = setTimeout(async () => {
				store.groupMetadata[m.chat] = await naze.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
			}, 5000);
		} else if (type === 29 || type === 30) {
			const target = jidNormalizedUser(normalizedTarget.id || normalizedTarget)
			const newAdminValue = type === 29 ? 'admin' : null
			if (metadata?.participants?.length) {
				metadata.participants = metadata.participants.map(p => {
					const key = metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)
					if (key === target) {
						return { ...p, admin: newAdminValue }
					}
					return p
				})
			}
		} else if (type === 27) {
			if (!metadata.participants.some(a => (a.id === (normalizedTarget.id || normalizedTarget) || a.phoneNumber === (normalizedTarget.id || normalizedTarget)))) {
				clearTimeout(groupMetadataTimers[m.chat])
				groupMetadataTimers[m.chat] = setTimeout(async () => {
					store.groupMetadata[m.chat] = await naze.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
				}, 5000);
			}
		} else if (type === 28 || type === 32) {
			if (m.fromMe && ((jidNormalizedUser(naze.user.id) == (normalizedTarget.id || normalizedTarget)) || (jidNormalizedUser(naze.user.lid) == (normalizedTarget.id || normalizedTarget)))) {
				delete store.messages[m.chat];
				delete store.presences[m.chat];
				delete store.groupMetadata[m.chat];
			}
			if(!!metadata) metadata.participants = metadata.participants.filter(p => {
				const key = metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)
				return key !== (normalizedTarget.id || normalizedTarget)
			});
		} else {
			console.log({
				messageStubType: m.messageStubType, type,
				messageStubParameters: m.messageStubParameters,
			})
		}
	}
}

async function GroupParticipantsUpdate(naze, update, store) {
	try {
		const { id, participants, author, action } = update;

		function updateAdminStatus(participants, metadataParticipants, status) {
			for (const participant of metadataParticipants) {
				if (
					participants.includes(jidNormalizedUser(participant.id)) ||
					participants.includes(jidNormalizedUser(participant.phoneNumber))
				) {
					participant.admin = status;
				}
			}
		}

		if (global.db?.groups?.[id] && store?.groupMetadata?.[id]) {
			const metadata = store.groupMetadata[id];

			const jids = participants.map(v =>
				typeof v === 'string'
					? v
					: (v?.id || v?.phoneNumber || '')
			);

			const fallback =
				'https://telegra.ph/file/95670d63378f7f4210f03.png';

			const profileResults = await Promise.allSettled(
				jids.map(jid => naze.profilePictureUrl(jid, 'image'))
			);

			for (let i = 0; i < jids.length; i++) {

				const jid = jids[i];

				const profile =
					profileResults[i]?.status === 'fulfilled'
						? profileResults[i].value
						: fallback;

				let messageText;

				if (action === 'add') {

					if (global.db.groups[id]?.welcome)
						messageText =
							global.db.groups[id]?.text?.setwelcome ||
							`Welcome to ${metadata.subject}\n@`;

					clearTimeout(groupMetadataTimers[id]);

					groupMetadataTimers[id] = setTimeout(async () => {
						store.groupMetadata[id] =
							await naze.groupMetadata(id).catch(() => ({
								...store.groupMetadata[id]
							}));
					}, 5000);

				} else if (action === 'remove') {

					if (global.db.groups[id]?.leave)
						messageText =
							global.db.groups[id]?.text?.setleave ||
							`@\nLeaving From ${metadata.subject}`;

					if (
						jidNormalizedUser(naze.user.lid) === jidNormalizedUser(jid) ||
						jidNormalizedUser(naze.user.id) === jidNormalizedUser(jid)
					) {
						delete store.messages[id];
						delete store.presences[id];
						delete store.groupMetadata[id];
					}

					if (metadata) {
						metadata.participants =
							metadata.participants.filter(
								p =>
									!participants.includes(
										metadata.addressingMode === 'lid'
											? jidNormalizedUser(p.id)
											: jidNormalizedUser(p.phoneNumber)
									)
							);
					}

				} else if (action === 'promote') {

					if (global.db.groups[id]?.promote)
						messageText =
							global.db.groups[id]?.text?.setpromote ||
							`@\nPromote From ${metadata.subject}\nBy @admin`;

					updateAdminStatus(
						participants,
						metadata.participants,
						'admin'
					);

				} else if (action === 'demote') {

					if (global.db.groups[id]?.demote)
						messageText =
							global.db.groups[id]?.text?.setdemote ||
							`@\nDemote From ${metadata.subject}\nBy @admin`;

					updateAdminStatus(
						participants,
						metadata.participants,
						null
					);

				}

				if (messageText && naze.public) {

					await naze.sendMessage(
						id,
						{
							text: messageText
								.replace('@subject', metadata.subject)
								.replace(
									'@admin',
									author
										? `@${author.split('@')[0]}`
										: '@admin'
								)
								.replace(
									/(?<=\s|^)@(?!\w)/g,
									`@${jid.split('@')[0]}`
								),

							contextInfo: {
								mentionedJid: [jid, author].filter(Boolean),

								externalAdReply: {
									title:
										action === 'add'
											? 'Welcome'
											: action === 'remove'
											? 'Leaving'
											: action.charAt(0).toUpperCase() +
											  action.slice(1),

									mediaType: 1,
									previewType: 0,
									thumbnailUrl: profile,
									renderLargerThumbnail: true,
									sourceUrl: global.my.gh
								}
							}
						},
						{
							ephemeralExpiration:
								metadata?.ephemeralDuration ||
								store?.messages[id]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration ||
								0
						}
					);

				}
			}
		}
	} catch (e) {
		throw e;
	}
}

async function LoadDataBase(naze, m) {
	try {
		const botNumber = naze.decodeJid(naze.user.id);
		let game = global.db.game || {};
		let premium = global.db.premium || [];
		let user = global.db.users[m.sender] || {};
		let setBot = global.db.set[botNumber] || {};
		
		global.db.game = game;
		global.db.users[m.sender] = user;
		global.db.set[botNumber] = setBot;
		global.db.oguriAI ??= {};
		if (!global.db.bank)
    	global.db.bank = {
		kas: 1000000000,
		totalPajak: 0,
		totalTarik: 0,
		totalTransaksi: 0,
		danaMasuk: 0,
		danaKeluar: 0,
		totalRace: 0,
		totalFeed: 0,
		totalPembelian: 0,
		aktivitas: [],
		createdAt: Date.now()
	    }

        let bank = global.db.bank

if (bank.danaMasuk == null)
	bank.danaMasuk = 0

if (bank.danaKeluar == null)
	bank.danaKeluar = 0

if (bank.totalRace == null)
	bank.totalRace = 0

if (bank.totalFeed == null)
	bank.totalFeed = 0

if (bank.totalPembelian == null)
	bank.totalPembelian = 0

if (bank.kas == null)
	bank.kas = 1000000000

if (!Array.isArray(bank.aktivitas))
	bank.aktivitas = []
		
		const defaultSetBot = {
			lang: 'id',
			limit: 0,
			money: 0,
			status: 0,
			log: true,
			join: false,
			public: true,
			anticall: false,
			original: true,
			readsw: false,
			autobio: false,
			autoread: false,
			antispam: false,
			autotyping: false,
			grouponly: true,
			multiprefix: false,
			privateonly: true,
			didyoumean: true,
			author: global.author || 'Shiro',
			authorPrefix: ['', 'tr>', '::', ';;'],
			autobackup: false,
			botname: global.botname || 'Oguri Bot',
			packname: global.packname || 'Bot WhatsApp',
			template: 'documentMessage',
			owner: global.owner,
		};
		for (let key in defaultSetBot) {
			if (!(key in setBot)) setBot[key] = defaultSetBot[key];
		}
		
		const isPremium = checkStatus(m.sender, premium)

        const limitUser = user.vip
          ? global.limit.vip
          : isPremium
          ? global.limit.premium
          : global.limit.free
        
        const moneyUser = user.vip
          ? global.money.vip
          : isPremium
          ? global.money.premium
          : global.money.free
		
		const defaultUser = {
			vip: false,
			ban: false,
			afkTime: -1,
			afkReason: '',
			register: false,
			limit: limitUser,
			money: moneyUser,
			lastclaim: 0,
			lastbegal: 0,
			lastrampok: 0,
			lastBank: 0,
            uma: [],
            activeUma: '',
            umaStats: {},
            lastTraining: 0,
            lastFeed: 0,
            raceCooldown: 0,
            medal: 0,
            inventory: [],
            bannerStats: {},
            bannerHistory: {},
            pity: {},
            tickets: { banner: 0, limited: 0 },
            exchangeLimit: {},
            exchangeHistory: [],
            exchangeResetMonth: '',
            limitedBonus: {},
            npcCollection: [],
            race5Cd: 0
		};
		for (let key in defaultUser) {
			if (!(key in user)) user[key] = defaultUser[key];
		}
		
		if (m.isGroup) {
			let group = global.db.groups[m.chat] || {};
			global.db.groups[m.chat] = group;
			
			const defaultGroup = {
				url: '',
				text: {},
				warn: {},
				tagsw: {},
				nsfw: false,
				lock: false,
				leave: false,
				setinfo: false,
				antilink: false,
				demote: false,
				antitoxic: false,
				promote: false,
				welcome: false,
				antivirtex: false,
				antitagsw: false,
				antidelete: false,
				antihidetag: false,
				waktusholat: false,
				
				oguriAI: {
				   enable: false,
				}
			};
			for (let key in defaultGroup) {
				if (!(key in group)) group[key] = defaultGroup[key];
			}
		}
		
		const defaultGame = {
			suit: {},
			chess: {},
			chat_ai: {},
			menfes: {},
			tekateki: {},
			tictactoe: {},
			tebaklirik: {},
			kuismath: {},
			blackjack: {},
			tebaklagu: {},
			tebakkata: {},
			family100: {},
			susunkata: {},
			tebakbom: {},
			ulartangga: {},
			tebakkimia: {},
			caklontong: {},
			tebakangka: {},
			tebaknegara: {},
			tebakgambar: {},
			tebakbendera: {},
		};
		for (let key in defaultGame) {
			if (!(key in game)) game[key] = defaultGame[key];
		}
		
	} catch (e) {
		throw e
	}
}

async function MessagesUpsert(naze, message, store) {
	try {
		let botNumber = naze.decodeJid(naze.user.id);
		const msg = message.messages[0];
		if ((msg?.messageTimestamp * 1000) < botStartTime) return;
		const remoteJid = msg.key.remoteJid;
		(store.messages ??= {})[remoteJid] ??= {};
		store.messages[remoteJid].array ??= [];
		store.messages[remoteJid].keyId ??= new Set();
		if (!(store.messages[remoteJid].keyId instanceof Set)) {
			store.messages[remoteJid].keyId = new Set(store.messages[remoteJid].array.map(m => m.key.id));
		}
		if (store.messages[remoteJid].keyId.has(msg.key.id)) return;
		store.messages[remoteJid].array.push(msg);
		store.messages[remoteJid].keyId.add(msg.key.id);
		if (!store.groupMetadata || Object.keys(store.groupMetadata).length === 0) store.groupMetadata ??= await naze.groupFetchAllParticipating().catch(e => ({}));
		const type = msg.message ? (getContentType(msg.message) || Object.keys(msg.message)[0]) : '';
		const m = await Serialize(naze, msg, store);
		if (nazeHandler) {
			dispatchNazeHandler(naze, m, msg, store);
		} else {
			// FIX (audit): reloadNaze() tidak pernah didefinisikan di mana pun
			// (ReferenceError). Fungsi yang benar-benar ada adalah reloadHandler().
			await reloadHandler();
			if (nazeHandler) dispatchNazeHandler(naze, m, msg, store);
		}
		if (global.db?.set?.[botNumber]?.readsw && msg.key.remoteJid === 'status@broadcast') {
			await naze.readMessages([msg.key]);
			if (/protocolMessage/i.test(type)) await naze.sendFromOwner(global.db?.set?.[botNumber]?.owner || global.owner, 'Status dari @' + msg.key.participant.split('@')[0] + ' Telah dihapus', msg, { mentions: [msg.key.participant] });
			if (/(audioMessage|imageMessage|videoMessage|extendedTextMessage)/i.test(type)) {
				let keke = (type == 'extendedTextMessage') ? `Story Teks Berisi : ${msg.message.extendedTextMessage.text ? msg.message.extendedTextMessage.text : ''}` : (type == 'imageMessage') ? `Story Gambar ${msg.message.imageMessage.caption ? 'dengan Caption : ' + msg.message.imageMessage.caption : ''}` : (type == 'videoMessage') ? `Story Video ${msg.message.videoMessage.caption ? 'dengan Caption : ' + msg.message.videoMessage.caption : ''}` : (type == 'audioMessage') ? 'Story Audio' : '\nTidak diketahui cek saja langsung'
				await naze.sendFromOwner(global.db?.set?.[botNumber]?.owner || global.owner, `Melihat story dari @${msg.key.participant.split('@')[0]}\n${keke}`, msg, { mentions: [msg.key.participant] });
			}
		}
	} catch (e) {
		console.log(message);
		throw e;
	}
}

// ============================================================
// 🔘 INTERACTIVE MESSAGE ENGINE V2 (audit — root cause fix)
// ============================================================
//
// ROOT CAUSE (bukti lengkap ada di CHANGELOG_BUTTON_V2.md di root project):
//   `buttonsMessage` (dipakai sendButtonMsg versi lama) adalah tipe pesan
//   LEGACY yang server & official client WhatsApp (Android/iOS/Web) sudah
//   menghentikan dukungannya, TERLEPAS dari Baileys ataupun kode project
//   ini. Client yang masih menampilkannya biasanya adalah bot lain (mis.
//   sesama Baileys) yang membaca protobuf mentah secara lokal — bukan
//   render resmi WhatsApp. Ini sebabnya:
//     - pengirim melihat preview  -> echo lokal dari device pengirim sendiri
//     - bot lain kadang melihat   -> bot lain decode protobuf mentah, bukan
//                                    render client resmi
//     - sebagian besar user WA
//       TIDAK melihat apa-apa     -> client resmi sudah drop buttonsMessage
//   Sedangkan sendListMsg SELALU normal karena dari awal sudah memakai
//   `interactiveMessage` + `nativeFlowMessage`, jalur yang MASIH didukung
//   resmi. Payload contextInfo/externalAdReply pada kedua helper LAMA
//   terbukti identik (sama-sama spread `contextInfo` mentah tanpa
//   transformasi) — jadi bukan itu akar masalahnya. Satu-satunya variabel
//   pembeda struktural adalah container pesannya: `buttonsMessage` vs
//   `interactiveMessage`. Kesimpulan: bukan bug protobuf/relayMessage di
//   project ini, melainkan deprecation di sisi platform WhatsApp — solusi
//   yang benar adalah migrasi total ke InteractiveMessage, bukan patch.
//
// Ditemukan pula BUG SEKUNDER (kontributif, bukan akar utama): sendButtonMsg
// lama mengirim `buttonsMessage` tapi TETAP melampirkan additionalNodes
// biz/interactive/native_flow (metadata yang hanya relevan utk native flow)
// — payload & sinyal biner tidak konsisten. Di V2 ini otomatis tidak lagi
// terjadi karena sendButtonMsg & sendListMsg kini memakai jalur pengiriman
// yang 100% sama (sendInteractiveCore).
//
// Helper murni (tidak butuh `naze`) di bawah, dipakai BERSAMA oleh
// sendListMsg() dan sendButtonMsg() supaya tidak ada lagi celah dua
// implementasi contextInfo/header/media yang diam-diam berbeda.
// ============================================================

// ── convertExternalAdReply(): titik tunggal utk field externalAdReply ────
// (title, body, thumbnail/jpegThumbnail/thumbnailUrl, showAdAttribution,
//  renderLargerThumbnail, mediaType, sourceUrl — semua passthrough apa
//  adanya karena field ContextInfo.ExternalAdReplyPreview dipakai bersama
//  oleh SEMUA tipe pesan WhatsApp/Baileys, tidak butuh transformasi struktur)
const convertExternalAdReply = (externalAdReply) => {
	if (!externalAdReply || typeof externalAdReply !== 'object') return undefined
	return { ...externalAdReply }
}

// ── convertContext(): gabungkan contextInfo + quoted + mentions ──────────
const convertContext = (contextInfo = {}, options = {}, mentions = []) => {
	const merged = {
		...contextInfo,
		...options.contextInfo
	}
	if (merged.externalAdReply) merged.externalAdReply = convertExternalAdReply(merged.externalAdReply)
	return {
		...merged,
		mentionedJid: options.mentions || mentions,
		...(options.quoted ? {
			stanzaId: options.quoted.key.id,
			remoteJid: options.quoted.key.remoteJid,
			participant: options.quoted.key.participant || options.quoted.key.remoteJid,
			fromMe: options.quoted.key.fromMe,
			quotedMessage: options.quoted.message
		} : {})
	}
}

// ── convertMedia(): upload image/video/document/location, dll ───────────
const convertMedia = async (media, uploadFn) => {
	if (!media || typeof media !== 'object' || Object.keys(media).length === 0) return {}
	return generateWAMessageContent(media, { upload: uploadFn })
}

// ── convertHeader(): bangun InteractiveMessage.Header ────────────────────
// Tipe header (text/image/video/document/location) otomatis terdeteksi dari
// KEY media yang dikirim (persis seperti sendListMsg) — tidak lagi butuh
// angka `headerType` manual seperti buttonsMessage lama.
const convertHeader = async ({ title, subtitle, media = {}, uploadFn }) => {
	const hasMedia = media && typeof media === 'object' && Object.keys(media).length > 0
	return proto.Message.InteractiveMessage.Header.create({
		title,
		subtitle,
		hasMediaAttachment: hasMedia,
		...(hasMedia ? await convertMedia(media, uploadFn) : {})
	})
}

// ── convertNativeFlow(): normalisasi satu tombol -> {name, buttonParamsJson} ──
const convertNativeFlow = (name, paramsJson) => ({
	name,
	buttonParamsJson: JSON.stringify(
		paramsJson && typeof paramsJson === 'object'
			? paramsJson
			: (() => { try { return JSON.parse(paramsJson || '{}') } catch { return {} } })()
	)
})

// ── convertLegacyButtons(): buttonsMessage lama -> NativeFlow buttons ────
// WAJIB backward compatible dgn ±334 command lama. Menangani SEMUA bentuk
// yang benar-benar dipakai di project ini plus checklist yang diminta:
//   1. Native modern     : { name, buttonParamsJson }               (passthrough)
//   2. Hybrid (sudah ada di lib/template_menu.js):
//                          { buttonId, buttonText, nativeFlowInfo:{name,paramsJson}, type }
//   3. cta_url            : { urlButton: { displayText, url } }
//   4. cta_call           : { callButton: { displayText, phoneNumber } }
//   5. cta_copy           : { copyButton: { displayText, copyCode } } / copyCode langsung
//   6. Legacy polos       : { buttonId, buttonText:{ displayText }, type:1 } -> quick_reply
const convertLegacyButtons = (buttons = []) => {
	if (!Array.isArray(buttons)) return []
	return buttons.map((btn) => {
		if (!btn || typeof btn !== 'object') return null

		if (btn.name && btn.buttonParamsJson !== undefined) {
			return convertNativeFlow(btn.name, btn.buttonParamsJson)
		}
		if (btn.nativeFlowInfo && btn.nativeFlowInfo.name) {
			return convertNativeFlow(btn.nativeFlowInfo.name, btn.nativeFlowInfo.paramsJson)
		}
		if (btn.urlButton) {
			return convertNativeFlow('cta_url', {
				display_text: btn.urlButton.displayText,
				url: btn.urlButton.url
			})
		}
		if (btn.callButton) {
			return convertNativeFlow('cta_call', {
				display_text: btn.callButton.displayText,
				phone_number: btn.callButton.phoneNumber
			})
		}
		if (btn.copyButton || btn.copyCode) {
			return convertNativeFlow('cta_copy', {
				display_text: btn.copyButton?.displayText ?? btn.buttonText?.displayText ?? '',
				copy_code: btn.copyButton?.copyCode ?? btn.copyCode ?? ''
			})
		}

		const displayText = (btn.buttonText?.displayText ?? '').toString().trim()
		return convertNativeFlow('quick_reply', {
			display_text: displayText,
			id: btn.buttonId ?? ''
		})
	}).filter(Boolean)
}

// ── sendInteractiveCore(): satu-satunya jalur bangun+kirim InteractiveMessage ──
// Dipakai oleh sendListMsg() DAN sendButtonMsg() -> menjamin payload
// contextInfo/header/relayMessage kedua helper 100% identik selamanya.
//
// AUDIT (bug: menu hanya sampai ke pengirim, audio sampai ke semua):
// Fakta yang BISA dibuktikan langsung dari project ini (bukan tebakan):
//   1. `naze.relayMessage` TIDAK PERNAH di-override di project ini — itu
//      murni method bawaan Baileys yang menempel ke socket.
//   2. SELURUH pemanggilan relayMessage() langsung di project ini (helper
//      ini, anti-toxic, menfes, dll) TIDAK PERNAH melakukan fetch/refresh
//      metadata grup sebelum relay.
//   3. Audio dikirim lewat `naze.sendMessage()` — fungsi tingkat tinggi
//      BAWAAN Baileys yang menurut dokumentasi resminya "will try to get
//      the group participant list (to encrypt the message to each
//      participant)" ketika tujuannya grup — sebuah langkah yang TIDAK ADA
//      di jalur relayMessage() manual.
//   4. Socket di index.js TIDAK dikonfigurasi dengan `cachedGroupMetadata`
//      (dicek langsung, tidak ada di opsi WAConnection()).
// Yang TIDAK bisa dipastikan dari sandbox ini (jujur, bukan disembunyikan):
// apakah relayMessage() level Baileys RC13 melakukan sendiri fetch
// participant grup itu atau tidak — source literalnya tidak bisa diakses
// dari lingkungan audit ini (tanpa akses npm/GitHub raw). Karena itu,
// perbaikan di bawah dibuat SUPAYA BENAR di kedua kemungkinan: kita
// paksa metadata grup selalu segar SEBELUM relay (persis langkah yang
// didokumentasikan dipakai sendMessage()), dan kita sediakan log
// diagnostik opt-in (NAZE_RELAY_DEBUG=1) supaya saat dijalankan di sesi
// WhatsApp nyata, ada bukti pasti (bukan dugaan) apa yang sebenarnya
// terjadi di level ack/relay.
const sendInteractiveCore = async (naze, jid, content = {}, options = {}, store) => {
	// Samakan dengan langkah yang didokumentasikan dipakai sendMessage()
	// bawaan Baileys untuk grup: pastikan metadata partisipan grup segar
	// SEBELUM relay, bukan mengandalkan cache yang mungkin kosong/basi.
	if (jid.endsWith('@g.us') && store) {
		try {
			store.groupMetadata = store.groupMetadata || {}
			store.groupMetadata[jid] = await naze.groupMetadata(jid)
		} catch (e) {
			// Biarkan lanjut walau gagal refresh -> tetap pakai cache lama jika ada,
			// supaya fitur tidak mati total hanya karena metadata gagal di-refresh.
		}
	}

	const { text, caption, footer = '', title, subtitle, ai, contextInfo = {}, buttons = [], messageParamsJson = {}, mentions = [], ...media } = content
	const msg = await generateWAMessageFromContent(jid, {
		viewOnceMessage: {
			message: {
				messageContextInfo: {
					deviceListMetadata: {},
					deviceListMetadataVersion: 2,
				},
				interactiveMessage: proto.Message.InteractiveMessage.create({
					body: proto.Message.InteractiveMessage.Body.create({ text: text || caption || '' }),
					footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
					header: await convertHeader({ title, subtitle, media, uploadFn: naze.waUploadToServer }),
					nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
						...(messageParamsJson && typeof messageParamsJson === 'object' && Object.keys(messageParamsJson).length > 0 ? messageParamsJson : {}),
						buttons
					}),
					contextInfo: convertContext(contextInfo, options, mentions)
				})
			}
		}
	}, {});
	const relayOpts = {
		messageId: msg.key.id,
		additionalNodes: [{
			tag: 'biz',
			attrs: {},
			content: [{
				tag: 'interactive',
				attrs: {
					type: 'native_flow',
					v: '1'
				},
				content: [{
					tag: 'native_flow',
					attrs: {
						v: '9',
						name: 'mixed'
					}
				}]
			}]
		}, ...(ai ? [{ attrs: { biz_bot: '1' }, tag: 'bot' }] : [])]
	}

	// Diagnostik opt-in (set NAZE_RELAY_DEBUG=1 di env) — TIDAK aktif secara
	// default. Tujuannya supaya saat dites di sesi WhatsApp NYATA, ada bukti
	// konkret (bukan dugaan) apakah pesan benar-benar direlay dgn metadata
	// participant yang valid, dan apa hasil relayMessage()-nya.
	if (process.env.NAZE_RELAY_DEBUG === '1') {
		const isGroup = jid.endsWith('@g.us')
		const participantCount = isGroup ? (store?.groupMetadata?.[jid]?.participants?.length ?? 'UNKNOWN') : 'n/a (private chat)'
		console.log(`[NAZE_RELAY_DEBUG] sendInteractiveCore -> jid=${jid} isGroup=${isGroup} participantCount=${participantCount} messageId=${msg.key.id}`)
	}

	const hasil = await naze.relayMessage(msg.key.remoteJid, msg.message, relayOpts)

	if (process.env.NAZE_RELAY_DEBUG === '1') {
		console.log(`[NAZE_RELAY_DEBUG] relayMessage() selesai utk messageId=${msg.key.id} ->`, JSON.stringify(hasil))
	}

	return hasil
}


async function Solving(naze, store) {
	naze.serializeM = (m) => MessagesUpsert(naze, m, store)
	
	naze.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + '@' + decode.server || jid
		} else return jid
	}
	
	naze.findJidByLid = (lid, store, resolve = false) => {
		const groupMeta = store?.groupMetadata
		if (groupMeta) {
			for (const g of Object.values(groupMeta)) {
				if (!g?.participants) continue
				for (const contact of g.participants) {
					if (((contact?.id?.includes(lid)) || (contact?.phoneNumber?.includes(lid))) && contact?.phoneNumber) {
						return contact.phoneNumber
					}
				}
			}
		}
		const contacts = store?.contacts
		if (contacts) {
			for (const contact of Object.values(contacts)) {
				if (((contact?.id?.includes(lid)) || (contact?.phoneNumber?.includes(lid))) && contact?.phoneNumber) {
					return contact.phoneNumber
				}
			}
		}
		if (resolve) return lid
		return null
	}
	
	naze.getName = (jid, withoutContact  = false) => {
		const id = naze.decodeJid(jid);
		if (id.endsWith('@g.us')) {
			const groupInfo = store.contacts[id] || (store.groupMetadata[id] ? store.groupMetadata[id] : (store.groupMetadata[id] = naze.groupMetadata(id))) || {};
			return Promise.resolve(groupInfo.name || groupInfo.subject || PhoneNumber('+' + id.replace('@g.us', '')).getNumber('international'));
		} else {
			if (id === '0@s.whatsapp.net') {
				return 'WhatsApp';
			}
		const contactInfo = store.contacts[id] || {};
		return withoutContact ? '' : contactInfo.name || contactInfo.subject || contactInfo.verifiedName || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international');
		}
	}
	
	naze.sendContact = async (jid, kon, quoted = '', opts = {}) => {
		let list = []
		for (let i of kon) {
			const name = await naze.getName(i + '@s.whatsapp.net')
        list.push({
          displayName: name,
        
          vcard:
        `BEGIN:VCARD
        VERSION:3.0
        N:${name}
        FN:${name}
        item1.TEL;waid=${i}:${i}
        item1.X-ABLabel:Ponsel
        item2.ADR:;;Indonesia;;;;
        item2.X-ABLabel:Region
        END:VCARD`
        })
		}
		naze.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted, ephemeralExpiration: quoted?.expiration || quoted?.metadata?.ephemeralDuration || store?.messages[jid]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 });
	}
	
	naze.profilePictureUrl = async (jid, type = 'image', timeoutMs) => {
		const result = await naze.query({
			tag: 'iq',
			attrs: {
				target: jidNormalizedUser(jid),
				to: '@s.whatsapp.net',
				type: 'get',
				xmlns: 'w:profile:picture'
			},
			content: [{
				tag: 'picture',
				attrs: {
					type, query: 'url'
				},
			}]
		}, timeoutMs);
		const child = getBinaryNodeChild(result, 'picture');
		return child?.attrs?.url;
	}
	
	naze.setStatus = (status) => {
		naze.query({
			tag: 'iq',
			attrs: {
				to: '@s.whatsapp.net',
				type: 'set',
				xmlns: 'status',
			},
			content: [{
				tag: 'status',
				attrs: {},
				content: Buffer.from(status, 'utf-8')
			}]
		})
		return status
	}
	
	naze.relayMessageV2 = async (jid, message, options) => {
		const msg = generateWAMessageFromContent(jid, message, {
			upload: naze.waUploadToServer,
			messageId: generateMessageID(),
			...options
		});
		const hasil = await naze.relayMessage(jid, msg.message, {
			messageId: msg.key.id,
			...options
		});
		return hasil;
	}

	naze.sendPoll = (jid, name = '', values = [], quoted, selectableCount = 1) => {
		return naze.sendMessage(jid, { poll: { name, values, selectableCount }}, { quoted, ephemeralExpiration: quoted?.expiration || quoted?.metadata?.ephemeralDuration || store?.messages[jid]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 })
	}
	
	naze.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
		const quotedOptions = { quoted, ephemeralExpiration: quoted?.expiration || quoted?.metadata?.ephemeralDuration || store?.messages[jid]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 }
		try {
			const res = await axios.head(url);
			let mime = res.headers['content-type'];
			if (mime && mime.includes('gif')) {
				return naze.sendMessage(jid, { video: { url }, caption: caption, gifPlayback: true, ...options }, quotedOptions);
			} else if (mime && mime === 'application/pdf') {
				return naze.sendMessage(jid, { document: { url }, mimetype: 'application/pdf', caption: caption, ...options }, quotedOptions);
			} else if (mime && mime.includes('image')) {
				return naze.sendMessage(jid, { image: { url }, caption: caption, ...options }, quotedOptions);
			} else if (mime && mime.includes('video')) {
				return naze.sendMessage(jid, { video: { url }, caption: caption, mimetype: 'video/mp4', ...options }, quotedOptions);
			} else if (mime && mime.includes('audio')) {
				return naze.sendMessage(jid, { audio: { url }, mimetype: 'audio/mpeg', ...options }, quotedOptions);
			} else {
				return naze.sendMessage(jid, { document: { url }, caption: caption, mimetype: mime, ...options }, quotedOptions);
			}
		} catch (e) {
			return naze.sendMessage(jid, { text: url, ...options }, quotedOptions);
		}
	}
	
	naze.sendGroupInviteV4 = async (jid, participant, inviteCode, inviteExpiration, groupName = 'Unknown Subject', caption = 'Invitation to join my WhatsApp group', jpegThumbnail = null, options = {}) => {
		const msg = proto.Message.create({
			groupInviteMessage: {
				inviteCode,
				inviteExpiration: parseInt(inviteExpiration) || + new Date(new Date + (3 * 86400000)),
				groupJid: jid,
				groupName,
				jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
				caption,
				contextInfo: {
					mentionedJid: options.mentions || []
				}
			}
		});
		const message = generateWAMessageFromContent(participant, msg, options);
		const invite = await naze.relayMessage(participant, message.message, { messageId: message.key.id })
		return invite
	}
	
	naze.sendFromOwner = async (jids, text, quoted, options = {}) => {
		for (const a of jids) {
			const jid = a.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
			await naze.sendMessage(jid, { text, ...options }, { quoted, ephemeralExpiration: quoted?.expiration || quoted?.metadata?.ephemeralDuration || store?.messages[jid]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 })
		}
	}
	
	naze.sendText = async (jid, text, quoted, options = {}) => naze.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted, ephemeralExpiration: quoted?.expiration || quoted?.metadata?.ephemeralDuration || store?.messages[jid]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 })
	
	naze.sendAsSticker = async (jid, pathMedia, quoted, options = {}) => {
		let buff = Buffer.isBuffer(pathMedia) ? pathMedia : /^data:.*?\/.*?;base64,/i.test(pathMedia) ? Buffer.from(pathMedia.split`,`[1], 'base64') : /^https?:\/\//.test(pathMedia) ? await (await getBuffer(pathMedia)) : (typeof pathMedia === 'string' && fs.existsSync(pathMedia)) ? pathMedia : Buffer.alloc(0);
		// Sticker Engine V2: Media->Metadata->Image/Video(FFmpeg)->WebP->Exif,
		// mengembalikan Buffer WEBP langsung (Buffer First, tanpa temp file
		// tambahan untuk hasil akhir). Seluruh proses berjalan lokal (Sharp/
		// Canvas/FFmpeg), tanpa API internet.
		try {
			const result = await createSticker(buff, options);
			let anu = await naze.sendMessage(jid, { sticker: result, ...options }, { quoted, ephemeralExpiration: quoted?.expiration || quoted?.metadata?.ephemeralDuration || store?.messages[jid]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 });
			return anu;
		} finally {
			// Cleanup SELALU berjalan (termasuk saat createSticker gagal) —
			// memperbaiki kebocoran temp file pada implementasi lama yang
			// hanya membersihkan pathMedia ketika proses berhasil.
			if (typeof pathMedia === 'string' && fs.existsSync(pathMedia)) fs.unlinkSync(pathMedia);
		}
	}
	
	naze.downloadMediaMessage = async (message) => {
		const msg = message.msg || message;
		msg.mediaKey = fixBytes(msg.mediaKey);
		msg.fileSha256 = fixBytes(msg.fileSha256);
		msg.fileEncSha256 = fixBytes(msg.fileEncSha256);
		const mime = msg.mimetype || '';
		const messageType = (message.type || mime.split('/')[0]).replace(/Message/gi, '');
		const stream = await downloadContentFromMessage(msg, messageType);
		let buffer = Buffer.from([]);
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk]);
		}
		return buffer
	}
	
	naze.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
	const msg = message.msg || message

	msg.mediaKey = fixBytes(msg.mediaKey)
	msg.fileSha256 = fixBytes(msg.fileSha256)
	msg.fileEncSha256 = fixBytes(msg.fileEncSha256)

	const mime = msg.mimetype || ''
	const messageType = (message.type || mime.split('/')[0]).replace(/Message/gi, '')
	const ext = mime.split('/')[1]?.split(';')[0] || 'bin'

	const dir = path.join(__dirname, '../database/temp')
	if (!fs.existsSync(dir))
		fs.mkdirSync(dir, { recursive: true })

	const randomName = crypto.randomBytes(6).readUIntLE(0, 6).toString(36)

	const trueFileName = attachExtension
		? path.join(dir, `${filename || randomName}.${ext}`)
		: path.join(dir, filename || randomName)

	let lastError = null

	for (let retry = 1; retry <= 3; retry++) {
		try {
			const stream = await downloadContentFromMessage(msg, messageType)

			await new Promise((resolve, reject) => {
				const writeStream = fs.createWriteStream(trueFileName)

				stream.pipe(writeStream)

				writeStream.on('finish', resolve)
				writeStream.on('error', reject)
			})

			return trueFileName

		} catch (err) {
			lastError = err

			console.log(`[MEDIA] Download gagal (${retry}/3): ${err.code || err.message}`)

			if (retry < 3)
				await new Promise(r => setTimeout(r, 1500))
		}
	}

	if (fs.existsSync(trueFileName))
		fs.unlinkSync(trueFileName)

	console.log('[MEDIA] Semua percobaan gagal')
	console.log(lastError)

	return null
}
	
	naze.getFile = async (PATH) => {
		let filename;
		let mime = 'application/octet-stream';
		let ext = 'bin';
		let isTemp = false;
		
		const dir = path.join(__dirname, '../database/temp');
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		
		const randomName = crypto.randomBytes(6).readUIntLE(0, 6).toString(36);
		
		if (Buffer.isBuffer(PATH)) {
			let type = await FileType.fromBuffer(PATH) || { mime, ext };
			mime = type.mime; ext = type.ext;
			filename = path.join(dir, `${randomName}.${ext}`);
			fs.writeFileSync(filename, PATH);
			isTemp = true;
		} else if (/^data:.*?\/.*?;base64,/i.test(PATH)) {
			let buffer = Buffer.from(PATH.split`,`[1], 'base64');
			let type = await FileType.fromBuffer(buffer) || { mime, ext };
			mime = type.mime; ext = type.ext;
			filename = path.join(dir, `${randomName}.${ext}`);
			fs.writeFileSync(filename, buffer);
			isTemp = true;
		} else if (typeof PATH === 'string' && /^https?:\/\//.test(PATH)) {
			const res = await axios.get(PATH, { responseType: 'stream' });
			mime = res.headers['content-type'] || 'application/octet-stream';
			ext = mime.split('/')[1]?.split(';')[0] || 'tmp';
			if (ext === 'jpeg') ext = 'jpg';
			filename = path.join(dir, `${randomName}.${ext}`);
			const writeStream = fs.createWriteStream(filename);
			res.data.pipe(writeStream);
			await new Promise((resolve, reject) => {
				writeStream.on('finish', resolve);
				writeStream.on('error', reject);
			});
			isTemp = true;
		} else if (typeof PATH === 'string' && fs.existsSync(PATH)) {
			let type = await FileType.fromFile(PATH) || { mime, ext };
			mime = type.mime; ext = type.ext;
			filename = PATH;
			isTemp = false;
		} else {
			throw new Error("Format media tidak didukung");
		}
		return { filename, mime, ext, isTemp };
	}
	
	naze.appendResponseMessage = async (m, text) => {
		let apb = await generateWAMessage(m.chat, { text, mentions: m.mentionedJid }, { userJid: naze.user.id, quoted: m.quoted && m.quoted.fakeObj(), ephemeralExpiration: m.expiration || m?.metadata?.ephemeralDuration || store?.messages[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 });
		apb.key = m.key
		apb.key.id = [...Array(32)].map(() => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
		apb.key.fromMe = areJidsSameUser(m.sender, naze.user.id);
		if (m.isGroup) apb.participant = m.sender;
		naze.ev.emit('messages.upsert', {
			...m,
			messages: [proto.WebMessageInfo.create(apb)],
			type: 'append'
		});
	}
	
	naze.sendMedia = async (jid, pathMedia, fileName = '', caption = '', quoted = '', options = {}) => {
		const { mime, filename, isTemp } = await naze.getFile(pathMedia);
		const botNumber = naze.decodeJid(naze.user.id);
		const isWebpSticker = options.asSticker || /webp/.test(mime);
		let type = 'document', mimetype = mime, pathFile = filename;
		let filesToDelete = [];
		if (isTemp) filesToDelete.push(filename);
		try {
			if (isWebpSticker) {
				pathFile = await writeExif(filename, {
					packname: options.packname || global.db?.set?.[botNumber]?.packname || 'Bot WhatsApp',
					author: options.author || global.db?.set?.[botNumber]?.author || 'Nazedev',
					categories: options.categories || [],
				});
				filesToDelete.push(pathFile);
				type = 'sticker';
				mimetype = 'image/webp';
			} else if (/image|video|audio/.test(mime)) {
				type = mime.split('/')[0];
				mimetype = type == 'video' ? 'video/mp4' : type == 'audio' ? 'audio/mpeg' : mime;
			}
			let anu = await naze.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ephemeralExpiration: quoted?.expiration || quoted?.metadata?.ephemeralDuration || store?.messages[jid]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0, ...options });
			return anu;
		} finally {
			filesToDelete.forEach(file => {
				if (fs.existsSync(file)) fs.unlinkSync(file);
			});
		}
	}
	
	naze.sendAlbumMessage = async (jid, content = {}, options = {}) => {
		const { album, mentions, contextInfo, ...others } = content;
		for (const media of album) {
			if (!media.image && !media.video) throw new TypeError(`album[i] must have image or video property`);
		}
		if (album.length < 2) throw new RangeError("Minimum 2 media");
		const medias = await generateWAMessageFromContent(jid, {
			albumMessage: {
				expectedImageCount: album.filter(m => m.image).length,
				expectedVideoCount: album.filter(m => m.video).length,
			}
		}, { quoted: options?.quoted || null });
		await naze.relayMessage(jid, medias.message, { messageId: medias.key.id });
		for (const media of album) {
			const msg = await generateWAMessage(jid, { ...others, ...media }, { upload: naze.waUploadToServer });
			msg.message.messageContextInfo = {
				messageAssociation: {
					associationType: 1,
					parentMessageKey: medias.key
				}
			}
			await naze.relayMessage(jid, msg.message, { messageId: msg.key.id });
		}
		return medias;
	}
	
	naze.sendListMsg = async (jid, content = {}, options = {}) => {
		const { buttons = [], ...rest } = content;
		const nativeButtons = buttons.map(a => {
			return {
				name: a.name,
				buttonParamsJson: JSON.stringify(a.buttonParamsJson ? (typeof a.buttonParamsJson === 'string' ? JSON.parse(a.buttonParamsJson) : a.buttonParamsJson) : '')
			}
		})
		return sendInteractiveCore(naze, jid, { ...rest, buttons: nativeButtons }, options, store)
	}
	
	// sendButtonMsg V2 (audit — root cause fix, lihat blok komentar di atas
	// Solving() & CHANGELOG_BUTTON_V2.md utk detail lengkap + bukti).
	// TIDAK LAGI memakai buttonsMessage. Backward compatible 100% dengan
	// ±334 command lama lewat convertLegacyButtons() — caller tidak perlu
	// diubah sama sekali.
	naze.sendButtonMsg = async (jid, content = {}, options = {}) => {
		// `headerType` (audit): konsep header numerik milik buttonsMessage
		// lama sudah TIDAK RELEVAN di InteractiveMessage — tipe header kini
		// otomatis terdeteksi dari key media yang dikirim (sama seperti
		// sendListMsg). Tetap diterima di sini (didestrukturkan & dibuang)
		// SEMATA agar caller lama yang masih mengirim `headerType` tidak
		// error dan tidak bocor jadi field media palsu.
		const { headerType, buttons, ...rest } = content;
		return sendInteractiveCore(naze, jid, { ...rest, buttons: convertLegacyButtons(buttons) }, options, store)
	}
	
	naze.newsletterMsg = async (key, content = {}, timeout = 5000) => {
		const { type: rawType = 'INFO', name, description = '', picture = null, react, id, newsletter_id = key, ...media } = content;
		const type = rawType.toUpperCase();
		if (react) {
			if (!(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) throw [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
			if (!id) throw [{ message: 'Use Id Newsletter Message', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
			const hasil = await naze.query({
				tag: 'message',
				attrs: {
					to: key,
					type: 'reaction',
					'server_id': id,
					id: generateMessageID()
				},
				content: [{
					tag: 'reaction',
					attrs: {
						code: react
					}
				}]
			});
			return hasil
		} else if (media && typeof media === 'object' && Object.keys(media).length > 0) {
			const msg = await generateWAMessageContent(media, { upload: naze.waUploadToServer });
			const anu = await naze.query({
				tag: 'message',
				attrs: { to: newsletter_id, type: 'text' in media ? 'text' : 'media' },
				content: [{
					tag: 'plaintext',
					attrs: /image|video|audio|sticker|poll/.test(Object.keys(media).join('|')) ? { mediatype: Object.keys(media).find(key => ['image', 'video', 'audio', 'sticker','poll'].includes(key)) || null } : {},
					content: proto.Message.encode(msg).finish()
				}]
			})
			return anu
		} else {
			if ((/(FOLLOW|UNFOLLOW|DELETE)/.test(type)) && !(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) return [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
			const _query = await naze.query({
				tag: 'iq',
				attrs: {
					to: 's.whatsapp.net',
					type: 'get',
					xmlns: 'w:mex'
				},
				content: [{
					tag: 'query',
					attrs: {
						query_id: type == 'FOLLOW' ? '9926858900719341' : type == 'UNFOLLOW' ? '7238632346214362' : type == 'CREATE' ? '6234210096708695' : type == 'DELETE' ? '8316537688363079' : '6563316087068696'
					},
					content: new TextEncoder().encode(JSON.stringify({
						variables: /(FOLLOW|UNFOLLOW|DELETE)/.test(type) ? { newsletter_id } : type == 'CREATE' ? { newsletter_input: { name, description, picture }} : { fetch_creation_time: true, fetch_full_image: true, fetch_viewer_metadata: false, input: { key, type: (newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id)) ? 'JID' : 'INVITE' }}
					}))
				}]
			}, timeout);
			const res = JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_join_v2 || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_leave_v2 || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_create || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_delete_v2 || JSON.parse(_query.content[0].content)?.errors || JSON.parse(_query.content[0].content)
			res.thread_metadata ? (res.thread_metadata.host = 'https://mmg.whatsapp.net') : null
			return res
		}
	}
	
	naze.sendCarouselMsg = async (jid, body = '', footer = '', cards = [], options = {}) => {
		async function getImageMsg(url) {
			const { imageMessage } = await generateWAMessageContent({ image: { url } }, { upload: naze.waUploadToServer });
			return imageMessage;
		}
		const cardPromises = cards.map(async (a) => {
			const imageMessage = await getImageMsg(a.url);
			return {
				header: {
					imageMessage: imageMessage,
					hasMediaAttachment: true
				},
				body: { text: a.body },
				footer: { text: a.footer },
				nativeFlowMessage: {
					buttons: a.buttons.map(b => ({
						name: b.name,
						buttonParamsJson: JSON.stringify(b.buttonParamsJson ? JSON.parse(b.buttonParamsJson) : '')
					}))
				}
			};
		});
		
		const cardResults = await Promise.all(cardPromises);
		const msg = await generateWAMessageFromContent(jid, {
			viewOnceMessage: {
				message: {
					messageContextInfo: {
						deviceListMetadata: {},
						deviceListMetadataVersion: 2
					},
					interactiveMessage: proto.Message.InteractiveMessage.create({
						body: proto.Message.InteractiveMessage.Body.create({ text: body }),
						footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
						carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
							cards: cardResults,
							messageVersion: 1
						})
					})
				}
			}
		}, {});
		const hasil = await naze.relayMessage(msg.key.remoteJid, msg.message, { messageId: msg.key.id });
		return hasil
	}
	
	if (naze.user && naze.user.id) {
		const botNumber = naze.decodeJid(naze.user.id);
		if (global.db?.set[botNumber]) {
			naze.public = global.db.set[botNumber].public
		} else naze.public = true
	} else naze.public = true

	return naze
}

/*
	* Create By Naze
	* Follow https://github.com/nazedev
	* Whatsapp : https://whatsapp.com/channel/0029VaWOkNm7DAWtkvkJBK43
*/

async function Serialize(naze, msg, store) {
	const botLid = naze.decodeJid(naze.user.lid);
	const botNumber = naze.decodeJid(naze.user.id);
	const m = { ...msg };
	if (!m) return m
	if (m.key) {
		m.id = m.key.id
		m.chat = m.key.remoteJidAlt || m.key.remoteJid
		m.fromMe = m.key.fromMe
		m.isBot = ['HSK', 'BAE', 'B1E', '3EB0', 'B24E', 'WA'].some(a => m.id.startsWith(a) && [12, 16, 20, 22, 40].includes(m.id.length)) || /(.)\1{5,}|[^a-zA-Z0-9]|[^0-9A-F]/.test(m.id) || false
		m.isGroup = m.chat.endsWith('@g.us')
		if (!m.isGroup && m.chat.endsWith('@lid')) m.chat = naze.findJidByLid(m.chat, store) || m.chat;
		m.sender = naze.decodeJid(m.fromMe && naze.user.id || m.key.participantAlt || m.key.participant || m.chat || '')
		if (m.isGroup) {
			if (!store.groupMetadata) store.groupMetadata = await naze.groupFetchAllParticipating().catch(e => ({}));
			let metadata = store.groupMetadata[m.chat] ? store.groupMetadata[m.chat] : (store.groupMetadata[m.chat] = await naze.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] })));
			if (!metadata) {
				metadata = await naze.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
				store.groupMetadata[m.chat] = metadata
			}
			m.metadata = metadata
			m.metadata.size = (metadata.participants || []).length;
			if (metadata.addressingMode === 'lid') {
				const participant = metadata.participants.find(a => a.id === m.sender || a.phoneNumber === m.sender)
				m.sender = participant?.phoneNumber || m.key.participantAlt || m.sender;
				m.metadata.owner = m.metadata?.participants?.find(p => p.id === m.metadata.owner)?.id || m.metadata.owner;
				m.metadata.subjectOwner = m.metadata?.participants?.find(p => p.id === m.metadata.subjectOwner)?.id || m.metadata.subjectOwner;
				if(!m.sender.endsWith('@g.us')) store.contacts[m.sender] = { ...(store.contacts[m.sender] || {}), id: jidNormalizedUser(m.fromMe && naze.user.lid || participant?.id || store.contacts[m.sender]?.id || m.sender), phoneNumber: jidNormalizedUser(m.fromMe && naze.user.id || participant?.phoneNumber || store.contacts[m.sender]?.phoneNumber || m.sender), name: (m.fromMe && naze.user.name) || m.pushName };
			}
			m.admins = m.metadata.participants ? m.metadata.participants.filter(p => p.admin).map(p => ({ id: p.id, phoneNumber: p.phoneNumber, admin: p.admin })) : [];
			m.isAdmin = m.admins.some(a => a.id === m.sender || a.phoneNumber === m.sender);
			m.isBotAdmin = m.admins.some(a => [botNumber, botLid].includes(a.id) || [botNumber, botLid].includes(a.phoneNumber));
		}
	}
	if (m.message) {
		m.type = getContentType(m.message) || Object.keys(m.message)[0]
		m.msg = (/viewOnceMessage|viewOnceMessageV2Extension|editedMessage|ephemeralMessage/i.test(m.type) ? m.message[m.type].message[getContentType(m.message[m.type].message)] : (extractMessageContent(m.message[m.type]) || m.message[m.type]))
		m.body = m.message?.conversation || m.msg?.text || m.msg?.conversation || m.msg?.caption || m.msg?.selectedButtonId || m.msg?.singleSelectReply?.selectedRowId || m.msg?.selectedId || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || m.msg?.name || ''
		m.mentionedJid = m.msg?.contextInfo?.mentionedJid?.map(a => naze.findJidByLid(a, store, true)) || []
		m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || '';
		m.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(m.body) ? m.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : /[\uD800-\uDBFF][\uDC00-\uDFFF]/gi.test(m.body) ? m.body.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/gi)[0] : ''
		m.command = m.body && m.body.replace(m.prefix, '').trim().split(/ +/).shift()
		m.args = m.body?.trim().replace(new RegExp("^" + m.prefix?.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, '\\$&'), 'i'), '').replace(m.command, '').split(/ +/).filter(a => a) || []
		m.device = getDevice(m.id)
		m.expiration = m.msg?.contextInfo?.expiration || m?.metadata?.ephemeralDuration || store?.messages?.[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0
		m.timestamp = (typeof m.messageTimestamp === "number" ? m.messageTimestamp : m.messageTimestamp.low ? m.messageTimestamp.low : m.messageTimestamp.high) || m.msg.timestampMs * 1000
		m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath
		if (m.isMedia) {
			m.mime = m.msg?.mimetype
			m.size = m.msg?.fileLength
			m.height = m.msg?.height || ''
			m.width = m.msg?.width || ''
			if (/webp/i.test(m.mime)) {
				m.isAnimated = m.msg?.isAnimated
			}
		}
		m.quoted = m.msg?.contextInfo?.quotedMessage || null
		if (m.quoted) {
			let qMsg = JSON.parse(JSON.stringify(m.msg?.contextInfo?.quotedMessage));
			if (m.msg?.contextInfo?.participant?.endsWith('@lid')) m.msg.contextInfo.participant =  m?.metadata?.participants?.find(a => a.id === m.msg.contextInfo.participant)?.phoneNumber || m.msg.contextInfo.participant;
			m.quoted = {
				...qMsg,
				message: extractMessageContent(qMsg) || qMsg,
				type: getContentType(qMsg) || Object.keys(qMsg)[0],
				id: m.msg.contextInfo.stanzaId,
				chat: m.msg.contextInfo.remoteJid || m.chat,
				sender: naze.decodeJid(m.msg.contextInfo.participant),
				fromMe: naze.decodeJid(m.msg.contextInfo.participant) === naze.decodeJid(naze.user.id),
				text: qMsg?.conversation || qMsg?.caption || '',
			};
			m.quoted.msg = extractMessageContent(qMsg[m.quoted.type]) || qMsg[m.quoted.type];
			m.quoted.device = getDevice(m.quoted.id)
			m.quoted.isBot = m.quoted.id ? ['HSK', 'BAE', 'B1E', '3EB0', 'B24E', 'WA'].some(a => m.quoted.id.startsWith(a) && [12, 16, 20, 22, 40].includes(m.quoted.id.length)) || /(.)\1{5,}|[^a-zA-Z0-9]|[^0-9A-F]/.test(m.quoted.id) : false
			m.quoted.fromMe = m.quoted.sender === naze.decodeJid(naze.user.id)
			m.quoted.mentionedJid = m.quoted?.msg?.contextInfo?.mentionedJid?.map(a => naze.findJidByLid(a, store, true)) || []
			m.quoted.body = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted?.message?.conversation || m.quoted.msg?.selectedButtonId || m.quoted.msg?.singleSelectReply?.selectedRowId || m.quoted.msg?.selectedId || m.quoted.msg?.contentText || m.quoted.msg?.selectedDisplayText || m.quoted.msg?.title || m.quoted?.msg?.name || ''
			m.getQuotedObj = async () => {
				if (!m.quoted.id) return null
				let q = await global.loadMessage(m.chat, m.quoted.id, naze)
				if (q) {
					return await Serialize(naze, q, store)
				} else {
					return null
				}
			}
			m.quoted.key = {
				remoteJid: m.msg?.contextInfo?.remoteJid || m.chat,
				participant: m.quoted.sender,
				fromMe: areJidsSameUser(naze.decodeJid(m.msg?.contextInfo?.participant), naze.decodeJid(naze?.user?.id)),
				id: m.msg?.contextInfo?.stanzaId
			}
			m.quoted.isGroup = m.quoted.chat.endsWith('@g.us')
			m.quoted.mentions = m.quoted.msg?.contextInfo?.mentionedJid || []
			m.quoted.body = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted?.message?.conversation || m.quoted.msg?.selectedButtonId || m.quoted.msg?.singleSelectReply?.selectedRowId || m.quoted.msg?.selectedId || m.quoted.msg?.contentText || m.quoted.msg?.selectedDisplayText || m.quoted.msg?.title || m.quoted?.msg?.name || ''
			m.quoted.prefix = /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(m.quoted.body) ? m.quoted.body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : /[\uD800-\uDBFF][\uDC00-\uDFFF]/gi.test(m.quoted.body) ? m.quoted.body.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/gi)[0] : ''
			m.quoted.command = m.quoted.body && m.quoted.body.replace(m.quoted.prefix, '').trim().split(/ +/).shift()
			m.quoted.isMedia = !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath
			if (m.quoted.isMedia) {
				m.quoted.fileSha256 = m.quoted[m.quoted.type]?.fileSha256 || ''
				m.quoted.mime = m.quoted.msg?.mimetype
				m.quoted.size = m.quoted.msg?.fileLength
				m.quoted.height = m.quoted.msg?.height || ''
				m.quoted.width = m.quoted.msg?.width || ''
				if (/webp/i.test(m.quoted.mime)) {
					m.quoted.isAnimated = m?.quoted?.msg?.isAnimated || false
				}
			}
			m.quoted.fakeObj = () => ({
				key: {
					remoteJid: m.quoted.chat,
					fromMe: m.quoted.fromMe,
					id: m.quoted.id
				},
				message: m.quoted,
				...(m.isGroup ? { participant: m.quoted.sender } : {})
			});
			m.quoted.download = () => naze.downloadMediaMessage(m.quoted)
			m.quoted.delete = () => {
				naze.sendMessage(m.quoted.chat, {
					delete: {
						remoteJid: m.quoted.chat,
						fromMe: m.isBotAdmin ? false : true,
						id: m.quoted.id,
						participant: m.quoted.sender
					}
				})
			}
		}
	}
	
	m.download = () => naze.downloadMediaMessage(m)
	
	m.copy = () => Serialize(naze, JSON.parse(JSON.stringify(m)), store)
	
	m.react = (u) => naze.sendMessage(m.chat, { react: { text: u, key: m.key }})
	
	m.reply = async (content, options = {}) => {
		const { quoted = m, chat = m.chat, caption = '', mentions = [], ephemeralExpiration = m.expiration || m?.metadata?.ephemeralDuration || store?.messages[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0, ...validate } = options;
		const textBody = typeof content === 'string' ? content : (content.text || content.caption || '');
		const providedMentions = Array.isArray(mentions) ? mentions : [];
		const extractedMentions = [...textBody.matchAll(/@(\d{5,16})/g)].map(v => v[1] + '@s.whatsapp.net');
		const fixMentions = [...new Set([...providedMentions, ...extractedMentions])];
		if (typeof content === 'object') {
			return naze.sendMessage(chat, content, { ...validate, quoted, ephemeralExpiration })
		} else if (typeof content === 'string') {
			try {
				if (/^https?:\/\//.test(content)) {
					const res = await axios.head(content).catch(() => null);
					const mime = res?.headers['content-type'] || '';
					if (/gif|image|video|audio|pdf|stream/i.test(mime)) {
						let type = /image/.test(mime) ? 'image' : /video/.test(mime) ? 'video' : /audio/.test(mime) ? 'audio' : 'document';
						return naze.sendMessage(chat, { [type]: { url: content }, caption, mimetype: mime, ...validate }, { quoted, ephemeralExpiration })
					} else {
						return naze.sendMessage(chat, { text: content, mentions: fixMentions, ...validate }, { quoted, ephemeralExpiration })
					}
				} else {
					return naze.sendMessage(chat, { text: content, mentions: fixMentions, ...validate }, { quoted, ephemeralExpiration })
				}
			} catch (e) {
				return naze.sendMessage(chat, { text: content, mentions: fixMentions, ...validate }, { quoted, ephemeralExpiration })
			}
		}
	}

	return m
}

export {
	GroupUpdate,
	GroupParticipantsUpdate,
	LoadDataBase,
	MessagesUpsert,
	Solving
};

// Reload Handler
const watcher = chokidar.watch(nazePath, {
	ignored: /^\./,
	persistent: true,
	awaitWriteFinish: {
		stabilityThreshold: 100,
		pollInterval: 100
	}
});

watcher.on('change', async (filePath) => {
	console.log(chalk.yellowBright(`[UPDATE] ${filePath}`));
	await reloadHandler();
});