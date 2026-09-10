"use client";

import React from "react";

import type { EvaluationFormData } from "./types";

type MobileQuestionLineStyle = { left: string; width: string } | null;

function getQuestionButton(container: HTMLDivElement, questionIndex: number) {
  return container.querySelector(`[data-question-index="${questionIndex}"]`) as HTMLElement | null;
}

function calculateLineStyle(container: HTMLDivElement, commentsIndex: number): MobileQuestionLineStyle {
  const firstButton = getQuestionButton(container, 0);
  const commentsButton = getQuestionButton(container, commentsIndex);

  if (!firstButton || !commentsButton) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const firstRect = firstButton.getBoundingClientRect();
  const commentsRect = commentsButton.getBoundingClientRect();
  const firstCenter = firstRect.left - containerRect.left + firstRect.width / 2;
  const commentsCenter = commentsRect.left - containerRect.left + commentsRect.width / 2;

  return {
    left: `${firstCenter}px`,
    width: `${commentsCenter - firstCenter}px`,
  };
}

function scrollQuestionIntoCenter(container: HTMLDivElement, questionIndex: number) {
  const currentButton = getQuestionButton(container, questionIndex);
  if (!currentButton) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const buttonRect = currentButton.getBoundingClientRect();
  const buttonLeft = buttonRect.left - containerRect.left + container.scrollLeft;
  const buttonCenter = buttonLeft + buttonRect.width / 2;
  const targetScroll = buttonCenter - container.clientWidth / 2;

  container.scrollTo({ left: targetScroll, behavior: "smooth" });
}

export function useEvaluationMobileQuestionNav(formData: EvaluationFormData | null) {
  const skillsListRef = React.useRef<HTMLDivElement>(null);
  const [lineStyle, setLineStyle] = React.useState<MobileQuestionLineStyle>(null);
  const questionsLength = formData?.questions.length ?? 0;
  const currentQuestionIndex = formData?.currentQuestionIndex ?? 0;

  React.useEffect(() => {
    const container = skillsListRef.current;
    if (!container || questionsLength === 0) {
      setLineStyle(null);
      return;
    }

    const updateLineStyle = () => {
      setLineStyle(calculateLineStyle(container, questionsLength));
    };

    updateLineStyle();

    const resizeObserver = new ResizeObserver(updateLineStyle);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [questionsLength, currentQuestionIndex]);

  React.useEffect(() => {
    const container = skillsListRef.current;
    if (container && formData) {
      scrollQuestionIntoCenter(container, formData.currentQuestionIndex);
    }
  }, [formData?.currentQuestionIndex]);

  return { skillsListRef, lineStyle };
}
