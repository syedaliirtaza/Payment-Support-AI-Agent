export type TypewriterHandle = {
  cancel: () => void;
};

export function runTypewriter(
  fullText: string,
  onUpdate: (visible: string) => void,
  onDone: () => void,
  charDelayMs = 14,
): TypewriterHandle {
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const tick = () => {
    index += 1;
    onUpdate(fullText.slice(0, index));
    if (index < fullText.length) {
      timer = setTimeout(tick, charDelayMs);
    } else {
      timer = null;
      onDone();
    }
  };

  if (!fullText) {
    onDone();
    return { cancel };
  }

  timer = setTimeout(tick, charDelayMs);
  return { cancel };
}
