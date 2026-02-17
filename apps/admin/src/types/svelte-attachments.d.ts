declare module "svelte/attachments" {
  export type Attachment<T extends Element = Element> = (element: T) => void;
}
