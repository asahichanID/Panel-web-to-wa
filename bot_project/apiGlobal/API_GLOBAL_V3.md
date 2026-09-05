# API GLOBAL V3
## Part 1 — Vision, Rules, Mission & Mandatory Requirements

> Status : Draft V3
>
> Priority : MAXIMUM
>
> This document is the highest development rule inside the entire `apiGlobal` folder.
>
> Every modification MUST follow this specification.

---

# INTRODUCTION

API Global V3 is a complete redesign of the API abstraction layer.

This version is **NOT** a simple update from V2.

This version exists because V2 has grown into a large system with many providers, many services, many endpoints, and many compatibility layers.

Over time, many incremental patches created inconsistencies across the project.

Some services still call providers differently.

Some providers normalize responses.

Some providers return raw responses.

Some services know provider response structures.

Some services bypass providers completely.

Some providers perform downloading.

Others return URLs.

This creates hidden bugs, duplicated logic, and unpredictable behavior.

V3 exists to completely eliminate these problems.

---

# MAIN OBJECTIVE

The objective of API Global V3 is to create one unified API architecture.

Every API communication must behave identically regardless of which provider is currently being used.

The rest of the project must never know whether the data came from:

- NeoXR
- Naze
- Neosantara
- or future providers.

Provider switching must become invisible.

---

# PRIMARY PROVIDER

NeoXR becomes the PRIMARY provider.

Meaning:

Every service MUST always attempt NeoXR first.

If NeoXR succeeds:

Stop immediately.

Never continue to another provider.

If NeoXR fails:

Automatically continue to fallback provider.

The fallback chain becomes:

NeoXR

↓

Naze

↓

Other providers

↓

Error

Never reverse this order unless explicitly documented.

---

# PROJECT MISSION

This migration is NOT intended to merely replace URLs.

This migration exists to rebuild API Global into a stable, maintainable architecture.

Every bug introduced during migration MUST be fixed.

Every hidden inconsistency MUST be fixed.

Every duplicated logic MUST be removed.

Every temporary workaround MUST be removed.

Every compatibility issue MUST be resolved.

The goal is stability.

Not speed.

---

# ABSOLUTE RULE

Do NOT implement features before understanding the architecture.

The project MUST be understood first.

Only after understanding the architecture may implementation begin.

---

# BEFORE WRITING ANY CODE

Claude MUST perform a complete architecture audit.

This is mandatory.

Claude MUST inspect:

apiGlobal/

including every subfolder.

Claude MUST understand:

- provider flow
- request flow
- retry flow
- timeout flow
- fallback flow
- upload flow
- download flow
- stream flow
- buffer flow
- service flow
- response normalization
- dependency graph
- public interfaces

before modifying any file.

No exceptions.

---

# DO NOT PATCH

Temporary fixes are prohibited.

Quick fixes are prohibited.

Small patches are prohibited.

Workarounds are prohibited.

Every fix MUST solve the root cause.

Never fix symptoms.

Always fix architecture.

---

# DO NOT BREAK COMPATIBILITY

Compatibility is critical.

Public interfaces MUST remain unchanged.

Existing imports MUST continue working.

Existing commands MUST continue working.

Existing services MUST continue working.

If compatibility cannot be preserved, redesign the provider instead.

Never redesign public services.

---

# SINGLE RESPONSIBILITY

Every layer has only one responsibility.

Provider

↓

Communicate with APIs.

Service

↓

Business logic only.

Request Engine

↓

Provider orchestration.

Normalizer

↓

Output normalization.

HTTP Client

↓

HTTP communication only.

Never mix responsibilities.

---

# PROVIDER RULE

Providers are the ONLY layer allowed to know provider-specific responses.

No other layer may know:

NeoXR response format

Naze response format

Neosantara response format

etc.

Provider differences end inside providers.

---

# SERVICE RULE

Services MUST never know:

provider names

provider endpoints

provider response structures

provider download URLs

provider upload mechanisms

provider authentication

provider retries

provider timeout logic

provider stream logic

provider buffer logic

Everything above belongs inside providers.

---

# NORMALIZATION RULE

Every provider MUST normalize its own response.

No service may normalize provider responses.

Every service receives one unified structure regardless of provider.

---

# DOWNLOAD RULE

If an API returns:

data.url

image

video

audio

file

download

or any downloadable resource,

the provider MUST automatically download it whenever:

responseType == stream

or

responseType == buffer

Services MUST never manually perform second requests.

---

# HTTP RULE

HTTP communication only exists inside:

httpClient.js

No other file may directly perform HTTP requests.

Forbidden outside providers:

axios

fetch

fetchApi

fetchJson

request

undici

node-fetch

or similar libraries.

---

# PROVIDER RULES

Providers must support:

GET

POST

POST JSON

POST FormData

Multipart Upload

JSON

Text

Buffer

Stream

Automatic Retry

Automatic Timeout

Automatic Download

Automatic Upload

Automatic Validation

Automatic Error Translation

Automatic Normalization

Automatic Cleanup

No service should need to implement these features.

---

# ERROR HANDLING

Provider errors MUST NOT crash services.

If Provider A fails:

Automatically continue to Provider B.

If all providers fail:

Only then return an error.

Provider failures must never leak internal implementation details.

---

# STREAM HANDLING

When responseType is Stream:

The provider handles:

Download

Temporary File

Extension Detection

Cleanup

Validation

Services only receive the final result.

---

# BUFFER HANDLING

When responseType is Buffer:

The provider performs:

Download

Conversion

Validation

Services receive Buffer only.

---

# RETRY POLICY

Retry logic belongs inside Request Engine.

Services never retry.

Providers never retry manually unless explicitly required.

---

# TIMEOUT POLICY

Timeout configuration belongs inside configuration files.

Services never hardcode timeout values.

---

# CONFIGURATION RULE

API Keys

Base URLs

Timeouts

Limits

Retries

Provider Priority

must all be configurable.

Never hardcode these values inside services.

---

# CLEAN CODE POLICY

Remove:

dead code

duplicate logic

legacy patches

temporary workarounds

obsolete providers

unused imports

unused utilities

unused variables

unused functions

before considering migration complete.

---

# MIGRATION OBJECTIVE

The migration is complete ONLY IF:

Every provider behaves consistently.

Every service becomes provider-independent.

Every command works correctly.

Every API endpoint functions correctly.

Every response is normalized.

Every hidden migration bug has been eliminated.

Every compatibility issue has been resolved.

Every regression has been fixed.

Only then may API Global V3 be considered complete.

---

# NEXT PART

Part 2 will define the complete API Global V3 Architecture including:

• Folder Structure

• Dependency Graph

• Data Flow

• Request Lifecycle

• Provider Lifecycle

• Stream Lifecycle

• Buffer Lifecycle

• Retry Lifecycle

• Timeout Lifecycle

• Response Lifecycle

Everything described there becomes mandatory implementation rules.


# API GLOBAL V3
# PART 2 — INTERNAL ARCHITECTURE

> IMPORTANT

Sebelum melakukan perubahan apa pun terhadap API Global, WAJIB membaca keseluruhan folder `apiGlobal` terlebih dahulu.

JANGAN mengubah satu baris kode pun sebelum memahami seluruh hubungan antar file.

Project ini sudah memiliki arsitektur sendiri.

Claude TIDAK BOLEH membuat asumsi baru.

Claude TIDAK BOLEH mengganti arsitektur tanpa alasan yang jelas.

Claude WAJIB mengikuti struktur project yang sudah ada.

---

# WAJIB MEMBACA KESELURUHAN FOLDER

Sebelum implementasi dimulai, baca seluruh isi folder berikut.

apiGlobal/

config/

core/

providers/

services/

index.js

README.md

API_ARCHITECTURE.md

AUDIT_REPORT.md

MIGRATION_GUIDE.md

JANGAN melewati satu file pun.

Walaupun terlihat sederhana.

Walaupun terlihat tidak dipakai.

Walaupun terlihat hanya dokumentasi.

Semua file dapat mempengaruhi arsitektur.

---

# WAJIB MEMAHAMI SETIAP FOLDER

## config/

Folder ini hanya bertugas menyimpan konfigurasi.

WAJIB memahami:

index.js

providers.config.js

timeout.config.js

Tidak boleh ada business logic.

Tidak boleh ada HTTP Request.

Tidak boleh ada Service.

---

## core/

Ini adalah jantung API Global.

WAJIB memahami secara penuh.

cache.js

errors.js

httpClient.js

logger.js

normalizer.js

requestEngine.js

Seluruh perubahan terhadap provider HARUS tetap kompatibel dengan folder ini.

Jangan mengubah perilaku requestEngine tanpa alasan yang sangat kuat.

---

## providers/

WAJIB membaca seluruh provider.

Minimal:

naze.provider.js

neoxr.provider.js

neosantara.provider.js

coffee.provider.js

fgmods.provider.js

github.provider.js

maelyn.provider.js

nekosapi.provider.js

nekosbest.provider.js

safebooru.provider.js

uguu.provider.js

urbandictionary.provider.js

vihangayt.provider.js

Pahami:

bagaimana request dibuat

bagaimana response diterima

bagaimana response dinormalisasi

bagaimana stream bekerja

bagaimana buffer bekerja

bagaimana upload bekerja

bagaimana download bekerja

bagaimana retry bekerja

bagaimana timeout bekerja

---

## services/

WAJIB membaca seluruh service.

ai/

anime/

creator/

downloader/

games/

image/

information/

search/

tools/

upload/

Pahami seluruh hubungan antar service.

Cari service yang masih memakai:

axios

fetch

fetchApi

fetchJson

request langsung

Kemudian migrasikan secara bertahap menuju Provider.

---

# REQUEST FLOW

WAJIB memahami alur berikut.

Command

↓

Service

↓

requestEngine

↓

Provider

↓

httpClient

↓

Remote API

↓

Provider

↓

Normalizer

↓

Service

↓

Command

↓

User

Jangan mengubah flow ini.

---

# REQUEST ENGINE

requestEngine adalah pusat seluruh API Global.

JANGAN mengubah logika requestEngine apabila tidak benar-benar diperlukan.

Pastikan:

retry

fallback

timeout

provider.run()

tetap bekerja.

---

# HTTP CLIENT

Semua komunikasi HTTP hanya boleh dilakukan oleh:

core/httpClient.js

Provider tidak boleh menggunakan axios secara langsung.

Service tidak boleh menggunakan axios.

Command tidak boleh menggunakan axios.

Semua request HARUS melalui request().

---

# NORMALIZER

Semua provider WAJIB mengembalikan response yang telah dinormalisasi.

Service tidak boleh mengetahui:

NeoXR

Naze

Neosantara

atau provider lain.

---

# PROVIDER

Provider hanya bertugas:

membuat request

menerima response

validasi

normalisasi

upload

download

stream

buffer

retry

timeout

Tidak boleh berisi business logic.

---

# SERVICE

Service hanya bertugas menjalankan business logic.

Service tidak boleh mengetahui:

endpoint

apikey

response provider

stream provider

buffer provider

retry provider

timeout provider

---

# INDEX

index.js adalah Public API.

Semua command HARUS mengakses Service melalui index.js.

Jangan membuat import acak.

---

# DEPENDENCY

Dependency wajib tetap seperti berikut.

Command

↓

index.js

↓

Service

↓

requestEngine

↓

Provider

↓

httpClient

↓

Remote API

Tidak boleh dibalik.

---

# NeoXR Endpoint Registry

NeoXR Endpoint Registry has been moved into:

NEOXR_ENDPOINTS.md

Claude MUST read the entire NEOXR_ENDPOINTS.md before modifying:

- neoxr.provider.js
- Provider Mapping
- Services using NeoXR
- Response Normalization

Claude MUST NOT guess:

- Endpoint names
- Parameters
- Response structure
- Download URL
- Upload field
- Required authentication

If an endpoint is documented inside NEOXR_ENDPOINTS.md,

that documentation becomes the single source of truth.

If documentation conflicts with implementation,

implementation MUST be updated to match the endpoint documentation.

If documentation is incomplete,

Claude MUST preserve compatibility and MUST NOT invent undocumented endpoints.

# AUDIT

Sebelum implementasi dimulai, Claude WAJIB membuat audit internal.

Minimal mencatat:

Jumlah Provider

Jumlah Service

Jumlah Core

Jumlah Config

Dependency

Provider Priority

Known Bug

Compatibility

Regression

Duplicated Logic

Unused Code

Legacy Code

Technical Debt

Baru setelah audit selesai implementasi boleh dimulai.

---

Part 3 akan menjelaskan Provider Specification V3 secara lengkap.


# API GLOBAL V3
# PART 3 — PROVIDER SPECIFICATION

> This document defines every rule that MUST be followed when implementing or modifying any provider.

---

# PROVIDER PHILOSOPHY

Provider is the ONLY layer allowed to communicate with external APIs.

No other layer may know how a provider works.

Service MUST NOT know:

- Endpoint
- Authentication
- API Key
- Base URL
- Response Structure
- Stream Handling
- Buffer Handling
- Upload Logic
- Download Logic

Everything above belongs exclusively inside Provider.

---

# PRIMARY OBJECTIVE

Every provider must expose exactly the same behavior regardless of the remote API.

The rest of the project should never know whether the current provider is:

NeoXR

Naze

Neosantara

or future providers.

Provider differences MUST stop inside Provider.

---

# PROVIDER RESPONSIBILITY

Provider MUST handle:

Authentication

Endpoint

Headers

GET

POST

POST JSON

POST FormData

Multipart

Upload

Download

JSON Response

Buffer Response

Stream Response

Retry Compatibility

Timeout Compatibility

Automatic Validation

Automatic Normalization

Automatic Error Translation

Automatic File Detection

Automatic File Download

Automatic Cleanup

Nothing above may exist inside Services.

---

# STANDARD PROVIDER OBJECT

Every provider MUST return an object compatible with requestEngine.

Example structure:

name

run()

Nothing else should be required by requestEngine.

---

# PROVIDER PRIORITY

Provider order is controlled only by requestEngine.

Default priority:

NeoXR

↓

Naze

↓

Other Provider

↓

Error

Provider itself MUST NOT decide fallback order.

---

# GET REQUEST

Provider MUST support GET requests.

Automatically append API Key when required.

Automatically append query parameters.

Automatically merge user parameters.

Never require Services to manually build URLs.

---

# POST JSON

Provider MUST support JSON POST.

Automatically set:

Content-Type

Authentication

Headers

Body

Services only provide business parameters.

---

# POST FORM

Provider MUST support multipart/form-data.

Provider automatically attaches:

API Key

Headers

Boundary

Upload Stream

Services never manually manipulate FormData.

---

# STREAM

When responseType == stream

Provider MUST:

perform request

detect downloadable resource

download file

store temporary file

return final file path

Service MUST receive only the finished path.

---

# BUFFER

When responseType == buffer

Provider MUST:

download resource

convert into Buffer

validate

return Buffer

Service MUST never perform second download.

---

# AUTO DOWNLOAD

Many APIs return:

data.url

url

image

video

audio

file

download

Provider MUST detect these automatically.

If responseType requires file download,

Provider MUST perform the second request automatically.

Service must never manually download files.

---

# AUTO DETECTION

Provider SHOULD automatically detect common response patterns.

Supported patterns include:

data.url

data.image

data.video

data.audio

data.file

data.download

url

image

video

audio

download

Future patterns should be easy to add.

---

# VALIDATION

Provider MUST validate:

status

success

required fields

download URL

response format

If validation fails,

throw ProviderError.

Never return broken responses.

---

# ERROR HANDLING

Provider MUST translate provider-specific errors into common errors.

Never leak raw provider implementation.

Never expose unnecessary stack traces.

Never silently ignore provider failures.

---

# NORMALIZATION

Every provider MUST normalize response before returning.

Different APIs may return different JSON structures.

Services MUST always receive one common structure.

Never normalize inside Service.

---

# RETRY

Provider MUST NOT implement retry manually unless endpoint explicitly requires it.

Retry belongs to requestEngine.

---

# TIMEOUT

Provider MUST respect timeout supplied by requestEngine.

Never hardcode timeout values.

---

# API KEY

Provider MUST automatically inject API Key whenever required.

Service never supplies API Key.

---

# BASE URL

Provider MUST automatically use configured Base URL.

Service never builds endpoint URL.

---

# FILE CLEANUP

Temporary files created by Provider MUST be removable.

Provider SHOULD cooperate with cleanup systems.

Provider MUST NOT leave orphan temporary files.

---

# PROVIDER COMPATIBILITY

NeoXR Provider

Must support every endpoint available inside NeoXR Endpoint Registry.

Naze Provider

Must remain fully compatible as fallback.

Neosantara Provider

Must remain dedicated for AI endpoints unless otherwise documented.

---

# FORBIDDEN

Provider MUST NOT:

Contain business logic

Know command names

Know WhatsApp implementation

Know Baileys implementation

Know database implementation

Import Services

Import Commands

Import Business Logic

---

# CURRENT MIGRATION TARGET

NeoXR Provider MUST become the reference implementation.

Every feature supported by NeoXR should be migrated.

Fallback Provider should only execute when:

NeoXR timeout

NeoXR endpoint unavailable

NeoXR validation failed

NeoXR response invalid

---

# REQUIRED AUDIT

Before modifying Provider, Claude MUST inspect:

requestEngine.js

httpClient.js

normalizer.js

providers.config.js

timeout.config.js

Every provider implementation.

Only then implementation may begin.

---

# END OF PART 3

Part 4 will define the complete Service Specification, Response Contract, Compatibility Rules, and Migration Procedure.

# API GLOBAL V3
# PART 4 — SERVICE SPECIFICATION & BUSINESS LAYER

> This document defines every rule for the Service layer.

---

# SERVICE PHILOSOPHY

Service is the Business Layer.

Service exists only to implement business logic.

Service MUST NOT communicate directly with external APIs.

Service MUST NOT know provider implementation.

Service MUST remain completely provider-independent.

Changing Provider MUST NOT require changing Service.

---

# MAIN OBJECTIVE

Every Service should behave identically regardless of which Provider is currently active.

Service MUST only receive normalized data.

Service MUST never care where the data comes from.

---

# SERVICE RESPONSIBILITY

A Service MAY:

Validate business parameters.

Choose business workflow.

Combine multiple API results.

Merge multiple providers.

Apply business rules.

Format business objects.

Return normalized results.

Nothing more.

---

# SERVICE MUST NEVER

Service MUST NEVER:

Build URL.

Build Endpoint.

Build Authorization.

Inject API Key.

Download files manually.

Upload files manually.

Detect Provider.

Detect Response Type.

Perform Retry.

Perform Timeout.

Normalize Provider Response.

Use axios.

Use fetch.

Use fetchApi.

Use fetchJson.

Use request().

Import httpClient.

Import Provider internals.

---

# REQUEST FLOW

Correct Flow

Command

↓

Service

↓

runProviders()

↓

Provider

↓

Request Engine

↓

HTTP Client

↓

Remote API

↓

Provider

↓

Normalizer

↓

Service

↓

Command

Never bypass this flow.

---

# IMPORT RULE

Service may only import:

requestEngine

config

normalizer

errors

utility functions

Provider factory

Nothing else.

---

# PROVIDER ACCESS

Every Service MUST access APIs only through Providers.

Never call HTTP Client directly.

Never manually create requests.

Never manually build URLs.

---

# BUSINESS VALIDATION

Business validation belongs inside Service.

Examples:

Missing parameter.

Invalid quality.

Unsupported option.

Permission checks.

Premium checks.

Limit checks.

Business validation MUST happen before Provider execution.

---

# PROVIDER VALIDATION

Provider validation belongs inside Provider.

Examples:

Invalid JSON.

Missing URL.

Missing Download.

HTTP Error.

Authentication Error.

Timeout.

Response mismatch.

---

# RESPONSE CONTRACT

Every Service MUST receive normalized responses.

Service MUST NEVER read:

response.data.url

response.result.download

response.images

response.author

response.channel

response.status

response.success

Provider MUST already normalize these values.

---

# RETURN VALUE

Every Service MUST return a stable structure.

Never expose raw provider response.

Never expose provider-specific fields.

Never leak implementation details.

---

# MULTIPLE PROVIDERS

A Service MUST NOT care which Provider answered.

NeoXR

↓

Naze

↓

Other Provider

↓

Normalized Result

Service receives only the final normalized object.

---

# STREAM

Services MUST NOT download streams.

Services MUST NOT save files.

Services MUST receive:

Temporary File Path

or

Buffer

already prepared by Provider.

---

# BUFFER

Services MUST receive ready-to-use Buffer.

No conversion.

No download.

No validation.

---

# FILE DOWNLOAD

Never perform:

axios(url)

fetch(url)

request(url)

inside Service.

Provider performs every download.

---

# FILE UPLOAD

Never upload directly.

Provider performs uploads.

---

# NORMALIZATION

Never normalize Provider response.

Provider already returns normalized object.

---

# RESPONSE FORMAT

Every Service MUST expose one stable interface.

Example

Image

↓

image

Audio

↓

download

filename

size

Video

↓

download

thumbnail

title

channel

views

duration

AI

↓

message

Search

↓

items[]

No Provider-specific fields allowed.

---

# SERVICE COMPATIBILITY

Existing Commands MUST continue working.

Changing Provider MUST NOT require changing Commands.

Changing Endpoint MUST NOT require changing Commands.

Only Provider should change.

---

# SERVICE DIRECTORY

Claude MUST inspect every folder before implementation.

ai/

anime/

creator/

downloader/

games/

image/

information/

search/

tools/

upload/

Read every Service.

Understand every dependency.

Do not assume implementation.

---

# DUPLICATED LOGIC

Claude MUST identify duplicated logic.

Examples:

Multiple YouTube implementations.

Multiple TikTok implementations.

Multiple Waifu implementations.

Multiple Brat implementations.

Merge them whenever possible.

---

# LEGACY CODE

Identify legacy implementations.

Mark them.

Remove only after compatibility is preserved.

Never delete working logic before replacement is verified.

---

# MIGRATION RULE

Migration MUST happen Service by Service.

Do NOT migrate entire project blindly.

Recommended order:

Downloader

↓

Creator

↓

Image

↓

Anime

↓

Search

↓

Tools

↓

Information

↓

Upload

↓

AI

Each category MUST be fully tested before moving to the next.

---

# TEST REQUIREMENT

Every migrated Service MUST be tested.

Validation includes:

Success

Failure

Timeout

Retry

Fallback

Invalid Parameter

Invalid Provider Response

Missing Download

Stream

Buffer

Regression

Only after passing all tests may migration continue.

---

# CURRENT MISSION

Claude MUST inspect every existing Service.

Claude MUST preserve compatibility.

Claude MUST eliminate duplicated logic.

Claude MUST eliminate Provider-specific implementation.

Claude MUST ensure every Service follows this specification before API Global V3 is considered complete.

---

# END OF PART 4

Part 5 defines the complete Response Contract, Common Object Standard, Normalization Specification, Compatibility Matrix, and Provider Output Format used across the entire API Global V3 architecture.


# API GLOBAL V3
# PART 5 — RESPONSE CONTRACT & NORMALIZATION SPECIFICATION

> This document defines the universal response standard used by the entire API Global V3 architecture.

Every Provider MUST normalize its response into the structures defined below.

No Service may depend on Provider-specific responses.

---

# MAIN OBJECTIVE

Different APIs return different JSON structures.

Different Providers use different field names.

Different endpoints expose different download formats.

API Global V3 exists to completely hide those differences.

Every Service MUST receive one unified response format.

Provider-specific responses MUST end inside Provider.

---

# UNIVERSAL RESPONSE

Every Service MUST only receive normalized objects.

Never expose raw Provider responses.

Never expose Provider-specific structures.

Never expose HTTP implementation.

Never expose Provider metadata.

---

# COMMON OBJECT

Every normalized object SHOULD follow this base structure.

success

provider

result

raw

Only Provider should know how raw is generated.

Services should almost never access raw.

---

# IMAGE CONTRACT

Every image-producing endpoint MUST return:

image

filename

size

mime

width

height

No matter which Provider generated it.

Supported features:

Sticker

Brat

IQC

QC

Triggered

Wasted

Photo Effect

AI Image

Waifu

Anime

Wallpaper

Pinterest

Everything should follow the same structure.

---

# AUDIO CONTRACT

Every audio-producing endpoint MUST return:

download

filename

title

size

duration

thumbnail

artist

provider

No Provider-specific fields.

Supported examples:

YouTube Audio

Spotify

TikTok Audio

Music Search

Voice Generator

TTS

Everything MUST use the same contract.

---

# VIDEO CONTRACT

Every video-producing endpoint MUST return:

download

filename

title

thumbnail

duration

quality

size

views

channel

publish

provider

No matter whether response comes from:

NeoXR

Naze

Other Providers

---

# SEARCH CONTRACT

Every search endpoint MUST return:

items[]

Each item SHOULD contain:

title

url

thumbnail

description

author

type

metadata

Never expose Provider-specific objects.

---

# AI CONTRACT

Every AI endpoint MUST return:

message

model

provider

usage (optional)

reasoning (optional)

Claude

ChatGPT

Gemini

DeepSeek

Llama

Qwen

All must produce the same structure.

---

# TRANSLATE CONTRACT

Return:

sourceLanguage

targetLanguage

translatedText

provider

---

# OCR CONTRACT

Return:

text

language

provider

confidence

---

# WEATHER CONTRACT

Return:

city

country

temperature

condition

humidity

wind

provider

---

# GITHUB CONTRACT

Return:

username

name

bio

followers

following

repository

avatar

provider

---

# PINTEREST CONTRACT

Return:

items[]

Each item:

image

source

title

provider

---

# WAIFU CONTRACT

Return:

images[]

Each image:

url

source

provider

No matter where the image comes from.

NeoXR

Safebooru

NekosAPI

NekosBest

Everything becomes identical.

---

# STICKER CONTRACT

Return:

sticker

filename

provider

No Service should know whether sticker originally came from:

PNG

WEBP

GIF

Video

Image

---

# UPLOAD CONTRACT

Return:

url

filename

size

provider

Supported:

Uguu

Catbox

Telegraph

Any future upload provider.

---

# FILE CONTRACT

Return:

url

filename

extension

size

mime

provider

---

# BOOLEAN CONTRACT

If endpoint returns only success/failure:

success

message

provider

Nothing else.

---

# PROVIDER NORMALIZATION

Every Provider MUST translate its own responses.

Example.

NeoXR

↓

data.url

↓

download

Naze

↓

result.download

↓

download

TikTok

↓

download.video.nowm

↓

download

Spotify

↓

audio

↓

download

Services MUST only see:

download

Never Provider fields.

---

# NULL HANDLING

Provider MUST guarantee stable objects.

Missing fields should become:

null

Never undefined.

Never missing properties.

---

# ERROR CONTRACT

Every error MUST follow:

success

provider

error

code

message

Never expose raw Provider stack.

Never expose HTTP internals.

---

# OPTIONAL FIELD

Optional fields should remain null.

Never remove properties.

Stable interfaces are mandatory.

---

# VERSION COMPATIBILITY

Future Providers MUST normalize into these contracts.

No changes should be required inside Services.

---

# MIGRATION GOAL

When migration is complete:

Changing Provider should require modifying only:

providers/

Nothing else.

Commands continue working.

Services continue working.

Business logic continues working.

Only Provider changes.

---

# VALIDATION

Claude MUST inspect every Service.

If a Service accesses:

result.download

data.url

response.images

response.video

response.audio

response.author

response.channel

Provider-specific fields

This is considered a migration bug.

Those accesses MUST be removed.

---

# FINAL TARGET

When API Global V3 is complete:

Providers may change.

Endpoints may change.

Remote APIs may change.

Response structures may change.

Services MUST NOT change.

Commands MUST NOT change.

Business Logic MUST NOT change.

This is the primary objective of API Global V3.

---

# END OF PART 5

Part 6 will define the complete Migration Procedure, Full Project Audit, Regression Testing, Compatibility Testing, Bug Elimination Strategy, Performance Optimization, and Completion Checklist required before API Global V3 can be considered production-ready.

# API GLOBAL V3
# PART 6 — MIGRATION PROTOCOL, FULL AUDIT & BUG ELIMINATION

> This document defines the mandatory execution protocol for migrating API Global into Version 3.

This protocol MUST be followed completely.

Skipping any step is considered an incomplete migration.

---

# MAIN OBJECTIVE

The objective of V3 migration is NOT to replace one provider with another.

The objective is to create a stable, maintainable, provider-independent architecture.

Every hidden issue must be discovered.

Every regression must be eliminated.

Every compatibility issue must be resolved.

Every Service must continue working exactly as before.

---

# BEFORE IMPLEMENTATION

Claude MUST NOT modify code immediately.

Claude MUST first inspect the entire project.

Implementation without understanding the project is prohibited.

---

# PHASE 1 — PROJECT AUDIT

Inspect every folder.

Read every file.

Understand every dependency.

Understand every Provider.

Understand every Service.

Understand every Core component.

Understand every Configuration.

Do not skip documentation.

Do not skip README.

Do not skip Architecture documents.

Do not skip Migration Guide.

Do not assume anything.

---

# PHASE 2 — DEPENDENCY ANALYSIS

Identify every dependency.

Create internal dependency graph.

Determine:

Who imports whom.

Who depends on whom.

Which modules are shared.

Which modules are legacy.

Which modules are duplicated.

Which modules are obsolete.

Implementation MUST wait until dependency analysis is complete.

---

# PHASE 3 — PROVIDER AUDIT

Inspect every Provider.

Verify:

GET

POST

JSON

Multipart

Upload

Download

Stream

Buffer

Retry

Timeout

Validation

Normalization

Authentication

API Key Injection

Base URL

Temporary File Handling

Cleanup

Everything must be verified.

---

# PHASE 4 — SERVICE AUDIT

Inspect every Service.

Verify:

Business Logic

Imports

Provider Usage

Validation

Compatibility

Legacy Logic

Duplicated Logic

Direct HTTP Calls

Direct axios Usage

Direct fetch Usage

Direct request Usage

Everything above must be identified.

---

# PHASE 5 — BUG DISCOVERY

Search the entire project.

Find every possible bug.

Examples include:

Broken Import

Wrong Import

Unused Import

Circular Dependency

Invalid Response

Wrong Response Type

Wrong Stream Handling

Wrong Buffer Handling

Wrong Timeout

Wrong Retry

Wrong Provider Priority

Wrong Download Logic

Wrong Upload Logic

Wrong Normalization

Wrong Validation

Wrong File Cleanup

Wrong Error Translation

Everything must be listed before implementation begins.

---

# PHASE 6 — MIGRATION

Migration MUST happen gradually.

Recommended order:

Provider

↓

Core Compatibility

↓

Downloader

↓

Creator

↓

Image

↓

Anime

↓

Search

↓

Tools

↓

Information

↓

Upload

↓

AI

Never migrate everything simultaneously.

Finish one category before moving to the next.

---

# PHASE 7 — COMPATIBILITY TEST

Every migrated category MUST pass compatibility tests.

Commands MUST continue working.

No command should require modification.

No Service should require rewriting.

Only Providers should change.

---

# PHASE 8 — REGRESSION TEST

Claude MUST verify:

Old functionality still works.

New functionality works.

Fallback still works.

Primary Provider works.

Buffer works.

Stream works.

Retry works.

Timeout works.

Upload works.

Download works.

Everything must pass.

---

# PHASE 9 — PERFORMANCE AUDIT

Search for:

Duplicate HTTP Requests.

Duplicate Downloads.

Duplicate Uploads.

Duplicate Buffer Conversion.

Duplicate Stream Conversion.

Unnecessary Await.

Nested Await.

Sequential Requests that should be parallel.

Unnecessary Promise Chains.

Blocking Operations.

Unused Variables.

Unused Functions.

Unused Files.

Dead Code.

Everything above must be optimized.

Optimization MUST NOT reduce compatibility.

---

# PHASE 10 — CODE QUALITY

Search entire project for:

TODO

FIXME

Temporary Patch

Temporary Solution

Legacy Code

Deprecated Logic

Experimental Logic

Unused Export

Unused Import

Duplicate Function

Copy-Paste Logic

Everything must be reviewed.

---

# PHASE 11 — PROVIDER VALIDATION

NeoXR Provider MUST become the reference implementation.

Every supported endpoint MUST function correctly.

If NeoXR fails:

Fallback MUST activate automatically.

Fallback failure MUST NOT crash Services.

---

# PHASE 12 — RESPONSE VALIDATION

Every normalized object MUST be validated.

No Service should ever receive:

Provider-specific JSON.

Raw HTTP Response.

Incomplete Object.

Unexpected Field.

Broken Download URL.

Broken Image URL.

Broken Audio URL.

Broken Video URL.

---

# PHASE 13 — COMMAND VALIDATION

Every command using API Global MUST be tested.

Examples include but are not limited to:

Downloader

Creator

Image

Anime

Search

Information

Tools

Upload

AI

Regression is unacceptable.

---

# PHASE 14 — DOCUMENTATION

Whenever architecture changes:

Architecture documentation MUST also be updated.

Migration Guide MUST also be updated.

Provider documentation MUST also be updated.

Endpoint Registry MUST also be updated.

Documentation is part of implementation.

---

# PHASE 15 — FINAL AUDIT

Before migration is considered complete, Claude MUST verify:

✓ No broken import.

✓ No broken Provider.

✓ No broken Service.

✓ No duplicated logic.

✓ No direct HTTP request outside Providers.

✓ No Provider-specific response inside Services.

✓ No regression.

✓ No compatibility issue.

✓ No temporary patch.

✓ No dead code.

✓ No unfinished migration.

Only after every checklist passes may API Global V3 be considered complete.

---

# STRICT REQUIREMENTS

Claude MUST think before writing code.

Claude MUST inspect before modifying code.

Claude MUST verify before continuing.

Claude MUST finish one category before moving to the next.

Claude MUST prioritize correctness over speed.

Claude MUST preserve compatibility at all costs.

The migration is complete ONLY when every Provider, Core component, Service, and Command functions correctly without regression.

---

# END OF PART 6

Part 7 will define the Final Completion Standard, Provider Compatibility Matrix, Quality Assurance Checklist, Future Expansion Rules, and Production Release Criteria for API Global V3.

# API GLOBAL V3
# PART 7 — QUALITY ASSURANCE, RELEASE STANDARD & FUTURE DEVELOPMENT

> This document defines the final requirements before API Global V3 is considered complete.

Passing compilation does NOT mean migration is complete.

Passing one feature does NOT mean migration is complete.

API Global V3 is considered complete ONLY when every requirement below has been satisfied.

---

# FINAL OBJECTIVE

The objective is to produce a stable architecture.

Not merely working code.

Not merely passing tests.

Not merely compiling successfully.

The architecture itself must become maintainable for years.

---

# DEFINITION OF COMPLETED

API Global V3 is COMPLETE only when:

Every Provider works.

Every Service works.

Every Command works.

Every Core component works.

Every Configuration works.

Every Documentation matches implementation.

Every Migration Target is completed.

No known regression exists.

No hidden compatibility issue exists.

---

# RELEASE REQUIREMENTS

Before considering migration complete, verify:

Provider Layer

Core Layer

Configuration Layer

Service Layer

Public API

Documentation

Compatibility

Performance

Memory Usage

Temporary Files

Fallback System

Retry System

Timeout System

Everything above must pass.

---

# PROVIDER COMPATIBILITY

NeoXR

Status:

Primary Provider

Required:

100%

Support.

Every endpoint available inside Endpoint Registry should work.

---

Naze

Status:

Fallback Provider

Must remain fully compatible.

Fallback should activate automatically.

---

Neosantara

Status:

Dedicated AI Provider.

Must remain isolated from Downloader.

---

Future Providers

Every future Provider MUST follow:

Provider Specification

Response Contract

Migration Rules

Compatibility Rules

No exception.

---

# COMMAND COMPATIBILITY

Migration MUST NOT require changing Commands.

Existing commands should continue working.

Changing Provider should never require changing Commands.

If Commands need modification,

investigate Provider first.

---

# SERVICE COMPATIBILITY

Migration MUST NOT require changing business logic.

Services should continue working after Provider replacement.

Only Provider should change.

---

# PROVIDER EXTENSION

Future Provider addition should require only:

Create Provider

↓

Register Provider

↓

Done

Nothing else.

No Service modification.

No Core modification.

No Command modification.

---

# ENDPOINT EXTENSION

Adding new endpoint should require:

Create Service

↓

Register Export

↓

Done

Existing Services should remain untouched.

---

# PROJECT MAINTAINABILITY

The architecture should be understandable by developers unfamiliar with the project.

Folder responsibilities should remain obvious.

Implementation should remain modular.

Dependencies should remain minimal.

---

# PERFORMANCE TARGET

Migration should improve:

Request Speed.

Memory Usage.

Retry Logic.

Download Handling.

Upload Handling.

Temporary File Management.

Provider Switching.

Caching Compatibility.

---

# MEMORY MANAGEMENT

Temporary files should never accumulate.

Unused Buffers should be released.

Unused Streams should be closed.

Large downloads should avoid unnecessary memory allocation.

Memory leaks are unacceptable.

---

# ERROR MANAGEMENT

Every Provider error should become meaningful.

Internal implementation should never leak.

Users should receive clear messages.

Developers should receive sufficient debugging information.

---

# LOGGING

Provider execution should be traceable.

Useful logs include:

Provider selected.

Fallback activated.

Retry count.

Timeout occurred.

Validation failed.

Normalization failed.

Download completed.

Upload completed.

Logs should help debugging.

Logs should never expose API Keys.

---

# SECURITY

Never expose:

API Key.

Authentication Token.

Secret Header.

Internal URL.

Private Endpoint.

Sensitive Configuration.

Debug information intended only for developers.

---

# DOCUMENTATION

Whenever architecture changes:

Update:

API_ARCHITECTURE.md

Migration Guide

Audit Report

Provider Documentation

Endpoint Registry

README

Documentation must always match implementation.

---

# FUTURE DEVELOPMENT

Every new Service MUST follow:

Provider Specification.

Response Contract.

Migration Rules.

Compatibility Rules.

Every new Provider MUST support:

Normalization.

Retry compatibility.

Timeout compatibility.

Automatic validation.

Automatic download.

Automatic upload.

Automatic error translation.

---

# FINAL QUALITY CHECKLIST

Before release verify:

✓ Every Provider responds correctly.

✓ Every Service is Provider-independent.

✓ Every Command still functions.

✓ Every Core component remains stable.

✓ Every Configuration is valid.

✓ Every Response follows Response Contract.

✓ Every Endpoint matches documentation.

✓ Every Fallback functions correctly.

✓ Every Retry behaves correctly.

✓ Every Timeout behaves correctly.

✓ Every Stream works.

✓ Every Buffer works.

✓ Every Upload works.

✓ Every Download works.

✓ No regression detected.

✓ No duplicated logic.

✓ No dead code.

✓ No circular dependency.

✓ No legacy patch remains.

✓ No unfinished migration remains.

✓ Documentation updated.

Only after ALL items above pass may API Global V3 be considered production-ready.

---

# CLAUDE EXECUTION REQUIREMENT

Claude MUST think before implementing.

Claude MUST inspect before modifying.

Claude MUST validate before continuing.

Claude MUST preserve compatibility.

Claude MUST eliminate root causes instead of applying temporary fixes.

Claude MUST complete migration category by category.

Claude MUST stop and reassess whenever architectural inconsistencies are discovered.

The success of API Global V3 is measured by stability, compatibility, maintainability, and correctness—not by the amount of code changed.

---

# END OF API GLOBAL V3 SPECIFICATION

This document serves as the highest-level development contract for the entire `apiGlobal` architecture.

Any implementation that violates these specifications MUST be considered incomplete and requires further revision before being merged into the project.