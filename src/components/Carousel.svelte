<script lang="ts">
    import EmblaCarousel from "embla-carousel";
    import type { EmblaCarouselType, EmblaEventType } from "embla-carousel";
    import { onMount, onDestroy } from "svelte";
    import type { GetImageResult } from "astro";

    let { images }: { images: GetImageResult[] } = $props();

    let viewportEl: HTMLElement;
    let emblaApi: EmblaCarouselType | null = null;

    let canScrollPrev = $state(false);
    let canScrollNext = $state(false);
    let selectedIndex = $state(0);

    // --- Tween scale ---
    const TWEEN_FACTOR_BASE = 0.15;
    let tweenFactor = 0;
    let tweenNodes: HTMLElement[] = [];

    const numberWithinRange = (n: number, min: number, max: number) =>
        Math.min(Math.max(n, min), max);

    const setTweenNodes = (emblaApi: EmblaCarouselType): void => {
        tweenNodes = emblaApi.slideNodes().map((slideNode) => {
            return slideNode.querySelector("img") as HTMLElement;
        });
    };

    const setTweenFactor = (emblaApi: EmblaCarouselType): void => {
        tweenFactor = TWEEN_FACTOR_BASE * emblaApi.scrollSnapList().length;
    };

    const tweenScale = (
        emblaApi: EmblaCarouselType,
        eventName?: EmblaEventType,
    ): void => {
        const engine = emblaApi.internalEngine();
        const scrollProgress = emblaApi.scrollProgress();
        const slidesInView = emblaApi.slidesInView();
        const isScrollEvent = eventName === "scroll";

        emblaApi.scrollSnapList().forEach((scrollSnap, snapIndex) => {
            let diffToTarget = scrollSnap - scrollProgress;
            const slidesInSnap = engine.slideRegistry[snapIndex];

            slidesInSnap.forEach((slideIndex) => {
                if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

                if (engine.options.loop) {
                    engine.slideLooper.loopPoints.forEach((loopItem) => {
                        const target = loopItem.target();
                        if (slideIndex === loopItem.index && target !== 0) {
                            const sign = Math.sign(target);
                            if (sign === -1)
                                diffToTarget =
                                    scrollSnap - (1 + scrollProgress);
                            if (sign === 1)
                                diffToTarget =
                                    scrollSnap + (1 - scrollProgress);
                        }
                    });
                }

                const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor);
                const scale = numberWithinRange(tweenValue, 0, 1).toString();
                tweenNodes[slideIndex].style.transform = `scale(${scale})`;
            });
        });
    };

    function updateState() {
        if (!emblaApi) return;
        canScrollPrev = emblaApi.canScrollPrev();
        canScrollNext = emblaApi.canScrollNext();
        selectedIndex = emblaApi.selectedScrollSnap();
    }

    onMount(() => {
        emblaApi = EmblaCarousel(viewportEl, {
            loop: true,
        });
        updateState();

        emblaApi.on("select", updateState).on("reInit", updateState);

        const mql = window.matchMedia("(min-width: 1024px)");

        const setupTween = () => {
            setTweenNodes(emblaApi!);
            setTweenFactor(emblaApi!);
            tweenScale(emblaApi!);

            emblaApi!
                .on("reInit", setTweenNodes)
                .on("reInit", setTweenFactor)
                .on("reInit", tweenScale)
                .on("scroll", tweenScale)
                .on("slideFocus", tweenScale);
        };

        const teardownTween = () => {
            emblaApi!
                .off("reInit", setTweenNodes)
                .off("reInit", setTweenFactor)
                .off("reInit", tweenScale)
                .off("scroll", tweenScale)
                .off("slideFocus", tweenScale);

            // reset all slide transforms
            tweenNodes.forEach((node) => (node.style.transform = ""));
        };
        if (mql.matches) setupTween();

        const onMqlChange = (e: MediaQueryListEvent) => {
            if (e.matches) setupTween();
            else teardownTween();
        };

        mql.addEventListener("change", onMqlChange);

        return () => {
            mql.removeEventListener("change", onMqlChange);
        };
    });
    onDestroy(() => emblaApi?.destroy());
</script>

<div
    class="mb-12.5 md:mb-18.75 lg:mb-16.5 relative"
    style="--slide-size: 62%; --slide-spacing: 2.5rem;"
>
    <!-- Viewport -->
    <div class="embla__viewport overflow-clip" bind:this={viewportEl}>
        <!-- Container -->
        <div
            class="ml-0 flex touch-pan-y touch-pinch-zoom lg:-ml-(--slide-spacing)"
        >
            {#each images as image, i}
                <div
                    class="pl-0 basis-full shrink-0 grow-0 min-w-0 lg:basis-(--slide-size) lg:pl-(--slide-spacing)"
                >
                    <img
                        class="block w-full object-cover max-sm:aspect-square sm:aspect-64/45 lg:aspect-video"
                        src={image.src}
                        fetchpriority={i === 0 ? "high" : "auto"}
                        srcset={image.srcSet.attribute}
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        alt={image.attributes.alt}
                        width={image.attributes.width}
                        height={image.attributes.height}
                    />
                </div>
            {/each}
        </div>
    </div>

    <!-- Controls -->
    <div
        class="inset-x-4 absolute bottom-4 md:inset-x-2 md:bottom-2 grid grid-cols-[1fr_auto] justify-between items-end lg:hidden"
    >
        <!-- Dots -->
        <div class="flex gap-1.5 items-center mb-1.5">
            {#each { length: images.length } as _, i}
                <button
                    type="button"
                    aria-label="Go to slide {i + 1}"
                    onclick={() => emblaApi?.scrollTo(i)}
                    class={[
                        "size-1.5 rounded-full cursor-pointer touch-manipulation",
                        "[-webkit-tap-highlight-color:rgba(0,0,0,0.5)]",
                        i === selectedIndex ? "bg-white" : "bg-white/65",
                    ]}
                ></button>
            {/each}
        </div>

        <!-- Prev / Next -->
        <div class="grid grid-cols-2 items-center">
            <button
                aria-label="Previous"
                type="button"
                disabled={!canScrollPrev}
                onclick={() => emblaApi?.scrollPrev()}
                class={[
                    "flex items-center justify-center cursor-pointer touch-manipulation z-10 [-webkit-tap-highlight-color:rgba(49,49,49,0.5)]",
                    canScrollPrev ? "text-white" : "text-white/55",
                ]}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="size-7"><path d="m15 18-6-6 6-6" /></svg
                >
            </button>
            <button
                aria-label="Next"
                type="button"
                disabled={!canScrollNext}
                onclick={() => emblaApi?.scrollNext()}
                class={[
                    "flex items-center justify-center cursor-pointer touch-manipulation z-10 [-webkit-tap-highlight-color:rgba(49,49,49,0.5)]",
                    canScrollNext ? "text-white" : "text-white/55",
                ]}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="size-7"><path d="m9 18 6-6-6-6" /></svg
                >
            </button>
        </div>
    </div>
</div>
