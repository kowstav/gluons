# Third-party automation dependencies

Gluons uses upstream code through package dependencies. The new workflow composition, sector rules, validation and approval gate are Gluons code. Entire third-party applications have not been rebranded or copied.

[upstreams.json](upstreams.json) records installed versions, repositories, roles and licence metadata. npm release integrity is recorded in `package-lock.json`; the optional invoice worker and its transitive versions are pinned in `packages/automation-bridge/requirements.txt`. The dated GitHub repository survey is in `docs/research/` and is separate from the installed-release record.

Original direct-dependency licence texts are retained in [licenses/](licenses/). Package distributions also contain their upstream and transitive notices, which must be retained when distributing dependencies. The root MIT licence covers Gluons' own code and does not replace those terms.

The English OCR package declares MIT in npm metadata, but the [naptha/tessdata repository licence](https://github.com/naptha/tessdata/blob/gh-pages/LICENSE) is Apache-2.0. Treat the language data under the upstream Apache terms; a copy is retained here. Tesseract.js and its WebAssembly core are Apache-2.0. unpdf also incorporates Mozilla PDF.js; its Apache licence is retained separately.

The Python bridge uses the existing invoice2data implementation with an original Gluons template; no supplier template corpus is redistributed here. No upstream code from n8n, ERPNext, Firecrawl, Activepieces, Pipecat, Chronicle or the Vapi server SDK was copied as part of this integration. Their research disposition is not a blanket claim that their licences prohibit commercial use.
