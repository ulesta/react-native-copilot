import React, { useEffect, useMemo, useRef } from "react";
import { View, type NativeMethods } from "react-native";

import { useCopilot } from "../contexts/CopilotProvider";

interface Props {
  name: string;
  order: number | number[];
  text: string;
  children?: React.ReactElement<any>;
  active?: boolean;
}

export const CopilotStep = ({
  name,
  order,
  text,
  children,
  active = true,
}: Props) => {
  const registeredName = useRef<string | null>(null);
  const { registerStep, unregisterStep } = useCopilot();

  const wrapperRef = React.useRef<NativeMethods | null>(null);

  const measure = async () => {
    return await new Promise<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>((resolve) => {
      const measure = () => {
        // Wait until the wrapper element appears
        if (!children) {
          resolve({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          });
        }

        if (wrapperRef.current != null && "measure" in wrapperRef.current) {
          wrapperRef.current.measure((_ox, _oy, width, height, x, y) => {
            resolve({
              x,
              y,
              width,
              height,
            });
          });
        } else {
          requestAnimationFrame(measure);
        }
      };

      measure();
    });
  };

  useEffect(() => {
    if (active) {
      if (registeredName.current && registeredName.current !== name) {
        unregisterStep(registeredName.current);
      }

      if (order instanceof Array) {
        order.forEach((order) => {
          registerStep({
            name: `name-${order}`,
            text,
            order,
            measure,
            wrapperRef,
            visible: true,
          });
        });
      } else {
        registerStep({
          name,
          text,
          order,
          measure,
          wrapperRef,
          visible: true,
        });
      }

      registeredName.current = name;
    }
  }, [name, order, text, registerStep, unregisterStep, active]);

  useEffect(() => {
    if (active) {
      return () => {
        if (registeredName.current) {
          unregisterStep(registeredName.current);
        }
      };
    }
  }, [name, unregisterStep, active]);

  const copilotProps = useMemo(
    () => ({
      ref: wrapperRef,
      onLayout: () => {}, // Android hack
    }),
    []
  );

  return children
    ? React.cloneElement(children, { copilot: copilotProps })
    : React.cloneElement(<View />, { copilot: copilotProps });
};
