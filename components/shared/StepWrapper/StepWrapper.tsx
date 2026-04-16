"use client";

import { type CSSProperties, type ReactNode } from "react";
import styles from "./StepWrapper.module.css";

interface StepWrapperProps {
  color: string;
  children: ReactNode;
  fullHeight?: boolean;
}

export default function StepWrapper({ color, children, fullHeight }: StepWrapperProps) {
  return (
    <div
      className={styles.outer}
      style={
        {
          "--step-color": color,
          minHeight: fullHeight ? "100vh" : undefined,
        } as CSSProperties
      }
    >
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
