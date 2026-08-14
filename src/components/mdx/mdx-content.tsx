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
  PCAPointSpace,
  PCAFeatureSpace,
} from "./regression-figures";
import { BackpropGraph } from "./fig-backprop";
import { MomentumRavine } from "./fig-ravine";
import { LossCurveShapes } from "./fig-losscurves";
import { BoostingResidualStrip } from "./fig-boosting";
import { ElboAscent } from "./fig-elbo";
import { MarginLosses } from "./fig-margin-losses";
import { NoiseModelToLoss } from "./fig-noise-loss";
import { RidgeVsPcrShrinkage } from "./fig-shrinkage";
import { EstimatorIsRandom } from "./fig-beta-random";
import { StratifiedVsSrs } from "./fig-stratified";
import {
  RowVsColumnStorage,
  SplitStrategyPanels,
  LeakageTimeline,
} from "./data-figures";
import {
  ClassificationLossCurves,
  FocalDownweighting,
  ReliabilityDiagram,
} from "./classification-figures";
import {
  TreePartition2D,
  DecorrelationVarianceFloor,
  RFvsGBDTErrorCurves,
} from "./tree-figures";
import {
  SVMMarginDiagram,
  KernelLift1Dto2D,
  kNNBoundaries,
  DistanceConcentration,
} from "./kernel-figures";
import {
  ConfusionMatrixHeat,
  RocPrSideBySide,
  ThresholdSweep,
} from "./metrics-figures";
import {
  BiasVarianceUCurve,
  DoubleDescent,
  CvFoldStrip,
  LearningCurveDiag,
} from "./validation-figures";
import {
  KMeansVoronoi,
  GmmVsKmeansContours,
  LinkageDendrogram,
  TsnePerplexitySweep,
} from "./clustering-figures";
import {
  GaussianClassConditionals,
  NgJordanCurves,
  NbReliability,
} from "./probabilistic-figures";
import {
  SmoteInterpolation,
  SmoteLeakageSplit,
  ThresholdShiftEquivalence,
  CalibrationHarm,
} from "./imbalance-figures";
import {
  TvsNormalTails,
  TCriticalVsDf,
  PValueAsArea,
} from "./inference-figures";

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
        PCAPointSpace,
        PCAFeatureSpace,
        BackpropGraph,
        MomentumRavine,
        LossCurveShapes,
        BoostingResidualStrip,
        ElboAscent,
        MarginLosses,
        NoiseModelToLoss,
        RidgeVsPcrShrinkage,
        EstimatorIsRandom,
        StratifiedVsSrs,
        RowVsColumnStorage,
        SplitStrategyPanels,
        LeakageTimeline,
        ClassificationLossCurves,
        FocalDownweighting,
        ReliabilityDiagram,
        TreePartition2D,
        DecorrelationVarianceFloor,
        RFvsGBDTErrorCurves,
        SVMMarginDiagram,
        KernelLift1Dto2D,
        kNNBoundaries,
        DistanceConcentration,
        ConfusionMatrixHeat,
        RocPrSideBySide,
        ThresholdSweep,
        BiasVarianceUCurve,
        DoubleDescent,
        CvFoldStrip,
        LearningCurveDiag,
        KMeansVoronoi,
        GmmVsKmeansContours,
        LinkageDendrogram,
        TsnePerplexitySweep,
        GaussianClassConditionals,
        NgJordanCurves,
        NbReliability,
        SmoteInterpolation,
        SmoteLeakageSplit,
        ThresholdShiftEquivalence,
        CalibrationHarm,
        TvsNormalTails,
        TCriticalVsDf,
        PValueAsArea,
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
