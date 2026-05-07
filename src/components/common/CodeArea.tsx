import { forwardRef, TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  language?: string;
  fullHeight?: boolean;
}

const CodeArea = forwardRef<HTMLTextAreaElement, Props>(function CodeArea(
  { language, className, fullHeight, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      data-lang={language}
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      className={`textarea code-area w-full ${
        fullHeight ? 'h-full min-h-[200px]' : 'min-h-[180px]'
      } ${className ?? ''}`}
      {...rest}
    />
  );
});

export default CodeArea;
