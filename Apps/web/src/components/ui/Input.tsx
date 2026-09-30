import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "./cx";

type InputWidth = "default" | "sm" | "narrow";

function inputClass(width: InputWidth = "default", className?: string) {
  return cx("input", width !== "default" && `input-${width}`, className);
}

type ControlProps = {
  width?: InputWidth;
  invalid?: boolean;
};

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & ControlProps
>(function Input({ width, invalid, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={inputClass(width, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & ControlProps
>(function Select({ width, invalid, className, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={inputClass(width, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & ControlProps
>(function Textarea({ width, invalid, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={inputClass(width, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});
