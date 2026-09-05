export const umaPreview = (
	uma,
	thumb
) => ({

	contextInfo: {
		externalAdReply: {
			title: uma.name,
			thumbnailUrl: thumb,
			sourceUrl: 'https://github.com/asahichanID/Umaimage',
			renderLargerThumbnail: true,
			showAdAttribution: false,
			mediaType: 1

		}

	}

})

console.log(
	'🖼️ UMA PREVIEW LOADED'
)