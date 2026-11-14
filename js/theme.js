(function () {
  "use strict";

  var storageKey = "autoflow-theme";
  var theme;
  try {
    theme = window.localStorage.getItem(storageKey) === "light" ? "light" : "dark";
  } catch (error) {
    theme = "dark";
    console.warn("[AutoFlow] Theme preference storage is unavailable.", error);
  }
  document.documentElement.setAttribute("data-theme", theme);
  var initialThemeColor = document.querySelector('meta[name="theme-color"]');
  if (initialThemeColor) initialThemeColor.setAttribute("content", theme === "light" ? "#F8FAFC" : "#090A0F");

  function applyTheme(nextTheme, persist) {
    var light = nextTheme === "light";
    document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
    document.querySelectorAll(".theme-toggle").forEach(function (button) {
      button.setAttribute("aria-pressed", String(light));
      button.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
      var label = button.querySelector(".theme-toggle__label");
      if (label) label.textContent = light ? "Switch to dark theme" : "Switch to light theme";
    });
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", light ? "#F8FAFC" : "#090A0F");
    if (persist) {
      try {
        window.localStorage.setItem(storageKey, light ? "light" : "dark");
      } catch (error) {
        console.warn("[AutoFlow] Theme preference could not be saved.", error);
      }
    }
  }

  function bindThemeToggles() {
    applyTheme(theme, false);
    document.querySelectorAll(".theme-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        theme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(theme, true);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindThemeToggles, { once: true });
  } else {
    bindThemeToggles();
  }
}());
