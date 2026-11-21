# Visual spec: Settings

| | |
|---|---|
| **UX spec** | [../../ux/screens/settings.md](../../ux/screens/settings.md) |
| **Route** | `/fa/settings` |
| **Components** | PageHeader, RadioGroup (segmented), Switch, InfoNote, Button (destructive), ConfirmDialog, Toast, StorageNotice |

## 375 px (single column at every width; `max-inline-reading` at 1280)

| Section | Spec |
|---|---|
| `h1` | «تنظیمات» |
| Listening and reading (`h2`) | Default speed: label + SpeedControl full width (three 44 px segments «۰٫۷۵×» «۱×» «۱٫۲۵×»). Persian translations: label + segmented RadioGroup «پنهان در شروع» (default) / «نمایان در شروع». Always show examiner's text in **practice**: Switch row, switch at the right, description `text-caption` «در شرایط آزمون اعمال نمی‌شود.» |
| Appearance (`h2`) | `text-body text-text-muted` «از تنظیم روشن یا تیرهٔ دستگاه شما پیروی می‌کند.» with `sun-moon` icon. No control. |
| Recordings (`h2`, only if any) | «۲ آزمون نگه داشته شده · ۲٫۴ مگابایت» · secondary-destructive (outlined, `text-danger`, `trash-2`) «حذف ضبط‌های ذخیره‌شده» |
| Your data (`h2`) | «همه چیز فقط در همین مرورگر روی همین دستگاه ذخیره می‌شود.» · the microphone note `text-caption` · **filled destructive** «حذف پیشرفت من» placed after 24 px of space, never next to a preference control · tertiary Privacy link |
| About | Tertiary «دربارهٔ برنامه و منابع ›» |

Sections are separated by 1 px rules and 32 px of space. Each section is a `fieldset`-like group with its `h2`.

## States

| State | Look |
|---|---|
| First visit | «حذف پیشرفت من» aria-disabled with «هنوز چیزی ذخیره نشده.» |
| Storage unavailable | StorageNotice at the top; controls labelled «فقط تا وقتی مرورگر را ببندید»; delete actions hidden |
| Delete dialog | ConfirmDialog: title «همه چیز حذف شود؟», the exact list, the danger-subtle "can't be undone" line, Cancel first and focused, «همه چیز را حذف کن» filled destructive |
| After deleting | Navigates home (first visit); Toast «داده‌های شما حذف شد.» |
