(() => {
  const resources = {
    en: {
      translation: {
        app: {
          title: "Dive Decompression Simulator",
          subtitle:
            "Sketch a depth profile to see tissue saturation and decompression stops in real time. Uses a compact Bühlmann ZHL-16C implementation.",
          description:
            "Sketch a depth profile to see tissue saturation and decompression stops in real time. Uses a compact Buhlmann ZHL-16C implementation."
        },
        caution: {
          title: "Use with caution",
          body:
            "This tool is for educational purposes only. It must not be used for real dive planning. It may contain mistakes, is based on approximations, and was not tested for real diving."
        },
        labels: {
          metres: "Depth",
          saturation: "Tissue nitrogen partial pressure",
          minutes: "Time"
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
        params: {
          title: "Dive parameters",
          maxDepth: "Max depth",
          avgDepth: "Avg depth",
          duration: "Duration"
        },
        stops: {
          title: "Recommended stops",
          depth: "Depth",
          time: "Duration",
          empty: "No stops required."
        },
        info: {
          line1: "The simulator assumes air at 21% Oxygen and 79% Nitrogen.",
          line2:
            "The green-to-red line shows the <b>highest tissue nitrogen partial pressure</b> over time (higher value means more loading).",
          line3:
            "The red ceiling zone marks the shallowest (nearest-to-surface depth) you're allowed to be at right now. If you approach that zone during ascent, decompression stops are required before you can go shallower. This is the zone computed by the Bühlmann algorithm.",
          line4:
            "The horizontal red lines indicate the recommended stops. They are derived from the red zone to avoid ever exceeding it.",
          line5:
            "<b>GF Low</b> applies at depth. The lower the value, the deeper the stops begin.<br><b>GF High</b> applies near the surface. The lower the value, the longer the stops last.<br>Lower GF values make stops deeper and longer, which is more conservative. 100% is the least conservative."
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
            "Déssinez un profil de plongée pour voir la saturation des tissus et les paliers de désaturation en temps réel. Utilise une implémentation compacte du Bühlmann ZHL-16C.",
          description:
            "Déssinez un profil de plongée pour voir la saturation des tissus et les paliers de désaturation en temps réel. Utilise une implémentation compacte du Buhlmann ZHL-16C."
        },
        caution: {
          title: "Utiliser avec prudence",
          body:
            "Cet outil est uniquement à des fins pédagogiques. Il ne doit pas être utilisé pour planifier une plongée réelle. Il peut contenir des erreurs, est basé sur des approximations et n'a pas été testé pour la plongée réelle."
        },
        labels: {
          metres: "Profondeur",
          saturation: "Pression partielle d'azone des tissus",
          minutes: "Temps"
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
        params: {
          title: "Paramètres de plongée",
          maxDepth: "Profondeur max",
          avgDepth: "Profondeur moyenne",
          duration: "Durée"
        },
        stops: {
          title: "Paliers recommandés",
          depth: "Profondeur",
          time: "Durée",
          empty: "Aucun palier requis."
        },
        info: {
          line1: "Le simulateur suppose de l'air 21% d'oxygène et 79% d'azote.",
          line2:
            "La ligne verte/rouge indique la <b>pression partielle d'azote maximale</b> dans les tissus (valeur plus élevée = plus de charge).",
          line3:
            "La zone rouge indique la profondeur la plus faible autorisée. En s'y approchant lors de la remontée, des paliers sont requis avant de pouvoir remonter davantage.<br>C'est cette zone que l'algorithme Bühlmann calcule.",
          line4:
            "Les lignes rouges horizontales indiquent les paliers recommandés. Ils sont déduits de la zone rouge, afin de ne jamais la dépasser.",
          line5:
            "<b>GF Bas</b> agit en profondeur. Plus la valeur est faible, plus les paliers commenceront profonds.<br><b>GF Haut</b> agit près de la surface. Plus la valeur est faible, plus les paliers dureront longtemps.<br>Des GF plus bas rendent les paliers plus profonds et plus longs, donc plus conservateurs. 100% est le moins conservateur."
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
      const targetAttribute = element.getAttribute("data-i18n-attr");
      if (targetAttribute) {
        element.setAttribute(targetAttribute, translation);
        return;
      }
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
