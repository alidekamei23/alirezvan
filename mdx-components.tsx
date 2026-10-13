// Components available inside every MDX blog post without an import.
// Required by @next/mdx with the App Router.
import type { MDXComponents } from "mdx/types";
import { ContactBox } from "@/components/ContactBox";

const components: MDXComponents = {
  ContactBox,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
