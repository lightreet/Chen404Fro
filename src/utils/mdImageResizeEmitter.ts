type Listener<T> = (payload: T) => void;

export type MdImageResizePayload = {
  /** 图片 src */
  src: string;
  /** 目标宽度（百分比字符串，如 60%） */
  width: string;
};

class SimpleEmitter<T> {
  private listeners = new Set<Listener<T>>();

  on(listener: Listener<T>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(payload: T) {
    for (const listener of this.listeners) {
      try {
        listener(payload);
      } catch {
        // ignore
      }
    }
  }
}

export const mdImageResizeEmitter = new SimpleEmitter<MdImageResizePayload>();

