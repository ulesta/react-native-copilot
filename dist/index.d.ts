import { ViewStyle, Animated, NativeMethods, LayoutRectangle, ScrollView } from 'react-native';
import * as React$1 from 'react';
import React__default, { PropsWithChildren } from 'react';
import { NativeMethods as NativeMethods$1 } from 'react-native/types';
import { Emitter } from 'mitt';

interface Step {
    name: string;
    order: number | number[];
    visible: boolean;
    wrapperRef: React.RefObject<NativeMethods>;
    measure: () => Promise<LayoutRectangle>;
    titleText?: string;
    text: string;
    buttonText?: string;
}
interface ValueXY {
    x: number;
    y: number;
}
type SvgMaskPathFunction = (args: {
    size: Animated.ValueXY;
    position: Animated.ValueXY;
    canvasSize: ValueXY;
    step: Step;
}) => string;
type Labels = Partial<Record<"skip" | "previous" | "next" | "finish", string>>;
interface TooltipProps {
    labels: Labels;
    CustomTooltip?: React.ComponentType<CustomTooltipProps>;
}
interface CustomTooltipProps {
    currentStep?: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    handleStop?: () => void;
    handleSkip?: () => void;
    handlePrev?: () => void;
    handleNext?: () => void;
}
interface CopilotOptions {
    easing?: ((value: number) => number) | undefined;
    overlay?: "svg" | "view";
    animationDuration?: number;
    tooltipComponent?: React.ComponentType<TooltipProps>;
    tooltipStyle?: ViewStyle;
    stepNumberComponent?: React.ComponentType<any>;
    animated?: boolean;
    labels?: Labels;
    androidStatusBarVisible?: boolean;
    svgMaskPath?: SvgMaskPathFunction;
    verticalOffset?: number;
    arrowColor?: string;
    arrowSize?: number;
    margin?: number;
    stopOnOutsideClick?: boolean;
    backdropColor?: string;
    CustomTooltip?: React.ComponentType<CustomTooltipProps>;
}

type PropsWithCopilot<P> = P & {
    copilot: {
        ref?: React__default.RefObject<NativeMethods$1>;
        onLayout?: () => void;
    };
};
declare function walkthroughable<P = any>(WrappedComponent: React__default.ComponentType<P>): React__default.FunctionComponent<PropsWithCopilot<P>>;

interface Props {
    name: string;
    order: number | number[];
    text: string;
    children?: React__default.ReactElement<any>;
    active?: boolean;
}
declare const CopilotStep: ({ name, order, text, children, active, }: Props) => React__default.ReactElement<any, string | React__default.JSXElementConstructor<any>> | React__default.FunctionComponentElement<any>;

type Events = {
    start: undefined;
    stop: undefined;
    stepChange: Step | undefined;
};
interface CopilotContextType {
    registerStep: (step: Step) => void;
    unregisterStep: (stepName: string) => void;
    currentStep: Step | undefined;
    start: (fromStep?: string, suppliedScrollView?: ScrollView | null) => Promise<void>;
    stop: () => Promise<void>;
    goToNext: () => Promise<void>;
    goToNth: (n: number) => Promise<void>;
    goToPrev: () => Promise<void>;
    visible: boolean;
    copilotEvents: Emitter<Events>;
    isFirstStep: boolean;
    isLastStep: boolean;
    currentStepNumber: number;
    hideSkip?: boolean;
    hidePrevious?: boolean;
}
declare const CopilotProvider: ({ verticalOffset, children, ...rest }: PropsWithChildren<CopilotOptions>) => JSX.Element;
declare const useCopilot: () => CopilotContextType;

declare const DefaultUI: {
    StepNumber: React$1.FunctionComponent<unknown>;
    Tooltip: ({ CustomTooltip, labels }: TooltipProps) => JSX.Element;
};

export { CopilotOptions as CopilotProps, CopilotProvider, CopilotStep, CustomTooltipProps, DefaultUI, TooltipProps, useCopilot, walkthroughable };
