# Kahoot AI Helper — experimental Chrome extension

Automatically asks an AI model for an answer and clicks a supported Kahoot answer button. This is a best-effort prototype, not a tested 80%+ solver. It cannot guarantee every quiz, an instant response, or correct answers.

## Install

1. Extract `kahoot-helper.zip` to a folder.
2. In Chrome, open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked**, then select the extracted folder containing `manifest.json`.
4. Refresh any already-open Kahoot tabs. Pin the extension if useful.
5. Open the extension on your Kahoot player tab, choose **Google Gemini**, enter your own Gemini API key, and click **Save settings**. The default Gemini model is `gemini-3.8-flash`. Create a key at https://aistudio.google.com/apikey and check your model’s free-tier access and project quota in Google AI Studio. OpenAI remains available from the provider menu; use `gpt-4.1` and an OpenAI key for that provider. Switching providers clears the key field to prevent accidental use with the other service.
6. Click **Start on this player tab**. The small bottom-left status panel shows requests, selections, and errors. Click **Stop** in the popup to stop answering.

The model needs access to the actual question and answer choices. If your player tab displays them, keep it active and use the default player-tab source.

## When the question is on a separate host tab

Open the host's Kahoot question screen in a separate Chrome window. Click the extension icon on that tab, then **Use this tab as question source**. Keep that source tab active in its window so it can be captured. Start the helper on the player tab in your other window. Do not navigate the source tab away from Kahoot. Opening the extension icon grants temporary screenshot permission to that source tab; navigation may require granting it again.

A question shown only on a classroom projector, another person's device, a video call, or a non-Kahoot page is not accessible to this extension. Shape-only player buttons do not reveal the question. Source and player tabs must show the same question.

## Coverage and limits

- Targets single-answer multiple-choice and true/false controls using answer/choice attributes, with a fallback for groups of large, similarly sized colored answer tiles. A Kahoot interface change may require selector updates.
- No support is claimed for typing, multiple selections, ordering, polls, spoken audio, or video-dependent questions. The model is instructed to skip unsupported or unreadable questions, but can still misclassify them.
- Detects buttons every 250 milliseconds. Network and AI processing take additional time; the request times out after 18 seconds. Very short question timers may expire first.
- Attempts each detected question once. After a request failure, stop and start to retry. Errors such as invalid keys, insufficient quota, inaccessible models, or rate limits appear in the player status panel.
- Rechecks the detected question and buttons before clicking, and discards results after stopping or a detected question transition. Identical question screens without an observable transition cannot reliably be distinguished.
- No quiz database, hidden answer access, guaranteed accuracy, or measured success rate. AI guesses can be wrong, especially for niche, current, visual, or ambiguous questions.

## Privacy and costs

While enabled, the selected Kahoot tab's visible text (up to 18,000 characters), player answer labels, and, when permitted, its visible screenshot are sent directly to the selected provider: `generativelanguage.googleapis.com` for Gemini or `api.openai.com` for OpenAI. That screenshot can contain any personal information displayed in the tab. Gemini offers a limited free tier for selected models; your project/model quota controls availability. Paid-tier API use may incur charges on your account. Gemini free-tier content may be used to improve Google products; consult Google’s terms for regional details. There is no additional extension server or telemetry.

The API key and settings live in Chrome's extension session storage, not the web page or synced storage. Closing the browser clears the session; enter the key again next time. This is a personal, locally loaded extension: do not distribute copies containing your credentials. OpenAI requests set `store: false`; this does not override the API provider's separate retention policies.

## Validation

JavaScript syntax was checked. Mocked worker tests covered structured request construction, answer mapping, preventing content scripts from reading credentials, rejection while stopped, and discarding a request stopped while in flight. Gemini and OpenAI request paths, image mapping, and endpoint isolation were also verified using mocked responses. No real API key was available, and no live Kahoot game or end-to-end accuracy benchmark was run. Live browser compatibility and answer accuracy remain unverified.

## Implementation references

- [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [GPT-4.1 model documentation](https://developers.openai.com/api/docs/models/gpt-4.1)
- [Chrome tabs and screenshot API](https://developer.chrome.com/docs/extensions/reference/api/tabs)

## Gemini references

- [Create a Gemini key](https://aistudio.google.com/apikey)
- [Free tier and model pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini OpenAI compatibility API](https://ai.google.dev/gemini-api/docs/openai)

If updating from version 0.1, replace the extension files, click Reload on chrome://extensions, and refresh Kahoot tabs. Accept Chrome’s new permission for the Google API if prompted. Then select Gemini, save your key and model, and start again. Rate limits can interrupt a quiz; HTTP 429 indicates a quota or rate-limit issue.

## Version 0.2.1 detection fix

Broadened answer discovery for solo/practice layouts: indexed answer/choice attributes can now appear on non-button elements, and a geometric/color fallback detects large answer tiles without those attributes. Fixture tests cover two tiles matching the supplied screenshot, choice attributes, hidden/disabled elements, and unrelated header/navigation buttons. The exact live page DOM was not available; this fix has not been verified on a live Kahoot session.

To update, extract the new ZIP over the installed extension folder, click Reload on chrome://extensions, refresh the Kahoot page, then click Start again.

## Version 0.2.2 Gemini request fix

Gemini now uses the native generateContent endpoint with x-goog-api-key authentication, inline JPEG data, and JSON-schema output. Removed compatibility-layer parameters. Errors now preserve Google’s message for object, array, and plain-text error bodies, with API key redaction. The popup displays version 0.2.2 so you can confirm that the new files loaded. Mocked tests verify these paths plus the OpenAI request path; live API behavior remains unverified without a real key.

Extract over the installed extension folder, reload it at chrome://extensions, refresh the Kahoot page, and start again. If there is still a 400 error, share the complete error text shown in the status panel, without your API key. The error may concern the key, model access, account/location, or request data; the previous generic message did not establish which.

Native API reference: https://ai.google.dev/api/generate-content

## Version 0.2.3 speed changes

After reloading the extension and refreshing Kahoot, select Google Gemini and click **Use faster Gemini preset**. This saves gemini-3.5-flash-lite while retaining your entered Gemini key. Then click Start. Your existing model is preserved unless you choose the preset.

Flash-Lite uses minimal thinking; Flash uses low thinking; Gemini 2.5 Flash/Flash-Lite disable thinking. Unknown model families retain their defaults. Screenshots are downscaled to at most 1280 pixels wide at JPEG quality 70, page text is capped at 6000 characters, and output is capped at 1024 tokens with a short reason. These settings may reduce accuracy. The 18-second deadline is retained. Question transitions cancel old requests so they do not hold up the next question. Elapsed time appears in the player status.

Mocked tests verify thinking settings, payload limits, cancellation, and next-request availability. Live latency is unmeasured; network/provider delays and free-tier limits can still cause timeouts.

References: https://firebase.google.com/docs/ai-logic/thinking and https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite

## Version 0.2.4 automatic speed path

The old default Gemini 3.8 Flash setting now upgrades automatically to gemini-3.5-flash-lite. Other custom model choices are preserved. Auto-click remains enabled: the model’s selected index is clicked immediately after response validation. No confirmation is needed for each question. Unreadable or unsupported questions can still be skipped.

DOM mutation detection starts requests as answer elements appear, with 100 ms polling as a fallback. Questions with detected text, readable answer labels, and no detected large visible media use a text-only request to avoid screenshot/upload processing. Large detected media and shape-only choices retain screenshots. Media detection is heuristic: CSS decorations or unusual layouts can affect it.

Mocked tests verify auto-click, prevention of duplicate clicks, rejection of stale answers, automatic model migration, text-only screenshot skipping, and retention of screenshots for media and shape-only options. No live timing or accuracy benchmark was available.

Update by extracting into the installed extension folder, reloading the extension at chrome://extensions, refreshing Kahoot, and clicking Start. The popup must display 0.2.4.

## Version 0.2.5 detection fix

Added viewport hit-testing for large colored answer tiles without semantic HTML labels or matching class names. Replaced the four-ancestor shared-wrapper restriction with grid alignment and color diversity checks. Reused detected controls during question extraction to reduce repeated scanning. Status now includes version 0.2.5 and the detected tile count; detection exceptions are displayed instead of leaving a stale waiting message.

Tests use viewport coordinates, sizes, and colors matching the supplied four-answer screenshot and earlier two-answer screenshot, with no answer selectors, roles, or matching class names. Disabled and navigation controls are excluded; indexed-attribute detection is retained. These are simulated DOM tests, not live browser verification.

After replacing files, reload the extension, refresh Kahoot, and click Start. Confirm the player status itself says **AI Helper 0.2.5**; an older unversioned Waiting for answer buttons message means an old content script is still loaded.

## Version 0.2.6 click receiver and compact answers

Clicks now hit-test the centre of the selected tile, deliver pointer/mouse down/up events, then click the foreground receiver instead of a potentially inert colored background. SVG receivers use a bubbling click event fallback. The status reports the chosen label, preparation/API times, and warns if no page change is detected after 600 ms. This checks observable changes, not correctness or guaranteed submission acceptance. Synthetic events remain untrusted; a website can reject them.

Gemini returns only a validated answer integer (0 means skip), avoiding explanations. Text-only questions send only question/choices, rather than the full page. The 18-second timeout remains; there is no eight-second cutoff. The extension clicks immediately after an eligible answer arrives. No measured speedup or live compatibility is claimed.

Mocked tests cover foreground receiver targeting, pointer/mouse event sequence, exactly one click, SVG fallback, answer-index validation, compact text payload, and timing. Reload the extension and refresh Kahoot after replacing the files; the version should read 0.2.6.

## Version 0.2.7 color fallback

As soon as an answer arrives, a large colored banner names the suggested tile and shape, for example AI ANSWER: BLUE ◆ — France. If the click throws or no page change is observed within 600 ms, it switches to CLICK BLUE ◆ — France. This is an AI suggestion, not a guarantee of correctness. Colors are read from the actual tile/nearby DOM backgrounds rather than assumed from index order. Unknown colors fall back to the answer label.

The banner clears when a question changes or you stop, and is ignored by the mutation observer. Auto-click is still attempted, but live acceptance remains unresolved on the user’s Kahoot page. This update supplies a fast manual fallback; it does not claim to resolve trusted-event restrictions or all click failures.

Mocked tests cover the four colors, dark variants, transparent-wrapper lookup, purple/white rejection, manual banner after a no-effect or blocked click, and clearing on Stop. Replace files, reload the extension, refresh Kahoot, and click Start. Verify version 0.2.7.
