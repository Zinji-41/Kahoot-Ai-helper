# Kahoot AI Helper

An unofficial, experimental Chrome extension that reads visible Kahoot questions using Gemini or OpenAI and suggests an answer. Version **0.2.7**.

The extension attempts to click its suggested answer. If the page does not visibly respond, a large banner tells you which color and shape to click, such as **CLICK BLUE â—† â€” France**. Automatic clicks do not work reliably in all Kahoot modes. AI suggestions can be incorrect; no accuracy or response-time guarantee is made.

## Install from this repository

1. Choose **Code â†’ Download ZIP** and extract it.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `source` folder inside the extracted repository. Alternatively, extract `kahoot-helper.zip` and select its folder containing `manifest.json`.
4. Refresh any open Kahoot tabs.
5. Open the extension on your Kahoot player tab, select **Google Gemini** or **OpenAI**, enter your own API key, and save.
6. Click **Start on this player tab**. Use **Stop** to stop answering.

For updates, replace the local source files, click **Reload** on the extension, and refresh Kahoot. The popup and player status should display **0.2.7**.

## API setup

- [Create a Gemini API key](https://aistudio.google.com/apikey). The default is `gemini-3.5-flash-lite`, with minimal thinking. Check your model access, [pricing](https://ai.google.dev/gemini-api/docs/pricing), and project quotas; free-tier limits can interrupt a quiz.
- [Create an OpenAI API key](https://platform.openai.com/api-keys). The OpenAI default is `gpt-4.1`; API usage may incur charges.

Never commit or share your API key. Enter it only in your locally installed extension popup.

## Question source

The model needs the actual question and choices. If they are visible on your player tab, keep that tab active and use the default source.

If a separate Kahoot host tab shows the question, open it in a separate Chrome window, open the extension there, and click **Use this tab as question source**. Keep it active in that window, then start the helper on the player tab. The host and player must show the same question. Opening the extension grants temporary screenshot permission; navigation may require opening it again.

Questions shown only on a projector, someone else's device, a video call, or a non-Kahoot website are not accessible. Colored player buttons alone do not reveal the question.

## Behavior and limitations

- Intended for single-answer multiple choice and true/false. Typing, polls, multiple selections, sorting, and audio/video-dependent questions are unsupported.
- Detects indexed answer controls and uses a visual tile fallback for other layouts. Changes to Kahoot can break detection.
- Uses text-only requests when question/answer text is available and no large media is detected; otherwise attempts a screenshot. Detection is heuristic.
- Requests time out after 18 seconds. There is no eight-second cutoff. The extension attempts to click immediately after a validated answer arrives.
- Cancels requests after a detected question transition and checks for stale answers before clicking. Identical screens without an observable transition cannot reliably be distinguished.
- Suggested colors are derived from tile backgrounds. Unknown colors fall back to the answer text.
- A click failure or no observable page change triggers the manual color banner. This check does not prove that Kahoot accepted a submission or that an answer is correct.
- Requests are attempted once per detected question. Stop and start to retry a failed request.

## Privacy

While enabled, the extension sends visible question/answer text and, when used, screenshots of the selected Kahoot tab directly to the selected provider: `generativelanguage.googleapis.com` or `api.openai.com`. Screenshots can include personal information visible in the tab. Text context is capped at 6,000 characters; text-only requests send only the extracted question and choices. Screenshots are resized to at most 1,280 pixels wide where supported.

Keys and settings are held in Chrome's extension session storage, not the repository or synced storage. Restarting the browser clears the session. There is no additional extension server or telemetry. OpenAI requests set `store: false`; providers' own retention and data-use policies still apply. Review Gemini's free-tier data-use terms before sending sensitive content.

## Validation

JavaScript syntax and mocked behavior were checked for provider requests, answer mapping, credential isolation, cancellation, stale-answer rejection, tile detection, click event dispatch, and color banners. These checks do not establish live browser compatibility, accuracy, or latency. Automatic click acceptance remains unresolved on some live Kahoot layouts; use the color banner when necessary.

## Files

| File | Purpose |
| --- | --- |
| `source/manifest.json` | Chrome Manifest V3 configuration and permissions |
| `source/content.js` | Question/tile detection, click attempts, manual color banner |
| `source/worker.js` | AI requests, screenshot resizing, session settings |
| `source/popup.html`, `source/popup.js` | Provider/key configuration and controls |

This project is not affiliated with Kahoot!, Google, or OpenAI.

