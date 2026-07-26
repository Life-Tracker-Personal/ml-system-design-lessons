import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import { DeepDive } from "./deep-dive";
import { LossChart } from "./loss-chart";
import { Quiz } from "./quiz";
import {
  OLSFit,
  Sigmoid,
  RegularizationBalls,
  ShrinkageCurves,
  PCARotation,
} from "./regression-figures";

export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={{
        DeepDive,
        LossChart,
        OLSFit,
        Sigmoid,
        RegularizationBalls,
        ShrinkageCurves,
        PCARotation,
        Quiz,
      }}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [rehypeSlug, rehypeKatex],
        },
      }}
    />
  );
}
