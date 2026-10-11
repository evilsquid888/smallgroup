(function () {
  const films = Array.from(document.querySelectorAll(".film"));
  let active = null;

  function speak(text, onend) {
    if (!window.speechSynthesis) {
      onend();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(function (item) {
      return /en(-|_)?(US|GB)/i.test(item.lang) && /andrew|brian|guy|ryan|daniel|david|mark/i.test(item.name);
    }) || voices.find(function (item) {
      return item.lang && item.lang.toLowerCase().startsWith("en");
    });
    if (voice) utter.voice = voice;
    utter.onend = onend;
    utter.onerror = onend;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function Film(figure) {
    this.figure = figure;
    this.video = figure.querySelector("video");
    this.hear = figure.querySelector(".hear");
    this.toggle = figure.querySelector(".toggle");
    this.label = figure.querySelector(".label");
    this.homeLabel = this.label.textContent;
    this.ref = figure.dataset.ref;
    this.mode = "idle";
    this.usingVoice = false;
    const self = this;
    this.hear.addEventListener("click", function () { self.play(); });
    this.toggle.addEventListener("click", function () { self.onToggle(); });
    this.video.addEventListener("ended", function () {
      if (self.mode === "playing" && !self.usingVoice) self.stop();
    });
    this.video.addEventListener("error", function () {
      if (self.mode === "playing" && !self.usingVoice) self.useVoice();
    });
  }

  Film.prototype.paint = function () {
    this.figure.classList.toggle("is-playing", this.mode === "playing");
    this.figure.classList.toggle("is-paused", this.mode === "paused");
    this.label.textContent = this.mode === "idle" ? this.homeLabel : "Pause";
    this.toggle.textContent = this.mode === "paused" ? "Resume" : "Pause";
  };

  Film.prototype.play = function () {
    if (active && active !== this) active.stop();
    active = this;
    this.mode = "playing";
    this.usingVoice = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.video.muted = false;
    if (this.video.ended) this.video.currentTime = 0;
    this.paint();
    const self = this;
    const pending = this.video.play();
    if (pending && pending.catch) {
      pending.catch(function () { self.useVoice(); });
    }
  };

  Film.prototype.useVoice = function () {
    if (this.usingVoice || this.mode !== "playing") return;
    this.usingVoice = true;
    const text = this.ref + ". " + this.figure.querySelector("figcaption p").innerText;
    const self = this;
    speak(text, function () {
      if (self.mode === "playing" && self.usingVoice) self.stop();
    });
  };

  Film.prototype.onToggle = function () {
    if (this.mode === "playing") {
      this.mode = "paused";
      this.video.pause();
      if (window.speechSynthesis) window.speechSynthesis.pause();
      this.paint();
      return;
    }
    if (this.mode === "paused") {
      this.mode = "playing";
      this.paint();
      if (this.usingVoice && window.speechSynthesis) window.speechSynthesis.resume();
      else this.video.play();
    }
  };

  Film.prototype.stop = function () {
    this.mode = "idle";
    this.usingVoice = false;
    this.video.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.paint();
    if (active === this) active = null;
  };

  films.forEach(function (figure) { new Film(figure); });

  const presence = document.getElementById("note-presence");
  const offering = document.getElementById("note-offering");
  const saveState = document.getElementById("save-state");
  const storeKey = "vocation-2026-notes";

  try {
    const saved = JSON.parse(localStorage.getItem(storeKey) || "{}");
    if (saved.presence) presence.value = saved.presence;
    if (saved.offering) offering.value = saved.offering;
  } catch (error) {
    /* Notes stay empty if storage is unavailable. */
  }

  function persist() {
    const payload = { presence: presence.value, offering: offering.value };
    try {
      localStorage.setItem(storeKey, JSON.stringify(payload));
      saveState.hidden = false;
    } catch (error) {
      saveState.hidden = true;
    }
  }

  presence.addEventListener("input", persist);
  offering.addEventListener("input", persist);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const hero = document.querySelector(".hero-media");
    if (hero) {
      hero.pause();
      hero.removeAttribute("autoplay");
    }
  }
})();
