import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { DeepDive } from "./deep-dive";
import { Quiz } from "./quiz";

export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={{
        DeepDive,
        Quiz,
      }}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [rehypeKatex],
        },
      }}
    />
  );
}
