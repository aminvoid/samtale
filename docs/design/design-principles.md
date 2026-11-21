# Design principles

| | |
|---|---|
| **Status** | v1 |
| **Date** | 2026-11-19 |
| **Author** | `ui-designer` |

Six principles for every screen and component. They translate the UX principles (orientation, thumb reach, low load, anxiety-aware, faithful, accessible, bidi-explicit; [UX README](../ux/README.md#principles-applied)) into visual decisions. When two pull against each other, the earlier one wins.

---

## 1. Calm is a feature

The learner arrives anxious about speaking under time pressure (personas: Maryam, Ahmad). The interface lowers the temperature: warm paper surfaces, one accent colour, generous space, no alarms. Timers inform; they never warn.

| Do | Don't |
|---|---|
| Show the exam clock as quiet text, "۲:۱۵ از حدود ۴:۳۰", in the same colour from the first second to the grace period. Lead the grace notice with permission, on a soft accent tint with an info icon. | Turn a timer orange or red near the end, pulse it, shake it, or show a countdown anywhere except the 10-second look. Use an error colour for anything the learner did. |

## 2. The learning text is the hero

Danish is what learners came for; Persian is the guide that helps them reach it. The Danish question is the largest text in its section, set in a face built for character distinction, with Persian line heights generous enough that dots and marks never collide.

| Do | Don't |
|---|---|
| Set the examiner's question in Atkinson Hyperlegible Next at 20–22 px, weight 500; let Danish paragraphs fill the reading column and align to their own left edge. Keep Persian at 14 px or larger, 400 or heavier, line height 1.6–1.9. | Shrink Danish into a grey caption under a Persian heading, use thin weights, add letter-spacing to Persian, or let a narrow LTR block float in the middle of the RTL column. |

## 3. Every role has a face

Examiner speech, sample answers, key words, personal examples, translations and the learner's own voice each have one combination of **icon + label + colour** used identically on the topic page, in the mock, in the review and on the phrases page. Colour is always the third signal, never the only one.

| Do | Don't |
|---|---|
| Open every content block with its role header: the lucide icon in a tinted chip, the Persian role label in the role ink ("سؤال اجباری اول"), then the content. Mark the suggested follow-up with the same examiner indigo but its own icon and a dashed edge ("suggested", not scripted). | Distinguish roles by colour alone, invent a new style for one screen, or give the sample answer a green "correct" look. |

## 4. One obvious next step

Each screen has one primary action, in the same place every time; in focused mode it sits in the bottom thumb zone and never moves (UXD-08). Everything else is visibly secondary.

| Do | Don't |
|---|---|
| Use one filled accent button per view; make secondary actions outlined or text buttons; keep "I've finished my answer" 56 px tall and pinned at the bottom; keep Leave at the top start, far from it. | Put two filled buttons side by side, change the primary button's position between phases, or place a destructive action next to a frequent one. |

## 5. Honest by design

The app never pretends to grade, predict or be official. The visual language has no scores, stars, progress rings, streaks, red/green pass/fail or "official" seals. Provenance is shown plainly, in the same quiet style everywhere.

| Do | Don't |
|---|---|
| Show neutral facts ("زمان کل: ۳:۵۲", "۲ بار تمرین شده") as plain text; tick boxes in the self-check stay boxes, with no total; show "checked against SIRI's examiner booklet" as a small badge-check label with a disclosure for the date and page. | Show "۵ از ۷", a completion percentage, a coloured bar for self-check results, a trophy for a finished mock, or a seal that looks like an official stamp. |

## 6. Direction is designed, not guessed

The interface is right to left; Danish, media and clocks are left to right; and the boundary between them is always explicit. Icons mirror only when they mean direction.

| Do | Don't |
|---|---|
| Mirror back/next chevrons, the step indicator and the guide's timeline connectors; keep play, the scrubber, the clock and the record dot unmirrored; stack every Danish–Persian pair on two lines; put durations in LTR isolates. | Rely on the browser to guess the direction of a mixed line, mirror a question-mark icon, run the audio progress bar right to left, or write "Danish · Persian" on one line. |

## 7. Built for the small, old phone first

Ahmad's modest Android phone on a slow network is the reference device. Every target is at least 44 px, the primary action in focused mode 56 px; layouts survive 320 px and 200 % text; nothing decorative costs bytes.

| Do | Don't |
|---|---|
| Use inline SVG icons from the one lucide set (tree-shaken), system emoji only as decorative content hooks, two variable font files in total, no images on content pages, and text-first loading. | Add illustrations, background images, a third typeface, or a control smaller than 44 × 44 px; rely on hover to reveal anything. |
