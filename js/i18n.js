(() => {
  const resources = {
    en: {
      translation: {
        app: {
          title: "Dive Decompression Simulator",
          subtitle:
            "Sketch a depth profile to see tissue saturation and decompression stops in real time. Uses a compact B&uuml;hlmann ZHL-16C implementation."
        },
        caution: {
          title: "Use with caution",
          body:
            "This tool is for educational purposes only. It must not be used for real dive planning. It may contain mistakes, is based on approximations, and was not tested for real diving."
        },
        labels: {
          metres: "meters",
          saturation: "saturation (%)",
          minutes: "minutes"
        },
        inputs: {
          totalTime: "Total time (min)",
          maxDepth: "Max depth (m)",
          gfLow: "GF Low (%)",
          gfHigh: "GF High (%)"
        },
        buttons: {
          clear: "Clear"
        },
        info: {
          line1: "The simulator assumes air (21% O<sub>2</sub> / 79% N<sub>2</sub>).",
          line2:
            "The green-to-red line shows relative saturation over time (higher value means more saturation).",
          line3:
            "The dashed ceiling line is the shallowest (nearest-to-surface depth) you're allowed to be at right now based on tissue loading and GF settings. If you go above it (closer to the surface), decompression stops are required before you can ascend further.",
          line4:
            "GF Low applies at depth and GF High applies near the surface, with values blended between them during ascent. Lower GF values make the ceiling deeper (more conservative); higher values let the ceiling sit closer to the surface."
        },
        language: {
          label: "Language",
          english: "English",
          french: "French"
        },
        footer: {
          authorLabel: "Author",
          licenseLabel: "License",
          licenseName: "MIT",
          openGithub: "Open in GitHub"
        },
        units: {
          metersShort: "m"
        }
      }
    },
    fr: {
      translation: {
        app: {
          title: "Simulateur de désaturation en plongée",
          subtitle:
            "Déssinez un profil de plongée pour voir la saturation des tissus et les paliers de décompression en temps réel. Utilise une implémentation compacte du Bühlmann ZHL-16C."
        },
        caution: {
          title: "Utiliser avec prudence",
          body:
            "Cet outil est uniquement à des fins pédagogiques. Il ne doit pas être utilisé pour planifier une plongée réelle. Il peut contenir des erreurs, est basé sur des approximations et n'a pas été testé pour la plongée réelle."
        },
        labels: {
          metres: "mètres",
          saturation: "saturation (%)",
          minutes: "minutes"
        },
        inputs: {
          totalTime: "Durée totale (min)",
          maxDepth: "Profondeur max (m)",
          gfLow: "GF Bas (%)",
          gfHigh: "GF Haut (%)"
        },
        buttons: {
          clear: "Effacer"
        },
        info: {
          line1: "Le simulateur suppose de l'air (21% O<sub>2</sub> / 79% N<sub>2</sub>).",
          line2:
            "La ligne verte à rouge indique la saturation relative dans le temps (valeur plus élevée = plus de saturation).",
          line3:
            "La ligne de plafond en pointillés représente la profondeur la plus faible (la plus proche de la surface) autorisée actuellement selon la charge tissulaire et les réglages GF. Si vous la dépassez (plus près de la surface), des paliers de décompression sont requis avant de pouvoir remonter davantage.",
          line4:
            "GF Bas s'applique en profondeur et GF Haut près de la surface, avec des valeurs interpolées entre les deux lors de la remontée. Des GF plus bas rendent le plafond plus profond (plus conservateur) ; des GF plus élevés le rapprochent de la surface."
        },
        language: {
          label: "Langue",
          english: "Anglais",
          french: "Français"
        },
        footer: {
          authorLabel: "Auteur",
          licenseLabel: "Licence",
          licenseName: "MIT",
          openGithub: "Ouvrir sur GitHub"
        },
        units: {
          metersShort: "m"
        }
      }
    }
  };

  const storageKey = "diveSimLanguage";
  const storedLanguage = window.localStorage ? window.localStorage.getItem(storageKey) : null;
  const browserLanguage = navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
  const initialLanguage = storedLanguage || browserLanguage || "en";
  const languageSelect = document.getElementById("language-select");

  function applyTranslations() {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (!key) return;
      const translation = i18next.t(key);
      if (element.getAttribute("data-i18n-html") === "true") {
        element.innerHTML = translation;
      } else {
        element.textContent = translation;
      }
    });
    document.documentElement.lang = i18next.language;
  }

  function setLanguage(newLanguage) {
    const targetLanguage = newLanguage || "en";
    i18next.changeLanguage(targetLanguage).then(() => {
      applyTranslations();
      if (languageSelect) {
        languageSelect.value = i18next.language;
      }
    });
    if (window.localStorage) {
      window.localStorage.setItem(storageKey, targetLanguage);
    }
  }

  i18next
    .init({
      lng: initialLanguage,
      fallbackLng: "en",
      resources,
      interpolation: { escapeValue: false }
    })
    .then(() => {
      applyTranslations();
      if (languageSelect) {
        languageSelect.value = i18next.language;
      }
    });

  if (languageSelect) {
    languageSelect.addEventListener("change", (event) => {
      setLanguage(event.target.value);
    });
  }
})();
