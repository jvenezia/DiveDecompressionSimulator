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
          metres: "Dive profile",
          saturation: "Tissue nitrogen pressure",
          speed: "Ascent / descent speed (m/min)",
          mValue: "M-values & gradient factors",
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
          airComposition: "The simulator assumes air at 21% Oxygen and 79% Nitrogen.",
          saturationLine:
            "Maximum partial pressure of nitrogen dissolved in the tissues (also called tissue nitrogen tension).",
          compartments:
            "Tissue nitrogen pressures of individual compartments.",
          ceilingZone:
            "Shallowest allowed depth. If you approach it during ascent, decompression stops are required before you can go shallower.",
          stopLines:
            "Recommended stops, derived from the red zone, to avoid exceeding it.",
          profileLine:
            "Dive profile (depth over time).",
          profileHint: "Draw a dive profile",
          speedRecommended:
            "Recommended ascent speed is between 9 and 12 m/min.",
          speedTooSlow:
            "Ascending too slowly continues to increase nitrogen pressure in the tissues.",
          speedTooFast:
            "Ascending too quickly increases the risk of decompression incidents (bubble formation) and other incidents such as pulmonary overpressure.",
          descentGuidance:
            "Descent can be done at a comfortable ear-equalization speed. Tissue nitrogen pressure still accumulates.",
          gfLow:
            "Applies at depth. The lower the value, the deeper the stops begin.",
          gfHigh:
            "Applies near the surface. The lower the value, the longer the stops last.",
          gfNote:
            "Lower GF values make stops deeper and longer, which is more conservative. 100% is the least conservative.",
          mvalueAxisX:
            "The horizontal axis represents ambient nitrogen partial pressure.",
          mvalueAxisY:
            "The vertical axis represents the maximum tissue nitrogen partial pressure allowed by the decompression model.",
          mvalueSubtitle:
            "This chart shows the <b>allowed limit</b> for tissue nitrogen partial pressure based on ambient nitrogen partial pressure. Above it, the risk of bubble formation is considered too high.",
          mvalueLine:
            "M-Value: maximum tissue nitrogen pressure (equivalent to GF Low/High at 100%).",
          mvalueAmbientLine:
            "Ambient pressure (equivalent to GF Low/High at 0%).",
          mvalueGradientLine:
            "Allowable pressure adjusted by the selected GF Low/High.",
          mvalueLowZone:
            "Where GF Low has the most influence (high pressure, depth).",
          mvalueHighZone:
            "Where GF High has the most influence (low pressure, near the surface)."
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
            "Dessinez un profil de plongée pour voir la saturation des tissus et les paliers de désaturation en temps réel. Utilise une implémentation compacte du Bühlmann ZHL-16C.",
          description:
            "Dessinez un profil de plongée pour voir la saturation des tissus et les paliers de désaturation en temps réel. Utilise une implémentation compacte du Bühlmann ZHL-16C."
        },
        caution: {
          title: "Utiliser avec prudence",
          body:
            "Cet outil est uniquement à des fins pédagogiques. Il ne doit pas être utilisé pour planifier une plongée réelle. Il peut contenir des erreurs, est basé sur des approximations et n'a pas été testé pour la plongée réelle."
        },
        labels: {
          metres: "Profil de plongée",
          saturation: "Pression partielle d'azote dissous dans les tissus",
          speed: "Vitesse de remontée / descente (m/min)",
          mValue: "\"M-Value\" et facteurs de gradient (GF)",
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
          airComposition: "Le simulateur suppose de l'air 21% d'oxygène et 79% d'azote.",
          saturationLine:
            "<b>Pression partielle d'azote maximale</b> dissous dans les tissus (ou tension d'azote tissulaire).",
          compartments:
            "Pression partielle d'azote tissulaire de chaque compartiment (utilisés pour déterminer la pression maximale).",
          ceilingZone:
            "Profondeur la plus faible autorisée. En s'y approchant lors de la remontée, des paliers sont requis avant de pouvoir remonter davantage.",
          stopLines:
            "Paliers recommandés, déduits de la zone rouge, afin de ne jamais la dépasser.",
          profileLine:
            "Profil de plongée (profondeur dans le temps).",
          profileHint: "Dessinez un profil de plongée",
          speedRecommended:
            "La vitesse recommandée de remontée est entre 9 et 12 m/min.",
          speedTooSlow:
            "Remonter trop lentement continue d'augmenter la pression d'azote dans les tissus.",
          speedTooFast:
            "Remonter trop rapidement favorise les accidents de désaturation (création de bulles) et d'autres incidents comme la surpression pulmonaire.",
          descentGuidance:
            "La descente peut se faire à la vitesse confortable d'équilibrage des oreilles. La pression d'azote tissulaire s'accumule aussi.",
          gfLow:
            "Agit en profondeur. Plus la valeur est faible, plus les paliers commenceront profonds.",
          gfHigh:
            "Agit près de la surface. Plus la valeur est faible, plus les paliers dureront longtemps.",
          gfNote:
            "Des GF plus bas rendent les paliers plus profonds et plus longs, donc plus conservateurs. 100% est le moins conservateur.",
          mvalueAxisX:
            "L'axe horizontal représente la pression partielle d'azote ambiante.",
          mvalueAxisY:
            "L'axe vertical représente la pression partielle d'azote tissulaire maximale autorisée par l'algorithme de désaturation.",
          mvalueSubtitle:
            "Ce graphique montre la <b>limite autorisée</b> de pression partielle d'azote tissulaire en fonction de la pression partielle d'azote ambiante. Au-dessus, on considère que le risque de création de bulles est trop élevé.",
          mvalueLine:
            "\"M-Value\": pression d'azote tissulaire maximale (équivaut à un GF bas/haut à 100 %).",
          mvalueAmbientLine:
            "Pression ambiante (équivaut à un GF bas/haut à 0 %).",
          mvalueGradientLine:
            "Pression maximale ajustée par les GF bas/haut sélectionnés.",
          mvalueLowZone:
            "Zone d'effet du GF bas (haute pression, donc en profondeur).",
          mvalueHighZone:
            "Zone d'effet du GF haut (basse pression, donc vers la surface)."
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
