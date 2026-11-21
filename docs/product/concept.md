# Concept: PD3 Mundtlig learning app

**Status:** agreed in brainstorm with the project owner, 18 November 2026. This is the input for the PRD (`docs/product/prd.md`), not the PRD itself.

## The problem

Persian-speaking adults in Denmark preparing for the oral part of **Prøve i Dansk 3** (PD3, B2 level) need to practise **delprøve 2**: an unprepared interview of about 4½ minutes on a topic they draw at the exam. Good preparation material exists in Persian: a 116-page booklet by Shery Rahimi with every official delprøve 2 question from 2016–2024, plus older terms. Each question comes with Persian translations, key words and simple model answers. But a PDF can't:

- let learners hear the questions and answers spoken
- simulate the time pressure and order of the real exam
- let learners record and compare themselves
- track what they have practised

Exam rules and history are documented in [ABOUT_PD3_MUNDTLIG.md](../resources/ABOUT_PD3_MUNDTLIG.md).

## Who it is for

- **Primary:** Persian speakers (Iranian and Afghan/Dari backgrounds) taking PD3, mostly B1+ to B2, often working adults who study in short sessions on their phones.
- **The app is public** for the community.

## What we're building (v1)

| Area | What it does |
|---|---|
| **Exam guide** | A short Persian explanation of how delprøve 2 works, with a visual timeline of the 4½ minutes |
| **Topic library** | Browse topics by theme, by year, or by "comes up often"; search in Danish and Persian |
| **Topic study page** | The examiner's question (with audio) → Persian translation (shown on request) → key words → model answer with audio and word highlighting → official follow-up question and short answer → personal example |
| **Answer templates** | The booklet's three answer templates ("golden skeletons") as interactive cards, with audio |
| **Phrases and vocabulary** | The booklet's key phrases with audio |
| **Shadowing** | Hear a sentence, record yourself saying it, then compare the two |
| **Mock exam** | Draw card A, B or C → 10 seconds to look at the topic → the examiner voice asks the required questions and follow-ups → you answer while a timer runs and the app records you → the exam ends with *"Tak, så er prøven forbi."* |
| **After the mock exam** | Play your recording next to the model answer, plus a self-check list: reason? example? both sides? conclusion? |
| **Progress** | Saved on the device: topics studied, mock exams done, review reminders on the booklet's spaced schedule (day 1 → 3 → 7 → 14) |

## Constraints and decisions

- **No AI/LLM features** for now. The only external service is **Azure AI Speech**: text-to-speech now, possibly speech-to-text later.
- **Audio is generated ahead of time** (not in the browser), with saved word timings for highlighting.
- **The interface is in Persian (RTL),** built with i18n so other interface languages can be added. Content carries locale-keyed translations, kept separate from interface strings.
- **Content is extracted carefully from the PDF into data files** and read through a data-access layer, so it's easy to correct and easy to move to a database later.
- **No accounts in v1.** Progress lives in the browser behind an interface, so a database and accounts can be added later.
- **Responsive, phone first.** Offline support is not required.
- **Recordings never leave the device** in v1.
- **Next.js,** latest stable version.
- **No deadline. Quality over speed.**

## Later (not v1)

- Accounts and syncing across devices
- Speech-to-text ("what you said") and pronunciation feedback (Danish support still to be checked)
- Delprøve 1: prepared presentation, with a 2-minute timer and follow-up question practice
- More interface languages (English first)
- Vocabulary flashcards
- An AI examiner

## Open issues

- **Content permission:** written permission from the booklet's author. The owner is in contact with the author. Nothing is published until this is settled.
- **Content source (resolved 18 November 2026):** the owner extracted the booklet into clean Markdown (`docs/resources/PD3_Mundtlig_Delproeve2.md`). It is now the content source, and the Persian is no longer scrambled.
- **Situation pictures:** the official SIRI pictures can't be used, so we need our own approach (illustrations, icons or text).
- **Digits in the Persian interface:** Persian (۴½) or Latin (4½).
- **Name and visual identity:** to be proposed by `ui-designer`.
