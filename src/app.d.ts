import type { EmblaCarouselType } from "embla-carousel";

declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    onemblaInit?: (event: CustomEvent<EmblaCarouselType>) => void;
  }
}
