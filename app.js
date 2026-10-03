(() => {
  const config = window.INVITATION_CONFIG;
  if (!config) return;

  const shareTitle = `The Debut of ${config.celebrantName}`;
  const shareDescription = `${config.dateText} · ${config.venueName} ${config.venueDescription}`;
  document.title = shareTitle;
  document.querySelector('meta[name="description"]').content = `An evening of roses, music, and celebration. Join ${config.celebrantName} for her debut on ${config.dateText}.`;
  document.querySelector('meta[property="og:title"]').content = shareTitle;
  document.querySelector('meta[property="og:description"]').content = shareDescription;
  document.querySelector('meta[property="og:image"]').content = config.portraitImage;

  const setText = (key, value) => {
    document.querySelectorAll(`[data-content="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  };

  ["celebrantName", "invitationLine", "dateText", "timeText", "venueName", "venueDescription", "venueAddress", "dressCode", "rsvpDeadline", "hashtag"].forEach((key) => setText(key, config[key]));
  const heroName = document.querySelector("[data-hero-name]");
  const nameParts = config.celebrantName.trim().split(/\s+/);
  if (nameParts.length > 2) {
    heroName.replaceChildren(document.createTextNode(`${nameParts.slice(0, -1).join(" ")} `), document.createElement("br"), document.createTextNode(nameParts.at(-1)));
  } else {
    heroName.textContent = config.celebrantName;
  }

  const portrait = document.querySelector(".portrait-image");
  portrait.src = config.portraitImage;
  portrait.addEventListener("load", () => portrait.classList.add("is-loaded"));
  portrait.addEventListener("error", () => portrait.classList.add("is-missing"));

  document.querySelectorAll('[data-link="mapsLink"], [data-link="directionsLink"]').forEach((link) => {
    link.href = config[link.dataset.link];
  });
  const eventDateLabel = document.querySelector('.event-schedule time[data-content="dateText"]');
  if (eventDateLabel) eventDateLabel.dateTime = config.eventDate;

  const carousel = document.querySelector("[data-carousel]");
  const carouselStage = carousel.querySelector("[data-carousel-stage]");
  const carouselRing = carousel.querySelector("[data-carousel-ring]");
  const carouselImages = Array.isArray(config.galleryImages) && config.galleryImages.length
    ? config.galleryImages
    : [config.portraitImage];
  const carouselAngle = 360 / carouselImages.length;
  let carouselRadius = 0;
  let carouselRotation = 0;
  let dragStartX = null;
  let dragStartRotation = 0;

  carouselImages.forEach((imagePath, index) => {
    const slide = document.createElement("figure");
    slide.className = "carousel-slide";
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${index + 1} of ${carouselImages.length}`);
    const image = document.createElement("img");
    image.src = imagePath;
    image.alt = `${config.celebrantName} at her debut`;
    image.draggable = false;
    slide.append(image);
    carouselRing.append(slide);
  });

  const layoutCarousel = () => {
    const slideWidth = carouselRing.querySelector(".carousel-slide").offsetWidth;
    carouselRadius = carouselImages.length > 1
      ? (slideWidth + 12) / (2 * Math.tan(Math.PI / carouselImages.length))
      : 0;
    carouselRing.querySelectorAll(".carousel-slide").forEach((slide, index) => {
      slide.style.transform = `translate(-50%, -50%) rotateY(${index * carouselAngle}deg) translateZ(${carouselRadius}px)`;
    });
  };

  const updateCarousel = () => {
    carouselRing.style.transform = `rotateY(${-carouselRotation}deg)`;
  };
  carouselStage.addEventListener("pointerdown", (event) => {
    dragStartX = event.clientX;
    dragStartRotation = carouselRotation;
    carouselStage.classList.add("is-dragging");
    carouselStage.setPointerCapture(event.pointerId);
  });
  carouselStage.addEventListener("pointermove", (event) => {
    if (dragStartX === null) return;
    carouselRotation = dragStartRotation - (event.clientX - dragStartX) * 0.45;
    updateCarousel();
  });
  const endCarouselDrag = () => {
    dragStartX = null;
    carouselStage.classList.remove("is-dragging");
  };
  carouselStage.addEventListener("pointerup", endCarouselDrag);
  carouselStage.addEventListener("pointercancel", endCarouselDrag);
  carouselStage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      carouselRotation += event.key === "ArrowLeft" ? -carouselAngle : carouselAngle;
      updateCarousel();
    }
  });
  layoutCarousel();
  new ResizeObserver(layoutCarousel).observe(carouselStage);
  if (carouselImages.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let previousFrameTime = null;
    const animateCarousel = (frameTime) => {
      if (previousFrameTime === null) previousFrameTime = frameTime;
      const elapsed = Math.min(frameTime - previousFrameTime, 50);
      previousFrameTime = frameTime;
      if (dragStartX === null && !document.hidden) {
        carouselRotation += elapsed * 0.006;
        updateCarousel();
      }
      window.requestAnimationFrame(animateCarousel);
    };
    window.requestAnimationFrame(animateCarousel);
  }
  updateCarousel();

  const map = document.querySelector(".map-frame iframe");
  map.src = `https://www.google.com/maps?q=${encodeURIComponent(config.mapsQuery)}&output=embed`;

  const entourageGroups = document.querySelector("[data-entourage-groups]");
  config.entourageGroups.forEach((group) => {
    const groupSection = document.createElement("section");
    groupSection.className = "entourage-group";
    const heading = document.createElement("h3");
    heading.className = "entourage-group-title";
    heading.textContent = group.title;
    const list = document.createElement("ol");
    list.className = "entourage-list";
    const names = group.names.slice(0, 18).map((name) => name.trim());
    while (names.length < 18) names.push(config.openNamePlaceholder);
    names.forEach((name, index) => {
      const item = document.createElement("li");
      item.innerHTML = `<span class="entourage-number">${String(index + 1).padStart(2, "0")}</span><span class="entourage-name"></span><span class="entourage-rose" aria-hidden="true">✦</span>`;
      item.querySelector(".entourage-name").textContent = name;
      list.append(item);
    });
    groupSection.append(heading, list);
    entourageGroups.append(groupSection);
  });

  const countdown = document.querySelector(".countdown-grid");
  const countdownNote = document.querySelector("[data-countdown-note]");
  const target = new Date(config.eventDate).getTime();
  const tick = () => {
    const remaining = target - Date.now();
    if (remaining <= 0) {
      countdown.hidden = true;
      countdownNote.textContent = "The celebration has begun";
      return;
    }
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    [days, hours, minutes, seconds].forEach((value, index) => {
      countdown.querySelectorAll("[data-time]")[index].textContent = String(value).padStart(2, "0");
    });
  };
  tick();
  window.setInterval(tick, 1000);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach((section) => observer.observe(section));

  const petalField = document.querySelector(".petal-field");
  for (let index = 0; index < 16; index += 1) {
    const petal = document.createElement("span");
    petal.className = "falling-petal";
    petal.style.setProperty("--x", `${Math.random() * 100}%`);
    petal.style.setProperty("--delay", `${Math.random() * -26}s`);
    petal.style.setProperty("--duration", `${18 + Math.random() * 18}s`);
    petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    petalField.append(petal);
  }

  const music = document.querySelector("[data-music]");
  const musicToggle = document.querySelector(".music-toggle");
  if (config.musicFile) music.src = config.musicFile;
  musicToggle.addEventListener("click", async () => {
    if (!config.musicFile) {
      musicToggle.querySelector(".music-label").textContent = "Add music in config";
      return;
    }
    if (music.paused) {
      try {
        await music.play();
        musicToggle.setAttribute("aria-pressed", "true");
        musicToggle.setAttribute("aria-label", "Pause background music");
        musicToggle.querySelector(".music-label").textContent = "Sound on";
      } catch {
        musicToggle.querySelector(".music-label").textContent = "Music unavailable";
      }
    } else {
      music.pause();
      musicToggle.setAttribute("aria-pressed", "false");
      musicToggle.setAttribute("aria-label", "Play background music");
      musicToggle.querySelector(".music-label").textContent = "Sound off";
    }
  });

  const form = document.querySelector("[data-rsvp-form]");
  const status = document.querySelector("[data-form-status]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector(".submit-button");
    submitButton.disabled = true;
    status.textContent = "";
    const formData = Object.fromEntries(new FormData(form).entries());
    try {
      if (config.rsvpEndpoint) {
        const response = await fetch(config.rsvpEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error("RSVP could not be sent.");
      }
      status.textContent = config.rsvpEndpoint ? "Thank you. Your reply has been received." : "Thank you for your reply. Add your RSVP endpoint in config.js to receive responses.";
      form.reset();
    } catch {
      status.textContent = "We couldn't send your reply just now. Please try again or contact the host.";
    } finally {
      submitButton.disabled = false;
    }
  });
})();