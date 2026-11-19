
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const bannerSlides = [
  {
    id: 1,
    image:
      "https://assets-in-gm.bmscdn.com/promotions/cms/creatives/1795066191262_omweb.jpg",
    alt: "BookMyShow promotional banner",
  },
  {
    id: 2,
    image:
      "https://cinelockz.netlify.app/assets/banner/banner5.avif",
    alt: "U1 Tour promotional banner",
  },
  {
    id: 3,
    image:
      "https://assets-in-gm.bmscdn.com/promotions/cms/creatives/1793882506722_vaweb.jpg",
    alt: "Promotional event banner",
  },
];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState({});

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % bannerSlides.length);
  };

  const goToPrevious = () => {
    setActiveIndex(
      (current) =>
        (current - 1 + bannerSlides.length) % bannerSlides.length
    );
  };

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(goToNext, 5000);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="promo-carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div className="promo-track">
        {bannerSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`promo-slide ${
              index === activeIndex ? "active" : ""
            }`}
            aria-hidden={index !== activeIndex}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className={loaded[index] ? "loaded" : ""}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
              onLoad={() =>
                setLoaded((previous) => ({
                  ...previous,
                  [index]: true,
                }))
              }
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="promo-arrow promo-arrow-left"
        onClick={goToPrevious}
        aria-label="Previous promotion"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        className="promo-arrow promo-arrow-right"
        onClick={goToNext}
        aria-label="Next promotion"
      >
        <ChevronRight size={22} />
      </button>

      <div className="promo-indicators">
        {bannerSlides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={
              index === activeIndex ? "active" : ""
            }
            onClick={() => setActiveIndex(index)}
            aria-label={`Show promotion ${index + 1}`}
            aria-current={
              index === activeIndex ? "true" : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
