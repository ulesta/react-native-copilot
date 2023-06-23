import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Modal,
  NativeModules,
  Platform,
  StatusBar,
  View,
  type LayoutChangeEvent,
  type LayoutRectangle,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useCopilot } from "../contexts/CopilotProvider";
import type { CopilotOptions } from "../types";
import { StepNumber } from "./default-ui/StepNumber";
import { Tooltip } from "./default-ui/Tooltip";
import {
  ARROW_SIZE,
  MARGIN,
  STEP_NUMBER_DIAMETER,
  STEP_NUMBER_RADIUS,
  styles,
} from "./style";

type Props = CopilotOptions;

const noop = () => {};

const makeDefaultLayout = (width: number, height: number): LayoutRectangle => ({
  x: 0,
  y: 0,
  width,
  height,
});

export interface CopilotModalHandle {
  animateMove: (obj: LayoutRectangle) => Promise<void>;
}

export const CopilotModal = forwardRef<CopilotModalHandle, Props>(
  function CopilotModal(
    {
      easing = Easing.elastic(0.7),
      animationDuration = 400,
      tooltipComponent: TooltipComponent = Tooltip,
      tooltipStyle = {},
      stepNumberComponent: StepNumberComponent = StepNumber,
      overlay = typeof NativeModules.RNSVGSvgViewManager !== "undefined"
        ? "svg"
        : "view",
      animated = typeof NativeModules.RNSVGSvgViewManager !== "undefined",
      androidStatusBarVisible = false,
      backdropColor = "rgba(0, 0, 0, 0.4)",
      labels = {
        finish: "Finish",
        next: "Next",
        previous: "Previous",
        skip: "Skip",
      },
      svgMaskPath,
      stopOnOutsideClick = false,
      arrowColor = "#fff",
      arrowSize = ARROW_SIZE,
      margin = MARGIN,
      CustomTooltip,
    },
    ref
  ) {
    const { stop, currentStep, visible } = useCopilot();
    const [tooltipStyles, setTooltipStyles] = useState({});
    const [arrowStyles, setArrowStyles] = useState({});
    const [animatedValues] = useState({
      top: new Animated.Value(0),
      stepNumberLeft: new Animated.Value(0),
    });
    const windowDimensions = useWindowDimensions();
    const layoutRef = useRef(
      makeDefaultLayout(windowDimensions.width, windowDimensions.height)
    );
    const [layout, setLayout] = useState<LayoutRectangle | undefined>(
      undefined
    );
    const [maskRect, setMaskRect] = useState<LayoutRectangle | undefined>();

    const [isAnimated, setIsAnimated] = useState(false);
    const [containerVisible, setContainerVisible] = useState(false);

    useEffect(() => {
      if (visible) {
        console.log("❤️ container is visible");
        setContainerVisible(true);
      }
    }, [visible]);

    useEffect(() => {
      if (!visible) {
        reset();
      }
    }, [visible]);

    const handleLayoutChange = ({
      nativeEvent: { layout: newLayout },
    }: LayoutChangeEvent) => {
      layoutRef.current = newLayout;
    };

    const measure = async (): Promise<LayoutRectangle> => {
      return await new Promise((resolve) => {
        const updateLayout = () => {
          if (layoutRef.current.width !== 0) {
            resolve(layoutRef.current);
          } else {
            requestAnimationFrame(updateLayout);
          }
        };

        updateLayout();
      });
    };

    const _animateMove = useCallback(
      async (rect: LayoutRectangle) => {
        const newMeasuredLayout = await measure();

        console.log("✨");
        console.log(newMeasuredLayout);

        if (!androidStatusBarVisible && Platform.OS === "android") {
          rect.y -= StatusBar.currentHeight ?? 0;
        }

        let stepNumberLeft = rect.x - STEP_NUMBER_RADIUS;

        if (stepNumberLeft < 0) {
          stepNumberLeft = rect.x + rect.width - STEP_NUMBER_RADIUS;
          if (stepNumberLeft > newMeasuredLayout.width - STEP_NUMBER_DIAMETER) {
            stepNumberLeft = newMeasuredLayout.width - STEP_NUMBER_DIAMETER;
          }
        }

        const center = {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        };

        const relativeToLeft = center.x;
        const relativeToTop = center.y;
        const relativeToBottom = Math.abs(center.y - newMeasuredLayout.height);
        const relativeToRight = Math.abs(center.x - newMeasuredLayout.width);

        const verticalPosition =
          relativeToBottom > relativeToTop ? "bottom" : "top";
        const horizontalPosition =
          relativeToLeft > relativeToRight ? "left" : "right";

        const tooltip: ViewStyle = {};
        const arrow: ViewStyle = {};

        if (rect.height > 4 && rect.width > 4) {
          if (verticalPosition === "bottom") {
            tooltip.top = rect.y + rect.height + margin;
            arrow.borderBottomColor = arrowColor;
            arrow.top = tooltip.top - arrowSize * 2;
          } else {
            tooltip.bottom = newMeasuredLayout.height - (rect.y - margin);
            arrow.borderTopColor = arrowColor;
            arrow.bottom = tooltip.bottom - arrowSize * 2;
          }

          if (horizontalPosition === "left") {
            tooltip.right = Math.max(
              newMeasuredLayout.width - (rect.x + rect.width),
              0
            );
            tooltip.right =
              tooltip.right === 0 ? tooltip.right + margin : tooltip.right;
            tooltip.maxWidth = newMeasuredLayout.width - tooltip.right - margin;
            arrow.right = tooltip.right + margin;
          } else {
            tooltip.left = Math.max(rect.x, 0);
            tooltip.left =
              tooltip.left === 0 ? tooltip.left + margin : tooltip.left;
            tooltip.maxWidth = newMeasuredLayout.width - tooltip.left - margin;
            arrow.left = tooltip.left + margin;
          }
        }

        sanitize(arrow);
        sanitize(tooltip);
        sanitize(rect);

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`tooltip.top=${tooltip.top}`);

        const animate = [
          ["top", rect.y],
          ["stepNumberLeft", stepNumberLeft],
        ] as const;

        if (isAnimated) {
          Animated.parallel(
            animate.map(([key, value]) => {
              return Animated.timing(animatedValues[key], {
                toValue: value,
                duration: animationDuration,
                easing,
                useNativeDriver: false,
              });
            })
          ).start();
        } else {
          animate.forEach(([key, value]) => {
            animatedValues[key].setValue(value);
          });
        }

        setTooltipStyles(tooltip);
        setArrowStyles(arrow);
        setLayout(newMeasuredLayout);
        setMaskRect({
          width: rect.width > 4 ? rect.width : 0,
          height: rect.height > 4 ? rect.height : 0,
          x: Math.floor(Math.max(rect.x, 0)),
          y: Math.floor(Math.max(rect.y, 0)),
        });
      },
      [
        androidStatusBarVisible,
        animatedValues,
        animationDuration,
        arrowColor,
        easing,
        isAnimated,
        arrowSize,
        margin,
      ]
    );

    const animateMove = useCallback<CopilotModalHandle["animateMove"]>(
      async (rect) => {
        await new Promise<void>((resolve) => {
          const frame = async () => {
            await _animateMove(rect);
            resolve();
          };

          setContainerVisible(true);
          requestAnimationFrame(() => {
            void frame();
          });
        });
      },
      [_animateMove]
    );

    const reset = () => {
      setIsAnimated(false);
      setContainerVisible(false);
      setLayout(undefined);
    };

    const handleStop = () => {
      reset();
      void stop();
    };

    const handleMaskClick = () => {
      if (stopOnOutsideClick) {
        handleStop();
      }
    };

    useImperativeHandle(
      ref,
      () => {
        return {
          animateMove,
        };
      },
      [animateMove]
    );

    const modalVisible = containerVisible || visible;
    const contentVisible = layout != null && containerVisible;

    if (!modalVisible) {
      return null;
    }

    const overlayContainerStyle =
      maskRect?.height && maskRect.width
        ? styles.container
        : { ...styles.container, ...styles.overlayContainerFlexCenter };

    console.log(overlayContainerStyle);

    return (
      <Modal
        animationType="none"
        visible
        onRequestClose={noop}
        transparent
        supportedOrientations={["portrait", "landscape"]}
      >
        <View style={overlayContainerStyle} onLayout={handleLayoutChange}>
          {contentVisible && renderMask()}
          {contentVisible && renderTooltip()}
        </View>
      </Modal>
    );

    function renderMask() {
      const MaskComponent =
        overlay === "svg"
          ? // eslint-disable-next-line @typescript-eslint/no-var-requires
            require("./SvgMask").SvgMask
          : // eslint-disable-next-line @typescript-eslint/no-var-requires
            require("./ViewMask").ViewMask;

      const size = maskRect && {
        x: maskRect.width <= 4 ? 0 : maskRect.width,
        y: maskRect.height <= 4 ? 0 : maskRect.height,
      };

      const position = maskRect;

      return (
        <MaskComponent
          animated={animated}
          layout={layout}
          style={styles.overlayContainer}
          size={size}
          position={position}
          easing={easing}
          animationDuration={animationDuration}
          backdropColor={backdropColor}
          svgMaskPath={svgMaskPath}
          onClick={handleMaskClick}
          currentStep={currentStep}
        />
      );
    }

    function renderTooltip() {
      if (!currentStep) {
        return null;
      }
      return (
        <>
          <Animated.View
            key="stepNumber"
            style={[
              styles.stepNumberContainer,
              {
                left: animatedValues.stepNumberLeft,
                top: Animated.add(animatedValues.top, -STEP_NUMBER_RADIUS),
              },
            ]}
          >
            <StepNumberComponent />
          </Animated.View>

          {!!arrowSize && (
            <Animated.View key="arrow" style={[styles.arrow, arrowStyles]} />
          )}
          <Animated.View
            key="tooltip"
            style={[styles.tooltip, tooltipStyles, tooltipStyle]}
          >
            <TooltipComponent CustomTooltip={CustomTooltip} labels={labels} />
          </Animated.View>
        </>
      );
    }
  }
);

const floorify = (obj: Record<string, any>) => {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "number") {
      obj[key] = Math.floor(obj[key]);
    }
  });
};

const removeNan = (obj: Record<string, any>) => {
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "number" && isNaN(obj[key])) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete obj[key];
    }
  });
};

const sanitize = (obj: Record<any, any>) => {
  floorify(obj);
  removeNan(obj);
};
