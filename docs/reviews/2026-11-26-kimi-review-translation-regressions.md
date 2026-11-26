# Independent review (Kimi): regression check of the translation fixes

- **Reviewer:** Kimi Code CLI (`kimi -p`, read-only), 2026-11-26. Saved by the main thread.
- **Scope:** the 180 translations changed in fix round 1 (before vs after, against the Danish).
- **Result:** 4 regressions, 176 clean.
- **Applied by the main thread:**
  - 2020-nov-b.general.q2: Kimi's fix, because *mere* covers time, company and care.
  - *lære mere kriminalitet* (2016-maj-a.general.q2, 2021-maj-c.general.q2, 2021-maj-c.general.followup1): «رفتار مجرمانهٔ بیشتری یاد بگیرند», which is faithful without adding Kimi's "how to commit".

`2016-maj-a.general.q2.answer` — «با جرم‌های بیشتری آشنا شوند» loses the idea of learning to commit crimes, reducing it to becoming familiar with crimes — یک مزیت این است که جوانان همراه با مجرمان بزرگسال به زندان نمی‌روند، جایی که ممکن است یاد بگیرند چگونه جرم‌های بیشتری مرتکب شوند.

`2020-nov-b.general.q2.answer` — removing «بیشتری» from companionship and care loses the scope of *mere*, which applies to time, companionship and care — یک مزیت این است که سالمندان و بیماران وقت، همراهی و مراقبت بیشتری دریافت می‌کنند.

`2021-maj-c.general.followup1.answer` — the revision loses the idea of learning criminal behaviour from adults — در زندان ممکن است از بزرگسالان یاد بگیرند چگونه جرم‌های بیشتری مرتکب شوند.

`2021-maj-c.general.q2.answer` — as in the identical 2016 text, becoming familiar with crimes does not fully convey learning to commit them — یک مزیت این است که جوانان همراه با مجرمان بزرگسال به زندان نمی‌روند، جایی که ممکن است یاد بگیرند چگونه جرم‌های بیشتری مرتکب شوند.

No regression: 176 items

