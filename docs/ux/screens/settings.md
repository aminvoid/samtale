# Screen: Settings

| | |
|---|---|
| **Route** | `/fa/settings` |
| **Stories** | US-049 (Must), US-045 #3, US-054, US-055 (Could), US-056 #3, US-015 #3, US-050, US-059 #3 |
| **Flows** | [progress-and-data](../flows/progress-and-data.md) |
| **Milestone** | M2 (delete), M3 (recordings size, preferences) |

## Purpose

Control the few preferences that matter and **delete everything** the app stored on this device.

## Content hierarchy

1. `h1` "Settings"
2. **Listening and reading** (`h2`)
   - Default playback speed: 0.75× · 1× · 1.25× (US-015 #3; US-055)
   - Persian translations: start hidden (default) · start shown (US-055, Could)
   - Always show the examiner's text in **practice** mock exams (UXD-13; rev. 2, R-12: moved here from get ready; never applies in exam conditions; answer aloud shows the text by default anyway)
3. **Appearance** (`h2`): "Follows your device's light or dark setting." (US-054; information only, no control in v1)
4. **Recordings** (`h2`, shown only if any are kept; US-045 #3): "{n} kept attempts · {size}" · **Delete saved recordings**
5. **Your data** (`h2`): "Everything is stored only in this browser on this device." · **Delete my progress** (US-049 #1) · Privacy link (US-059 #3)
6. About and sources link
7. No language switcher while only `fa` exists (US-056 #3)

## Components

PageHeader, RadioGroup (segmented), Switch, InfoNote, Button (destructive), ConfirmDialog, Toast, StorageNotice, Link.

## States

| State | Behaviour |
|---|---|
| First-time | Defaults shown; "Delete my progress" disabled with the reason "Nothing is stored yet." |
| Loading | Preferences read from the device; controls render with defaults until read, without moving. |
| Empty | No kept recordings → the Recordings section isn't shown. |
| Error | Delete with corrupted data still clears everything (US-049 #4). |
| Slow network | Not applicable. |
| Microphone denied | Not applicable (permissions are the browser's). A line under "Your data": "The microphone permission is managed by your browser." with help link. |
| Storage unavailable | StorageNotice; preference controls work for this session only (labelled so); delete actions hidden. |
| After deleting everything | The app navigates to home in its first-visit state (US-049 #3); toast "Your data has been deleted." |

**Delete dialogs** (US-049 #2): title names the action; body lists exactly what goes (progress, review schedules, mock history, self-check ticks, kept recordings, preferences, one-time notes) and says it can't be undone; buttons "Delete everything" (destructive) and "Cancel" (default focus). The recordings-only dialog lists the number and size.

## Responsive behaviour

Single column at every width; max reading width at 1280.

## RTL and bidi

- Speed values "0.75×" etc. formatted with Persian digits; the "×" sign stays after the number in reading order (ICU message).
- Sizes ("2.4 MB") via the locale's unit formatter.

## Accessibility

- Each group is a `fieldset`/section with a heading; radios and switches have visible labels.
- Changing a preference announces nothing (the control's state is announced); saving failures produce the single storage toast.
- Destructive buttons are not adjacent to frequently used controls.

## Copy needs

| Key | Intended meaning | Draft |
|---|---|---|
| `settings.title` | Settings | «تنظیمات» |
| `settings.listening` | Listening and reading | – |
| `settings.speed` | Default playback speed | – |
| `settings.translations` / `.hidden` / `.shown` | Persian translations · Start hidden · Start shown | – |
| `settings.alwaysText` | Always show the examiner's text in practice mock exams | – |
| `settings.appearance` / `.followsDevice` | Appearance · Follows your device's light or dark setting. | – |
| `settings.recordings` / `.summary` / `.delete` | Recordings · {count, plural, other {# kept attempts}} · {size} · Delete saved recordings | – |
| `settings.data` / `.localOnly` / `.deleteAll` / `.nothingYet` | Your data · Everything is stored only in this browser on this device. · Delete my progress · Nothing is stored yet. | – |
| `settings.micNote` | The microphone permission is managed by your browser. | – |
| `settings.sessionOnly` | Can't be saved in this browser; applies until you close it. | – |
| `settings.confirm.all.title` / `.body` / `.confirm` / `.cancel` | Delete everything? · This removes your progress, review schedules, mock history, self-check ticks, kept recordings and settings from this device. It can't be undone. · Delete everything · Cancel | – |
| `settings.confirm.recordings.title` / `.body` / `.confirm` | Delete saved recordings? · This removes {count} kept attempts ({size}). It can't be undone. · Delete recordings | – |
| `settings.deleted` | Your data has been deleted. | – |

## Wireframe

**375 px**
```
┌─────────────────────────────────────┐
│                           Settings  │ h1
│                Listening and reading│ h2
│  Default speed  [1.25×][•1×][0.75×] │
│  Persian translations               │
│     (◉) Start hidden ( ) Start shown│
│  Always show the examiner's text [○]│
│                          Appearance │ h2
│  Follows your device's light/dark.  │
│                          Recordings │ h2
│  2 kept attempts · 2.4 MB           │
│  [ Delete saved recordings ]        │
│                           Your data │ h2
│  Stored only in this browser.       │
│  [ Delete my progress ]             │
│                           Privacy › │
└─────────────────────────────────────┘
```
