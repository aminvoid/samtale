import { Dialog, type DialogProps } from "./dialog";

type SheetProps = Omit<DialogProps, "presentation">;

export function Sheet(props: SheetProps) {
  return <Dialog {...props} presentation="sheet" />;
}
